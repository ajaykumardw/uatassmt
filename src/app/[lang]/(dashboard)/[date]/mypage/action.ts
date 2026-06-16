"use server"

import { Workbook } from 'exceljs'

import prisma from '@/libs/prisma';

import { STUDENT_RESULT } from "@/configs/customDataConfig";

export async function passCandidates(formData: FormData) {
  const usedRandoms = new Set<string>();

  const generateCertificateNo = (batch: any): string => {
    const tp = batch.training_partner;
    const companyName = tp?.company_name || "";
    let tpShortName = "";

    const match = companyName.match(/\(([^)]+)\)/);

    if (match) {
      tpShortName = match[1];
    } else {
      tpShortName = companyName
        .split(" ")
        .map((word: string) => word[0])
        .filter((char: string) => /[A-Za-z]/.test(char))
        .join("");
    }

    const tpStateCode = tp?.state?.state_code;

    let num: string;

    do {
      num = String(Math.floor(100 + Math.random() * 900));
    } while (usedRandoms.has(num));

    usedRandoms.add(num);

    const agencyShortName = 'VISTA';

    return [agencyShortName, tpShortName, tpStateCode, num]
      .filter(Boolean)
      .join("|");
  };

  // --- Extract file & password from form ---
  const file = formData.get("file") as File;
  const password = formData.get("password") as string;

  if (!file) throw new Error("File is required");
  if (!password) throw new Error("Password is required");

  // --- Parse Excel workbook ---
  const workbook = new Workbook();

  await workbook.xlsx.load(await file.arrayBuffer());

  const sheet = workbook.worksheets[0];

  if (!sheet) throw new Error("No worksheet found in the Excel file");

  const rows = sheet.getRows(2, sheet.rowCount - 1) || [];

  // --- Group rows by batch (batch_name | candidate_id | target_percentage) ---
  const batchGroups = new Map<string, {
    candidates: Array<{ rowNumber: number; candidateId: string; targetPercent: number | null }>;
    batchTargetPercent: number | null;
  }>();

  for (const row of rows) {
    const rowNumber = row.number;
    const batchName = row.getCell(1).text.trim();
    const candidateId = row.getCell(2).text.trim();
    const percentCell = row.getCell(3)?.text?.trim();

    if (!batchName || !candidateId) continue;

    let targetPercent: number | null = null;

    if (percentCell) {
      const parsed = parseFloat(percentCell.replace('%', ''));

      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        targetPercent = parsed;
      }
    }

    if (!batchGroups.has(batchName)) {
      batchGroups.set(batchName, { candidates: [], batchTargetPercent: null });
    }

    const group = batchGroups.get(batchName)!;

    group.candidates.push({ rowNumber, candidateId, targetPercent });
  }

  // Batch-level target: only if ALL candidates in batch share the SAME percentage
  for (const [, bg] of batchGroups) {
    const nonNullPercents = bg.candidates
      .map(c => c.targetPercent)
      .filter((p): p is number => p !== null);

    if (nonNullPercents.length > 0 && nonNullPercents.every(p => p === nonNullPercents[0])) {
      bg.batchTargetPercent = nonNullPercents[0];
    }
  }

  // --- Results ---
  const logs: Array<{
    row: number;
    batch_name: string;
    candidate_id: string;
    candidate_name?: string;
    status: string;
    old_correct?: number;
    new_correct?: number;
    old_incorrect?: number;
    new_incorrect?: number;
    target_percentage?: number;
    actual_percentage?: number;
  }> = [];

  const batchStats: Array<{
    batch_name: string;
    total_students: number;
    passed_students: number;
    average_pass_percentage: number | null;
    batch_target_percentage: number | null;
  }> = [];

  // --- Process each batch group ---
  for (const [batchName, group] of batchGroups) {
    try {
      // ---- 1. Get batch (once per group) ----
      const batch = await prisma.batches.findUnique({
        where: { batch_name: batchName },
        include: {
          qualification_pack: { select: { theory_cutoff_marks: true } },
          training_partner: {
            select: {
              company_name: true,
              state: { select: { state_code: true } }
            }
          }
        }
      });

      if (!batch) {
        for (const { rowNumber, candidateId } of group.candidates) {
          logs.push({ row: rowNumber, batch_name: batchName, candidate_id: candidateId, status: "Failed: Batch not found" });
        }

        continue;
      }

      // =====================================================================
      // OPTIMIZATION: Batch all DB reads before processing candidates.
      // Instead of N queries per candidate, we do 4 total queries for the batch.
      // =====================================================================

      // ---- 2a. Fetch all batch students at once (1 query vs N) ----
      const allStudents = await prisma.students.findMany({
        where: { batch_id: batch.id }
      });

      const studentsByCandidateId = new Map(allStudents.map(s => [s.candidate_id, s]));

      // ---- 2b. Check theory exam set (fail fast for the whole batch) ----
      const theoryExamSetId = batch.theory_exam_set_id;

      if (!theoryExamSetId) {
        for (const { rowNumber, candidateId } of group.candidates) {
          const s = studentsByCandidateId.get(candidateId);

          logs.push({
            row: rowNumber, batch_name: batchName, candidate_id: candidateId,
            candidate_name: s?.candidate_name,
            status: "Failed: No theory exam set assigned to this batch"
          });
        }

        continue;
      }

      // ---- 2c. Batch fetch exam results & questions in parallel (3 queries total) ----
      const allStudentIds = allStudents.map(s => s.id);

      const [allStudentExamResults, allExamResults, examSetQuestions] = await Promise.all([
        prisma.student_exam_set_results.findMany({
          where: { student_id: { in: allStudentIds }, exam_set_id: theoryExamSetId }
        }),
        prisma.exam_set_results.findMany({
          where: { student_id: { in: allStudentIds }, exam_set_id: theoryExamSetId },
          select: { id: true, student_id: true, question_id: true, student_answer: true, correct_answer: true }
        }),
        prisma.exam_sets_questions.findMany({
          where: { exam_set_id: theoryExamSetId },
          select: { question_id: true, marks: true }
        })
      ]);

      // ---- 2d. Build in-memory lookup maps (fast, no DB) ----
      const studentExamResultsByStudentId = new Map(allStudentExamResults.map(r => [r.student_id, r]));
      const examResultsByStudentId = new Map<number, typeof allExamResults>();

      for (const r of allExamResults) {
        if (!examResultsByStudentId.has(r.student_id)) examResultsByStudentId.set(r.student_id, []);
        examResultsByStudentId.get(r.student_id)!.push(r);
      }

      const marksMap = new Map(examSetQuestions.map(eq => [eq.question_id, eq.marks]));
      const totalMarks = examSetQuestions.reduce((sum, eq) => sum + eq.marks, 0);

      // Pre-built correct_answer lookup (eliminates extra query for toUpdateRecords)
      const examResultCorrectMap = new Map(allExamResults.map(r => [r.id, r.correct_answer]));

      // ---- 3. Process each listed candidate (zero per-candidate DB reads) ----
      for (const { rowNumber, candidateId, targetPercent } of group.candidates) {
        try {
          // In-memory lookup (zero DB queries)
          const student = studentsByCandidateId.get(candidateId);

          if (!student) {
            logs.push({ row: rowNumber, batch_name: batchName, candidate_id: candidateId, status: "Failed: Candidate not found in this batch" });
            continue;
          }

          // In-memory lookup (zero DB queries)
          const studentExamResult = studentExamResultsByStudentId.get(student.id);

          if (!studentExamResult) {
            logs.push({ row: rowNumber, batch_name: batchName, candidate_id: candidateId, candidate_name: student.candidate_name, status: "Failed: No exam attempt found for theory exam" });
            continue;
          }

          // In-memory lookup (zero DB queries)
          const examResults = examResultsByStudentId.get(student.id);

          if (!examResults || examResults.length === 0) {
            logs.push({ row: rowNumber, batch_name: batchName, candidate_id: candidateId, candidate_name: student.candidate_name, status: "Failed: No question results found" });
            continue;
          }

          const incorrectList: Array<{ id: number; question_id: number; marks: number }> = [];
          let currentCorrectCount = 0;
          let currentCorrectMarks = 0;

          // Deduplicate by question_id (exam_set_results can have duplicate entries)
          const uniqueResults = new Map<number, typeof examResults[0]>();

          for (const er of examResults) {
            if (!uniqueResults.has(er.question_id)) {
              uniqueResults.set(er.question_id, er);
            } else if (er.student_answer === er.correct_answer) {
              uniqueResults.set(er.question_id, er);
            }
          }

          for (const er of uniqueResults.values()) {
            const marks = marksMap.get(er.question_id) || 0;

            if (er.student_answer === er.correct_answer) {
              currentCorrectCount++;
              currentCorrectMarks += marks;
            } else {
              incorrectList.push({ id: er.id, question_id: er.question_id, marks });
            }
          }

          const actualPercentage = totalMarks > 0 ? (currentCorrectMarks / totalMarks) * 100 : 0;

          if (student.result !== STUDENT_RESULT.FAIL && student.result !== STUDENT_RESULT.PENDING) {
            logs.push({ row: rowNumber, batch_name: batchName, candidate_id: candidateId, candidate_name: student.candidate_name, status: `Skipped: Result is 'Pass', not 'Fail' or 'Pending'`, actual_percentage: actualPercentage, target_percentage: targetPercent ?? undefined });
            continue;
          }

          // Use candidate's targetPercent if provided, else batch's theory_cutoff_marks
          let targetMarks: number;
          let isExactTarget = false;

          if (targetPercent !== null) {
            isExactTarget = true;
            targetMarks = Math.round((targetPercent / 100) * totalMarks);

            if (currentCorrectMarks >= targetMarks) {
              // Already meets target - pass with certificate_no
              const certificate_no = generateCertificateNo(batch);

              await prisma.students.update({
                where: { id: student.id },
                data: { result: STUDENT_RESULT.PASS, certificate_no, updated_at: student.updated_at }
              });
              logs.push({
                row: rowNumber,
                batch_name: batchName,
                candidate_id: candidateId,
                candidate_name: student.candidate_name,
                status: "Success",
                old_correct: studentExamResult.correct ?? currentCorrectCount,
                new_correct: currentCorrectCount,
                old_incorrect: studentExamResult.incorrect ?? incorrectList.length,
                new_incorrect: incorrectList.length,
                target_percentage: targetPercent ?? undefined,
                actual_percentage: actualPercentage,
              });
              continue;
            }
          } else {
            const cutoffPercent = Number(batch.qualification_pack.theory_cutoff_marks) || 0;

            if (cutoffPercent === 0) {
              logs.push({ row: rowNumber, batch_name: batchName, candidate_id: candidateId, candidate_name: student.candidate_name, status: "Failed: Theory cutoff marks not configured" });
              continue;
            }

            targetMarks = Math.ceil((cutoffPercent / 100) * totalMarks);

            if (currentCorrectMarks >= targetMarks) {
              // Already meets cutoff - pass with certificate_no
              const certificate_no = generateCertificateNo(batch);

              await prisma.students.update({
                where: { id: student.id },
                data: { result: STUDENT_RESULT.PASS, certificate_no, updated_at: student.updated_at }
              });
              logs.push({
                row: rowNumber,
                batch_name: batchName,
                candidate_id: candidateId,
                candidate_name: student.candidate_name,
                status: "Success",
                old_correct: studentExamResult.correct ?? currentCorrectCount,
                new_correct: currentCorrectCount,
                old_incorrect: studentExamResult.incorrect ?? incorrectList.length,
                new_incorrect: incorrectList.length,
                target_percentage: targetPercent ?? undefined,
                actual_percentage: actualPercentage,
              });
              continue;
            }
          }

          if (incorrectList.length === 0) {
            logs.push({ row: rowNumber, batch_name: batchName, candidate_id: candidateId, candidate_name: student.candidate_name, status: "Failed: No incorrect answers to correct", actual_percentage: actualPercentage, target_percentage: targetPercent ?? undefined });
            continue;
          }

          const neededMarks = targetMarks - currentCorrectMarks;
          const shuffled = [...incorrectList].sort(() => Math.random() - 0.5);

          let toCorrect: Array<number> = [];
          let correctedMarks = 0;
          let achievedPct = 0;
          let isExactMatch = true;

          if (isExactTarget) {
            // DP (0/1 knapsack): find exact or closest sum to neededMarks
            const maxSum = Math.ceil(totalMarks);
            const dp = new Array(maxSum + 1).fill(false);
            const prev = new Array(maxSum + 1).fill(-1);
            const prevSum = new Array(maxSum + 1).fill(-1);

            dp[0] = true;

            for (let i = 0; i < incorrectList.length; i++) {
              const m = incorrectList[i].marks;

              for (let s = maxSum - m; s >= 0; s--) {
                if (dp[s] && !dp[s + m]) {
                  dp[s + m] = true;
                  prev[s + m] = i;
                  prevSum[s + m] = s;
                }
              }
            }

            let bestSum: number;

            isExactMatch = dp[neededMarks];

            if (isExactMatch) {
              bestSum = neededMarks;
            } else {
              bestSum = 0;

              for (let s = 0; s <= maxSum; s++) {
                if (dp[s] && Math.abs(neededMarks - s) < Math.abs(neededMarks - bestSum)) {
                  bestSum = s;
                }
              }
            }

            // Backtrack
            const selected: typeof incorrectList = [];
            let cur = bestSum;

            while (cur > 0) {
              selected.push(incorrectList[prev[cur]]);
              cur = prevSum[cur];
            }

            toCorrect = selected.map(q => q.id);
            correctedMarks = bestSum;

            if (toCorrect.length === 0) {
              logs.push({
                row: rowNumber, batch_name: batchName, candidate_id: candidateId,
                candidate_name: student.candidate_name,
                status: `Failed: Cannot achieve target ${targetPercent}% (no corrigible questions)`,
                actual_percentage: actualPercentage, target_percentage: targetPercent ?? undefined
              });
              continue;
            }

            achievedPct = totalMarks > 0 ? ((currentCorrectMarks + bestSum) / totalMarks * 100) : 0;

          } else {
            // Cutoff mode: greedy + random extra
            const mustCorrect = new Set<number>();
            let accumulatedMarks = 0;

            for (const q of shuffled) {
              if (accumulatedMarks >= neededMarks) break;
              mustCorrect.add(q.id);
              accumulatedMarks += q.marks;
            }

            if (accumulatedMarks < neededMarks) {
              for (const q of shuffled) {
                mustCorrect.add(q.id);
              }

              accumulatedMarks = shuffled.reduce((sum, q) => sum + q.marks, 0);
            }

            const remainingOptional = shuffled.filter(q => !mustCorrect.has(q.id));

            toCorrect = [...mustCorrect];
            correctedMarks = accumulatedMarks;

            if (remainingOptional.length > 0) {
              const maxExtra = remainingOptional.length - 1;

              if (maxExtra > 0) {
                remainingOptional.sort(() => Math.random() - 0.5);
                const extraCount = Math.floor(Math.random() * (maxExtra + 1));

                for (let i = 0; i < extraCount; i++) {
                  toCorrect.push(remainingOptional[i].id);
                  correctedMarks += remainingOptional[i].marks;
                }
              }
            }
          }

          const newActualPercentage = totalMarks > 0 ? ((currentCorrectMarks + correctedMarks) / totalMarks) * 100 : 0;

          // Use pre-fetched data instead of an extra DB query
          const toUpdateRecords = toCorrect
            .map(id => ({ id, correct_answer: examResultCorrectMap.get(id) }))
            .filter((r): r is { id: number; correct_answer: number } => r.correct_answer !== undefined);

          await prisma.$transaction(
            toUpdateRecords.map(record =>
              prisma.exam_set_results.update({
                where: { id: record.id },
                data: { student_answer: record.correct_answer }
              })
            )
          );

          const newCorrectCount = currentCorrectCount + toCorrect.length;
          const newIncorrectCount = incorrectList.length - toCorrect.length;

          await prisma.student_exam_set_results.update({
            where: {
              student_id_exam_set_id: { student_id: student.id, exam_set_id: theoryExamSetId }
            },
            data: { correct: newCorrectCount, incorrect: newIncorrectCount }
          });

          const certificate_no = generateCertificateNo(batch);

              await prisma.students.update({
                where: { id: student.id },
                data: { result: STUDENT_RESULT.PASS, certificate_no, is_auto: 1, updated_at: student.updated_at }
              });

          const successStatus = isExactMatch ? "Success" : `Success (closest: ${achievedPct.toFixed(2)}%, target: ${targetPercent}%)`;

          logs.push({
            row: rowNumber,
            batch_name: batchName,
            candidate_id: candidateId,
            candidate_name: student.candidate_name,
            status: successStatus,
            old_correct: studentExamResult.correct ?? currentCorrectCount,
            new_correct: newCorrectCount,
            old_incorrect: studentExamResult.incorrect ?? incorrectList.length,
            new_incorrect: newIncorrectCount,
            target_percentage: targetPercent ?? undefined,
            actual_percentage: isExactMatch ? newActualPercentage : achievedPct,
          });

        } catch (error: any) {
          logs.push({
            row: rowNumber,
            batch_name: batchName,
            candidate_id: candidateId,
            status: `Error: ${error.message}`,
          });
        }
      }

      // ---- 3. Auto-pass additional candidates to meet batch target % ----
      if (group.batchTargetPercent !== null) {
        const [totalStudents, passedStudents] = await Promise.all([
          prisma.students.count({ where: { batch_id: batch.id } }),
          prisma.students.count({ where: { batch_id: batch.id, result: STUDENT_RESULT.PASS } })
        ]);

        const currentPercent = totalStudents > 0 ? (passedStudents / totalStudents) * 100 : 0;

        if (currentPercent < group.batchTargetPercent) {
          const targetPassCount = Math.ceil((group.batchTargetPercent / 100) * totalStudents);
          const additionalNeeded = targetPassCount - passedStudents;

          if (additionalNeeded > 0) {
            const processedCandidateIds = new Set(group.candidates.map(c => c.candidateId));

            const failedStudents = await prisma.students.findMany({
              where: {
                batch_id: batch.id,
                result: STUDENT_RESULT.FAIL,
                candidate_id: { notIn: [...processedCandidateIds] }
              }
            });

            const shuffled = [...failedStudents].sort(() => Math.random() - 0.5);
            const toAutoPass = shuffled.slice(0, Math.min(additionalNeeded, shuffled.length));

            for (const student of toAutoPass) {
              const certificate_no = generateCertificateNo(batch);

              await prisma.students.update({
                where: { id: student.id },
                  data: { result: STUDENT_RESULT.PASS, certificate_no, is_auto: 1, updated_at: student.updated_at }
                });

                logs.push({
                  row: 0,
                  batch_name: batchName,
                  candidate_id: student.candidate_id,
                  candidate_name: student.candidate_name,
                  status: "Auto-passed to meet batch percentage target",
              });
            }
          }
        }
      }

      // ---- 4. Collect batch stats for response ----
      const [totalStudents, passedStudents] = await Promise.all([
        prisma.students.count({ where: { batch_id: batch.id } }),
        prisma.students.count({ where: { batch_id: batch.id, result: STUDENT_RESULT.PASS } })
      ]);

      // Calculate average theory percentage of all students in this batch
      let avgPercent: number | null = null;

      if (theoryExamSetId && totalStudents > 0) {
        const allStudents = await prisma.students.findMany({
          where: { batch_id: batch.id },
          select: { id: true }
        });

        const examSetQuestions = await prisma.exam_sets_questions.findMany({
          where: { exam_set_id: theoryExamSetId },
          select: { question_id: true, marks: true }
        });

        if (examSetQuestions.length > 0) {
          const marksMap = new Map(examSetQuestions.map(eq => [eq.question_id, eq.marks]));
          const totalMarks = examSetQuestions.reduce((sum, eq) => sum + eq.marks, 0);

          const examResults = await prisma.exam_set_results.findMany({
            where: {
              student_id: { in: allStudents.map(s => s.id) },
              exam_set_id: theoryExamSetId
            },
            select: { student_id: true, question_id: true, student_answer: true, correct_answer: true }
          });

          const studentMarksMap = new Map<number, number>();

          // Group by student, then deduplicate by question_id per student
          const byStudent = new Map<number, Map<number, typeof examResults[0]>>();

          for (const er of examResults) {
            if (!byStudent.has(er.student_id)) byStudent.set(er.student_id, new Map());
            const studentQ = byStudent.get(er.student_id)!;

            if (!studentQ.has(er.question_id)) {
              studentQ.set(er.question_id, er);
            } else if (er.student_answer === er.correct_answer) {
              studentQ.set(er.question_id, er);
            }
          }

          for (const [sid, qMap] of byStudent) {
            let marks = 0;

            for (const er of qMap.values()) {
              if (er.student_answer === er.correct_answer) {
                marks += marksMap.get(er.question_id) || 0;
              }
            }

            studentMarksMap.set(sid, marks);
          }

          const percentages = allStudents.map(s => {
            const obtainedMarks = studentMarksMap.get(s.id) || 0;

            return totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
          });

          avgPercent = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
        }
      }

      batchStats.push({
        batch_name: batchName,
        total_students: totalStudents,
        passed_students: passedStudents,
        average_pass_percentage: avgPercent,
        batch_target_percentage: group.batchTargetPercent,
      });

    } catch (error: any) {
      for (const { rowNumber, candidateId } of group.candidates) {
        logs.push({
          row: rowNumber,
          batch_name: batchName,
          candidate_id: candidateId,
          status: `Batch error: ${error.message}`,
        });
      }
    }
  }

  return { logs, batchStats };
}
