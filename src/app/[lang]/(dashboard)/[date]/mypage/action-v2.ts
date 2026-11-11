"use server";

import { Workbook } from "exceljs";

import prisma from "@/libs/prisma";

import { STUDENT_RESULT } from "@/configs/customDataConfig";

import {
  planBulkCandidatePass,
  type BulkPassAdjustment,
  type BulkPassAttempt,
  type BulkPassCandidateInput,
  type BulkPassConfig,
  type BulkPassPlan,
  type BulkPassQuestion,
  type BulkPassTheoryResult,
} from "@/libs/bulkCandidatePass";

type CandidateLog = {
  row: number;
  batch_id?: number;
  student_id?: number;
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
  theory_only_percentage?: number;
  requires_adjustment?: boolean;
  adjustment?: BulkPassAdjustment[];
  reason?: string;
};

type BatchStat = {
  batch_name: string;
  total_students: number;
  passed_students: number;
  average_pass_percentage: number | null;
  batch_target_percentage: number | null;
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
};

const getTheoryCounts = (results: BulkPassTheoryResult[]) => {
  const uniqueResults = new Map<number, BulkPassTheoryResult>();

  for (const result of results) {
    const existing = uniqueResults.get(result.questionId);

    if (!existing || result.isCorrect) {
      uniqueResults.set(result.questionId, result);
    }
  }

  let correct = 0;
  let incorrect = 0;

  for (const result of uniqueResults.values()) {
    if (result.isCorrect) {
      correct += 1;
    } else {
      incorrect += 1;
    }
  }

  return { correct, incorrect };
};

const loadBatchContext = async (batchId: number) => {
  const batch = await prisma.batches.findUnique({
    where: { id: batchId },
    include: {
      qualification_pack: true,
      training_partner: {
        select: {
          company_name: true,
          state: { select: { state_code: true } },
        },
      },
    },
  });

  if (!batch) return null;

  const students = await prisma.students.findMany({
    where: { batch_id: batch.id },
    select: {
      id: true,
      candidate_id: true,
      candidate_name: true,
      certificate_no: true,
      result: true,
    },
  });

  const studentIds = students.map((student) => student.id);

  const examSetIds = [
    batch.theory_exam_set_id,
    batch.practical_exam_set_id,
    batch.viva_exam_set_id,
  ].filter((id): id is number => Boolean(id));

  const examSetQuestions = examSetIds.length
    ? await prisma.exam_sets_questions.findMany({
        where: { exam_set_id: { in: examSetIds } },
        select: {
          exam_set_id: true,
          question_id: true,
          marks: true,
          questions: {
            select: {
              question_type: true,
              pc_questions: {
                select: {
                  pc: {
                    select: {
                      id: true,
                      theory_marks: true,
                      practical_marks: true,
                      viva_marks: true,
                      nos: {
                        select: { nos_id: true, nos_name: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })
    : [];

  const examSetType = new Map<number, "theory" | "practical" | "viva">();

  if (batch.theory_exam_set_id) {
    examSetType.set(batch.theory_exam_set_id, "theory");
  }

  if (batch.practical_exam_set_id) {
    examSetType.set(batch.practical_exam_set_id, "practical");
  }

  if (batch.viva_exam_set_id) {
    examSetType.set(batch.viva_exam_set_id, "viva");
  }

  const questions: BulkPassQuestion[] = examSetQuestions.map((item) => ({
    id: item.question_id,
    type:
      examSetType.get(item.exam_set_id) || item.questions.question_type,
    marks: toNumber(item.marks),
    examSetId: item.exam_set_id,
    pcs: item.questions.pc_questions.map((pcQuestion) => ({
      pcId: pcQuestion.pc.id,
      nosCode: pcQuestion.pc.nos.nos_id,
      nosName: pcQuestion.pc.nos.nos_name,
      theoryMarks: toNumber(pcQuestion.pc.theory_marks),
      practicalMarks: toNumber(pcQuestion.pc.practical_marks),
      vivaMarks: toNumber(pcQuestion.pc.viva_marks),
    })),
  }));

  const validAttemptQuestionIds = questions
    .filter(
      (question) =>
        question.type === "practical" || question.type === "viva"
    )
    .map((question) => question.id);

  const theoryResultsPromise =
    batch.theory_exam_set_id && studentIds.length
      ? prisma.exam_set_results.findMany({
          where: {
            exam_set_id: batch.theory_exam_set_id,
            student_id: { in: studentIds },
          },
          select: {
            id: true,
            student_id: true,
            question_id: true,
            student_answer: true,
            correct_answer: true,
          },
        })
      : Promise.resolve([]);

  const attemptsPromise =
    validAttemptQuestionIds.length && studentIds.length
      ? prisma.student_question_attempts.findMany({
          where: {
            student_id: { in: studentIds },
            question_id: { in: validAttemptQuestionIds },
          },
          select: {
            id: true,
            student_id: true,
            question_id: true,
            max_marks: true,
            obtained_marks: true,
          },
        })
      : Promise.resolve([]);

  const studentExamSetResultsPromise =
    batch.theory_exam_set_id && studentIds.length
      ? prisma.student_exam_set_results.findMany({
          where: {
            exam_set_id: batch.theory_exam_set_id,
            student_id: { in: studentIds },
          },
          select: {
            id: true,
            student_id: true,
            correct: true,
            incorrect: true,
          },
        })
      : Promise.resolve([]);

  const [theoryResults, attempts, studentExamSetResults] =
    await Promise.all([
      theoryResultsPromise,
      attemptsPromise,
      studentExamSetResultsPromise,
    ]);

  const theoryResultsByStudent = new Map<
    number,
    BulkPassTheoryResult[]
  >();

  for (const result of theoryResults) {
    const studentResults =
      theoryResultsByStudent.get(result.student_id) || [];

    studentResults.push({
      id: result.id,
      questionId: result.question_id,
      correctAnswer: result.correct_answer,
      isCorrect: result.student_answer === result.correct_answer,
    });

    theoryResultsByStudent.set(result.student_id, studentResults);
  }

  const attemptsByStudent = new Map<number, BulkPassAttempt[]>();

  for (const attempt of attempts) {
    const studentAttempts =
      attemptsByStudent.get(attempt.student_id) || [];

    studentAttempts.push({
      id: attempt.id,
      questionId: attempt.question_id,
      maxMarks: toNumber(attempt.max_marks),
      obtainedMarks: toNumber(attempt.obtained_marks),
    });

    attemptsByStudent.set(attempt.student_id, studentAttempts);
  }

  const studentExamSetResultsByStudent = new Map(
    studentExamSetResults.map((result) => [result.student_id, result])
  );

  const qp = batch.qualification_pack;

  const config: BulkPassConfig = {
    totalTheory: toNumber(qp.total_theory_marks),
    totalPractical: toNumber(qp.total_practical_marks),
    totalViva: toNumber(qp.total_viva_marks),
    theoryCutoff: toNumber(qp.theory_cutoff_marks),
    practicalCutoff: toNumber(qp.practical_cutoff_marks),
    vivaCutoff: toNumber(qp.viva_cutoff_marks),
    overallCutoff: toNumber(qp.overall_cutoff_marks),
    nosCutoff: toNumber(qp.nos_cutoff_marks),
    hasTheory: Boolean(batch.theory_exam_set_id),
    hasPractical: Boolean(batch.practical_exam_set_id),
    hasViva: Boolean(batch.viva_exam_set_id),
  };

  return {
    batch,
    students,
    questions,
    config,
    theoryResultsByStudent,
    attemptsByStudent,
    studentExamSetResultsByStudent,
  };
};

const createCertificateGenerator = () => {
  const usedRandoms = new Set<string>();

  const seedFromStudents = (
    students: Array<{ certificate_no: string | null }>
  ) => {
    for (const student of students) {
      const lastPart = student.certificate_no?.split("|").pop();

      if (lastPart && /^\d{3}$/.test(lastPart)) {
        usedRandoms.add(lastPart);
      }
    }
  };

  const generateCertificateNo = (batch: {
    training_partner?: {
      company_name?: string | null;
      state?: { state_code?: string | null } | null;
    } | null;
  }) => {
    const tp = batch.training_partner;

    const companyName = tp?.company_name || "";

    let tpShortName = "";

    const match = companyName.match(/\(([^)]+)\)/);

    if (match) {
      tpShortName = match[1];
    } else {
      tpShortName = companyName
        .split(" ")
        .map((word) => word[0])
        .filter((char) => /[A-Za-z]/.test(char))
        .join("");
    }

    const tpStateCode = tp?.state?.state_code;

    let num: string;

    do {
      num = String(Math.floor(100 + Math.random() * 900));
    } while (usedRandoms.has(num));

    usedRandoms.add(num);

    const agencyShortName = "VISTA";

    return [agencyShortName, tpShortName, tpStateCode, num]
      .filter(Boolean)
      .join("|");
  };

  return { seedFromStudents, generateCertificateNo };
};

const applyCandidatePlan = async (
  context: NonNullable<Awaited<ReturnType<typeof loadBatchContext>>>,
  student: {
    id: number;
    certificate_no: string | null;
  },
  plan: BulkPassPlan,
  oldCorrect: number,
  oldIncorrect: number,
  generateCertificateNo: (
    batch: NonNullable<Awaited<ReturnType<typeof loadBatchContext>>>["batch"]
  ) => string
) => {
  const studentExamSetResult =
    context.studentExamSetResultsByStudent.get(student.id);

  if (!studentExamSetResult) {
    throw new Error("No theory exam attempt found for this candidate");
  }

  const newCorrect = oldCorrect + plan.selectedCorrections.length;

  const newIncorrect = Math.max(
    0,
    oldIncorrect - plan.selectedCorrections.length
  );

  const finalPass = plan.evaluation.pass;

  const certificateNo = finalPass
    ? student.certificate_no ||
      generateCertificateNo(context.batch)
    : null;

  const updates = [];

  for (const correction of plan.selectedCorrections) {
    updates.push(
      prisma.exam_set_results.update({
        where: { id: correction.resultId },
        data: { student_answer: correction.correctAnswer },
      })
    );
  }

  for (const adjustment of plan.adjustments) {
    updates.push(
      prisma.student_question_attempts.update({
        where: { id: adjustment.attemptId },
        data: { obtained_marks: adjustment.newMarks },
      })
    );
  }

  updates.push(
    prisma.student_exam_set_results.update({
      where: { id: studentExamSetResult.id },
      data: { correct: newCorrect, incorrect: newIncorrect },
    })
  );

  updates.push(
    prisma.students.update({
      where: { id: student.id },
      data: {
        result: finalPass
          ? STUDENT_RESULT.PASS
          : STUDENT_RESULT.FAIL,
        certificate_no: certificateNo,
        is_auto: 1,
      },
    })
  );

  await prisma.$transaction(updates);

  return { newCorrect, newIncorrect, certificateNo };
};

const getSuccessStatus = (
  plan: BulkPassPlan,
  target: number | null
) => {
  if (target === null) {
    if (plan.adjustments.length > 0) {
      return "Success: practical/viva marks adjusted to meet pass criteria";
    }

    return plan.selectedCorrections.length > 0
      ? "Success: theory corrections applied"
      : "Success: already passing";
  }

  if (Math.abs(plan.evaluation.overallPercentage - target) <= 0.01) {
    return "Success: target achieved";
  }

  return `Success (closest: ${plan.evaluation.overallPercentage.toFixed(
    2
  )}%, target: ${target}%)`;
};

const getAverageTheoryPercentage = async (
  context: NonNullable<Awaited<ReturnType<typeof loadBatchContext>>>
) => {
  if (
    !context.batch.theory_exam_set_id ||
    context.students.length === 0
  ) {
    return null;
  }

  const theoryQuestions = context.questions.filter(
    (question) => question.type === "theory"
  );

  const totalMarks = theoryQuestions.reduce(
    (sum, question) => sum + toNumber(question.marks),
    0
  );

  if (totalMarks <= 0) return null;

  const marksByQuestionId = new Map(
    theoryQuestions.map((question) => [
      question.id,
      toNumber(question.marks),
    ])
  );

  const results = await prisma.exam_set_results.findMany({
    where: {
      exam_set_id: context.batch.theory_exam_set_id,
      student_id: {
        in: context.students.map((student) => student.id),
      },
    },
    select: {
      student_id: true,
      question_id: true,
      student_answer: true,
      correct_answer: true,
    },
  });

  const byStudent = new Map<
    number,
    Map<
      number,
      {
        student_answer: number | null;
        correct_answer: number;
      }
    >
  >();

  for (const result of results) {
    if (!byStudent.has(result.student_id)) {
      byStudent.set(result.student_id, new Map());
    }

    const studentQuestions = byStudent.get(result.student_id)!;

    const existing = studentQuestions.get(result.question_id);

    if (
      !existing ||
      result.student_answer === result.correct_answer
    ) {
      studentQuestions.set(result.question_id, {
        student_answer: result.student_answer,
        correct_answer: result.correct_answer,
      });
    }
  }

  const percentages = context.students.map((student) => {
    const studentQuestions = byStudent.get(student.id);

    let obtainedMarks = 0;

    if (studentQuestions) {
      for (const [questionId, result] of studentQuestions) {
        if (result.student_answer === result.correct_answer) {
          obtainedMarks += marksByQuestionId.get(questionId) || 0;
        }
      }
    }

    return (obtainedMarks / totalMarks) * 100;
  });

  return (
    percentages.reduce((sum, percentage) => sum + percentage, 0) /
    percentages.length
  );
};

export async function passCandidates(formData: FormData) {
  const file = formData.get("file") as File;
  const password = formData.get("password") as string;

  if (!file) throw new Error("File is required");
  if (!password) throw new Error("Password is required");

  const workbook = new Workbook();

  await workbook.xlsx.load(await file.arrayBuffer());

  const sheet = workbook.worksheets[0];

  if (!sheet) throw new Error("No worksheet found in the Excel file");

  const rows = sheet.getRows(2, sheet.rowCount - 1) || [];

  const batchGroups = new Map<
    string,
    {
      candidates: Array<{
        rowNumber: number;
        candidateId: string;
        targetPercent: number | null;
      }>;
      batchTargetPercent: number | null;
    }
  >();

  for (const row of rows) {
    const rowNumber = row.number;
    const batchName = row.getCell(1).text.trim();
    const candidateId = row.getCell(2).text.trim();
    const percentCell = row.getCell(3)?.text?.trim();

    if (!batchName || !candidateId) continue;

    let targetPercent: number | null = null;

    if (percentCell) {
      const parsed = parseFloat(percentCell.replace("%", ""));

      if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        targetPercent = parsed;
      }
    }

    if (!batchGroups.has(batchName)) {
      batchGroups.set(batchName, {
        candidates: [],
        batchTargetPercent: null,
      });
    }

    batchGroups
      .get(batchName)!
      .candidates.push({ rowNumber, candidateId, targetPercent });
  }

  for (const [, group] of batchGroups) {
    const nonNullPercents = group.candidates
      .map((candidate) => candidate.targetPercent)
      .filter((percentage): percentage is number => percentage !== null);

    if (
      nonNullPercents.length > 0 &&
      nonNullPercents.every(
        (percentage) => percentage === nonNullPercents[0]
      )
    ) {
      group.batchTargetPercent = nonNullPercents[0];
    }
  }

  const logs: CandidateLog[] = [];
  const batchStats: BatchStat[] = [];

  const certificateGenerator = createCertificateGenerator();

  for (const [batchName, group] of batchGroups) {
    try {
      const batchRecord = await prisma.batches.findUnique({
        where: { batch_name: batchName },
        select: { id: true },
      });

      if (!batchRecord) {
        for (const { rowNumber, candidateId } of group.candidates) {
          logs.push({
            row: rowNumber,
            batch_name: batchName,
            candidate_id: candidateId,
            status: "Failed: Batch not found",
          });
        }

        continue;
      }

      const context = await loadBatchContext(batchRecord.id);

      if (!context) {
        for (const { rowNumber, candidateId } of group.candidates) {
          logs.push({
            row: rowNumber,
            batch_name: batchName,
            candidate_id: candidateId,
            status: "Failed: Batch not found",
          });
        }

        continue;
      }

      certificateGenerator.seedFromStudents(context.students);

      if (!context.batch.theory_exam_set_id) {
        for (const { rowNumber, candidateId } of group.candidates) {
          const student = context.students.find(
            (item) => item.candidate_id === candidateId
          );

          logs.push({
            row: rowNumber,
            batch_id: context.batch.id,
            student_id: student?.id,
            batch_name: batchName,
            candidate_id: candidateId,
            candidate_name: student?.candidate_name,
            status:
              "Failed: No theory exam set assigned to this batch",
          });
        }

        continue;
      }

      const studentsByCandidateId = new Map(
        context.students.map((student) => [
          student.candidate_id,
          student,
        ])
      );

      for (const { rowNumber, candidateId, targetPercent } of group
        .candidates) {
        try {
          const student = studentsByCandidateId.get(candidateId);

          if (!student) {
            logs.push({
              row: rowNumber,
              batch_id: context.batch.id,
              batch_name: batchName,
              candidate_id: candidateId,
              status:
                "Failed: Candidate not found in this batch",
            });

            continue;
          }

          const studentExamSetResult =
            context.studentExamSetResultsByStudent.get(student.id);

          if (!studentExamSetResult) {
            logs.push({
              row: rowNumber,
              batch_id: context.batch.id,
              student_id: student.id,
              batch_name: batchName,
              candidate_id: candidateId,
              candidate_name: student.candidate_name,
              status:
                "Failed: No exam attempt found for theory exam",
            });

            continue;
          }

          const theoryResults =
            context.theoryResultsByStudent.get(student.id) || [];

          if (theoryResults.length === 0) {
            logs.push({
              row: rowNumber,
              batch_id: context.batch.id,
              student_id: student.id,
              batch_name: batchName,
              candidate_id: candidateId,
              candidate_name: student.candidate_name,
              status: "Failed: No question results found",
            });

            continue;
          }

          if (
            student.result !== STUDENT_RESULT.FAIL &&
            student.result !== STUDENT_RESULT.PENDING
          ) {
            logs.push({
              row: rowNumber,
              batch_id: context.batch.id,
              student_id: student.id,
              batch_name: batchName,
              candidate_id: candidateId,
              candidate_name: student.candidate_name,
              status: "Skipped: Result is already Pass",
              target_percentage: targetPercent ?? undefined,
            });

            continue;
          }

          const input: BulkPassCandidateInput = {
            studentId: student.id,
            questions: context.questions,
            config: context.config,
            theoryResults,
            attempts:
              context.attemptsByStudent.get(student.id) || [],
            targetPercent,
          };

          const { theoryPlan, adjustmentPlan, finalPlan } =
            planBulkCandidatePass(input);

          const counts = getTheoryCounts(theoryResults);

          const newCorrect =
            counts.correct + finalPlan.selectedCorrections.length;

          const newIncorrect = Math.max(
            0,
            counts.incorrect - finalPlan.selectedCorrections.length
          );

          if (theoryPlan.satisfiesTarget) {
            await applyCandidatePlan(
              context,
              student,
              theoryPlan,
              counts.correct,
              counts.incorrect,
              certificateGenerator.generateCertificateNo
            );

            logs.push({
              row: rowNumber,
              batch_id: context.batch.id,
              student_id: student.id,
              batch_name: batchName,
              candidate_id: candidateId,
              candidate_name: student.candidate_name,
              status: getSuccessStatus(theoryPlan, targetPercent),
              old_correct: counts.correct,
              new_correct: newCorrect,
              old_incorrect: counts.incorrect,
              new_incorrect: newIncorrect,
              target_percentage: targetPercent ?? undefined,
              actual_percentage: theoryPlan.evaluation.overallPercentage,
              theory_only_percentage:
                theoryPlan.evaluation.overallPercentage,
              requires_adjustment: false,
              reason: theoryPlan.reason,
            });

            continue;
          }

          if (adjustmentPlan?.satisfiesTarget) {
            logs.push({
              row: rowNumber,
              batch_id: context.batch.id,
              student_id: student.id,
              batch_name: batchName,
              candidate_id: candidateId,
              candidate_name: student.candidate_name,
              status:
                "Adjustment required: Practical/Viva marks need approval",
              old_correct: counts.correct,
              new_correct: newCorrect,
              old_incorrect: counts.incorrect,
              new_incorrect: newIncorrect,
              target_percentage: targetPercent ?? undefined,
              actual_percentage:
                adjustmentPlan.evaluation.overallPercentage,
              theory_only_percentage:
                adjustmentPlan.theoryOnlyPercentage,
              requires_adjustment: true,
              adjustment: adjustmentPlan.adjustments,
              reason: adjustmentPlan.reason,
            });

            continue;
          }

          logs.push({
            row: rowNumber,
            batch_id: context.batch.id,
            student_id: student.id,
            batch_name: batchName,
            candidate_id: candidateId,
            candidate_name: student.candidate_name,
            status: `Failed: ${finalPlan.reason}`,
            old_correct: counts.correct,
            new_correct: counts.correct,
            old_incorrect: counts.incorrect,
            new_incorrect: counts.incorrect,
            target_percentage: targetPercent ?? undefined,
            actual_percentage: finalPlan.evaluation.overallPercentage,
            theory_only_percentage:
              finalPlan.evaluation.overallPercentage,
            requires_adjustment: false,
            reason: finalPlan.reason,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";

          logs.push({
            row: rowNumber,
            batch_id: context.batch.id,
            batch_name: batchName,
            candidate_id: candidateId,
            status: `Error: ${message}`,
          });
        }
      }

      const [totalStudents, passedStudents] = await Promise.all([
        prisma.students.count({
          where: { batch_id: context.batch.id },
        }),
        prisma.students.count({
          where: {
            batch_id: context.batch.id,
            result: STUDENT_RESULT.PASS,
          },
        }),
      ]);

      batchStats.push({
        batch_name: batchName,
        total_students: totalStudents,
        passed_students: passedStudents,
        average_pass_percentage:
          await getAverageTheoryPercentage(context),
        batch_target_percentage: group.batchTargetPercent,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";

      for (const { rowNumber, candidateId } of group.candidates) {
        logs.push({
          row: rowNumber,
          batch_name: batchName,
          candidate_id: candidateId,
          status: `Batch error: ${message}`,
        });
      }
    }
  }

  return { logs, batchStats };
}

export async function applyPracticalVivaAdjustment(payload: {
  studentId: number;
  batchId: number;
  targetPercent: number | null;
  password: string;
}) {
  if (!payload.password) {
    throw new Error("Password is required");
  }

  const student = await prisma.students.findUnique({
    where: { id: payload.studentId },
    select: {
      id: true,
      batch_id: true,
      candidate_id: true,
      candidate_name: true,
      certificate_no: true,
      result: true,
    },
  });

  if (!student || student.batch_id !== payload.batchId) {
    throw new Error("Candidate not found in this batch");
  }

  if (
    student.result !== STUDENT_RESULT.FAIL &&
    student.result !== STUDENT_RESULT.PENDING
  ) {
    throw new Error("Result is already Pass");
  }

  if (
    payload.targetPercent !== null &&
    (!Number.isFinite(payload.targetPercent) ||
      payload.targetPercent < 0 ||
      payload.targetPercent > 100)
  ) {
    throw new Error("Target percentage must be between 0 and 100");
  }

  const context = await loadBatchContext(student.batch_id);

  if (!context) {
    throw new Error("Batch not found");
  }

  const theoryResults =
    context.theoryResultsByStudent.get(student.id) || [];

  if (theoryResults.length === 0) {
    throw new Error("No theory results found for this candidate");
  }

  const input: BulkPassCandidateInput = {
    studentId: student.id,
    questions: context.questions,
    config: context.config,
    theoryResults,
    attempts: context.attemptsByStudent.get(student.id) || [],
    targetPercent: payload.targetPercent,
  };

  const { theoryPlan, adjustmentPlan, finalPlan } =
    planBulkCandidatePass(input);

  if (!finalPlan.satisfiesTarget) {
    throw new Error(
      finalPlan.reason ||
        "Practical/Viva adjustment is no longer possible for this candidate"
    );
  }

  const certificateGenerator = createCertificateGenerator();

  certificateGenerator.seedFromStudents(context.students);

  const counts = getTheoryCounts(theoryResults);

  const applied = await applyCandidatePlan(
    context,
    student,
    finalPlan,
    counts.correct,
    counts.incorrect,
    certificateGenerator.generateCertificateNo
  );

  const status = adjustmentPlan?.satisfiesTarget
    ? getSuccessStatus(finalPlan, payload.targetPercent)
    : getSuccessStatus(theoryPlan, payload.targetPercent);

  const averagePassPercentage = await getAverageTheoryPercentage(context).catch(
    () => null
  );

  return {
    success: true,
    average_pass_percentage: averagePassPercentage,
    log: {
      student_id: student.id,
      batch_id: student.batch_id,
      candidate_id: student.candidate_id,
      candidate_name: student.candidate_name,
      status,
      old_correct: counts.correct,
      new_correct: applied.newCorrect,
      old_incorrect: counts.incorrect,
      new_incorrect: applied.newIncorrect,
      target_percentage: payload.targetPercent ?? undefined,
      actual_percentage: finalPlan.evaluation.overallPercentage,
      theory_only_percentage:
        finalPlan.theoryOnlyPercentage,
      requires_adjustment: false,
      adjustment: finalPlan.adjustments,
      reason: finalPlan.reason,
    },
  };
}
