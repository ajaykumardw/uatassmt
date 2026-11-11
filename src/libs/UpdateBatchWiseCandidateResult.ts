// import prisma from "@/libs/prisma";
// import { format } from "date-fns";

// const updateBatchWiseCandidateResult = async (batchId: number) => {
//   try {
//     // =========================
//     // 1. BATCH CONFIG
//     // =========================
//     const batch = await prisma.batches.findUnique({
//       where: { id: batchId },
//       select: {
//         id: true,
//         theory_exam_set_id: true,
//         practical_exam_set_id: true,
//         viva_exam_set_id: true,
//         assessment_start_datetime: true,
//         assessment_end_datetime: true,
//         qualification_pack: {
//           select: {
//             total_marks: true,
//             total_theory_marks: true,
//             total_practical_marks: true,
//             total_viva_marks: true,
//             theory_cutoff_marks: true,
//             practical_cutoff_marks: true,
//             viva_cutoff_marks: true,
//             overall_cutoff_marks: true,
//           },
//         },
//       },
//     });

//     if (!batch) throw new Error("Batch not found");

//     const qp = batch.qualification_pack;
//     const now = new Date();

//     // if (!batch.assessment_end_datetime || batch.assessment_end_datetime > now) {
//     //   throw new Error(
//     //     `Assessment not ended yet. now: ${now.toISOString()}, end: ${batch.assessment_end_datetime?.toISOString()}`
//     //   );
//     // }

//     if (!batch.assessment_start_datetime || batch.assessment_start_datetime > now) {
//       throw new Error(
//         `Assessment has not started yet. now: ${format(now, 'dd-MMM-yyyy hh:mm a')}, start: ${batch?.assessment_start_datetime && format(batch?.assessment_start_datetime, 'dd-MMM-yyyy hh:mm a')}`
//       );
//     }

//     // =========================
//     // 2. STUDENTS
//     // =========================
//     const students = await prisma.students.findMany({
//       where: { batch_id: batchId, attendance: 1 },
//       select: { id: true },
//     });

//     const studentIds = students.map(s => s.id);
//     if (!studentIds.length) throw new Error("No students found for this batch");

//     // =========================
//     // 3. THEORY MARKS MAP (question -> marks)
//     // =========================
//     let questionMarks = new Map<number, number>();

//     if (batch.theory_exam_set_id) {
//       const questions = await prisma.exam_sets_questions.findMany({
//         where: { exam_set_id: batch.theory_exam_set_id },
//         select: { question_id: true, marks: true },
//       });

//       questionMarks = new Map(
//         questions.map(q => [q.question_id, Number(q.marks)])
//       );
//     }

//     // =========================
//     // 4. THEORY RESULTS (AGGREGATED PER STUDENT)
//     // =========================
//     let theoryMap = new Map<number, number>();

//     if (batch.theory_exam_set_id) {
//       const results = await prisma.exam_set_results.findMany({
//         where: {
//           exam_set_id: batch.theory_exam_set_id,
//           student_id: { in: studentIds },
//         },
//         select: {
//           student_id: true,
//           question_id: true,
//           student_answer: true,
//           correct_answer: true,
//         },
//       });

//       for (const r of results) {
//         if (r.student_answer === r.correct_answer) {
//           theoryMap.set(
//             r.student_id,
//             (theoryMap.get(r.student_id) || 0) +
//               (questionMarks.get(r.question_id) || 0)
//           );
//         }
//       }
//     }

//     // =========================
//     // 5. PRACTICAL + VIVA (AGGREGATED IN ONE PASS)
//     // =========================
//     const attempts = await prisma.student_question_attempts.findMany({
//       where: {
//         student_id: { in: studentIds },
//         question: {
//           question_type: { in: ["practical", "viva"] },
//         },
//       },
//       select: {
//         student_id: true,
//         obtained_marks: true,
//         question: {
//           select: { question_type: true },
//         },
//       },
//     });

//     const practicalMap = new Map<number, number>();
//     const vivaMap = new Map<number, number>();

//     for (const a of attempts) {
//       const marks = Number(a.obtained_marks) || 0;

//       if (a.question.question_type === "practical") {
//         practicalMap.set(
//           a.student_id,
//           (practicalMap.get(a.student_id) || 0) + marks
//         );
//       } else {
//         vivaMap.set(
//           a.student_id,
//           (vivaMap.get(a.student_id) || 0) + marks
//         );
//       }
//     }

//     // =========================
//     // 6. FINAL UPDATE (parallel)
//     // =========================
//     await Promise.all(
//       students.map((s) => {
//         const theory = theoryMap.get(s.id) || 0;
//         const practical = practicalMap.get(s.id) || 0;
//         const viva = vivaMap.get(s.id) || 0;

//         const total = theory + practical + viva;

//         const overall =
//           Number(qp.total_marks)
//             ? (total / Number(qp.total_marks)) * 100
//             : 0;

//         const theoryOk =
//           !batch.theory_exam_set_id ||
//           (theory / Number(qp.total_theory_marks)) * 100 >=
//             Number(qp.theory_cutoff_marks);

//         const practicalOk =
//           !batch.practical_exam_set_id ||
//           (practical / Number(qp.total_practical_marks)) * 100 >=
//             Number(qp.practical_cutoff_marks);

//         const vivaOk =
//           !batch.viva_exam_set_id ||
//           (viva / Number(qp.total_viva_marks)) * 100 >=
//             Number(qp.viva_cutoff_marks);

//         const result =
//           theoryOk && practicalOk && vivaOk &&
//           overall >= Number(qp.overall_cutoff_marks)
//             ? "pass"
//             : "fail";

//         return prisma.students.update({
//           where: { id: s.id },
//           data: { result },
//         });
//       })
//     );

//     return students.length;
//   } catch (err) {
//     console.error(err);
//     throw err;
//   }
// };

// export default updateBatchWiseCandidateResult;


import { format } from "date-fns";

import prisma from "@/libs/prisma";
import { STUDENT_RESULT } from "@/configs/customDataConfig";
import { evaluateResult, getEnabledOverallPercentage, getPercentage } from "@/libs/resultCriteria";
import { calculateNosPercentages, type ResultQuestion } from "@/libs/resultCriteriaNos";

const updateBatchWiseCandidateResult = async (
  batchId: number,
  onProgress?: (progress: number) => Promise<void> | void
) => {
  try {
    const now = new Date();

    // =========================
    // 1. BATCH CONFIG
    // =========================
    const batch = await prisma.batches.findUnique({
      where: { id: batchId },
      select: {
        id: true,
        theory_exam_set_id: true,
        practical_exam_set_id: true,
        viva_exam_set_id: true,
        assessment_start_datetime: true,
        qualification_pack: true,
        training_partner: {
          select: {
            id: true,
            company_name: true,
            state: {
              select: {
                state_code: true,
              },
            },
          }
        }
      },
    });

    if (!batch) throw new Error("Batch not found");

    const qp = batch.qualification_pack;

    if (!qp) throw new Error("Qualification pack not found");

    if (!batch.assessment_start_datetime || batch.assessment_start_datetime > now) {
      throw new Error(
        `Assessment has not started yet. now: ${format(now, "dd-MMM-yyyy hh:mm a")}`
      );
    }

    if (onProgress) await onProgress(10);

    // =========================
    // 2. STUDENTS
    // =========================
    const students = await prisma.students.findMany({
      where: { batch_id: batchId, attendance: 1 },
      select: { id: true, certificate_no: true },
    });

    if (!students.length) throw new Error("No students found");

    const studentIds = students.map((s) => s.id);

    if (onProgress) await onProgress(20);

    // =========================
    // 3. EXAM SET QUESTIONS + PC/NOS
    // =========================
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

    if (batch.theory_exam_set_id) examSetType.set(batch.theory_exam_set_id, "theory");
    if (batch.practical_exam_set_id) examSetType.set(batch.practical_exam_set_id, "practical");
    if (batch.viva_exam_set_id) examSetType.set(batch.viva_exam_set_id, "viva");

    const resultQuestions: ResultQuestion[] = examSetQuestions.map((item) => ({
      id: item.question_id,
      type: examSetType.get(item.exam_set_id) || item.questions.question_type,
      marks: Number(item.marks) || 0,
      pcs: item.questions.pc_questions.map((pcQuestion) => ({
        pcId: pcQuestion.pc.id,
        nosCode: pcQuestion.pc.nos.nos_id,
        nosName: pcQuestion.pc.nos.nos_name,
        theoryMarks: Number(pcQuestion.pc.theory_marks) || 0,
        practicalMarks: Number(pcQuestion.pc.practical_marks) || 0,
        vivaMarks: Number(pcQuestion.pc.viva_marks) || 0,
      })),
    }));

    const theoryQuestionMarks = new Map<number, number>();

    for (const question of resultQuestions) {
      if (question.type === "theory") {
        theoryQuestionMarks.set(question.id, question.marks);
      }
    }

    const validAttemptQuestionIds = resultQuestions
      .filter((question) => question.type === "practical" || question.type === "viva")
      .map((question) => question.id);

    const typeByQuestionId = new Map(
      resultQuestions.map((question) => [question.id, question.type])
    );

    // =========================
    // 4. THEORY RESULTS
    // =========================
    const theoryCorrectMap = new Map<number, Set<number>>();
    const theoryMap = new Map<number, number>();

    if (batch.theory_exam_set_id) {
      const results = await prisma.exam_set_results.findMany({
        where: {
          exam_set_id: batch.theory_exam_set_id,
          student_id: { in: studentIds },
        },
        select: {
          student_id: true,
          question_id: true,
          student_answer: true,
          correct_answer: true,
        },
      });

      for (const r of results) {
        if (r.student_answer === r.correct_answer) {
          if (!theoryCorrectMap.has(r.student_id)) {
            theoryCorrectMap.set(r.student_id, new Set<number>());
          }

          theoryCorrectMap.get(r.student_id)?.add(r.question_id);

          theoryMap.set(
            r.student_id,
            (theoryMap.get(r.student_id) || 0) +
              (theoryQuestionMarks.get(r.question_id) || 0)
          );
        }
      }
    }

    // =========================
    // 5. PRACTICAL + VIVA
    // =========================
    const attemptsByStudent = new Map<
      number,
      Array<{ questionId: number; obtainedMarks: number }>
    >();

    const practicalMap = new Map<number, number>();
    const vivaMap = new Map<number, number>();

    if (validAttemptQuestionIds.length > 0) {
      const attempts = await prisma.student_question_attempts.findMany({
        where: {
          student_id: { in: studentIds },
          question_id: { in: validAttemptQuestionIds },
        },
        select: {
          student_id: true,
          question_id: true,
          obtained_marks: true,
        },
      });

      for (const a of attempts) {
        const marks = Number(a.obtained_marks) || 0;
        const type = typeByQuestionId.get(a.question_id);

        const studentAttempts = attemptsByStudent.get(a.student_id) || [];

        studentAttempts.push({
          questionId: a.question_id,
          obtainedMarks: marks,
        });

        attemptsByStudent.set(a.student_id, studentAttempts);

        if (type === "practical") {
          practicalMap.set(a.student_id, (practicalMap.get(a.student_id) || 0) + marks);
        } else if (type === "viva") {
          vivaMap.set(a.student_id, (vivaMap.get(a.student_id) || 0) + marks);
        }
      }
    }

    // =========================
    // 6. PROCESS IN CHUNKS
    // =========================
    const chunkSize = 100;
    let processed = 0;
    const total = students.length;

    const hasTheory = Boolean(batch.theory_exam_set_id);
    const hasPractical = Boolean(batch.practical_exam_set_id);
    const hasViva = Boolean(batch.viva_exam_set_id);

    const nosCutoff = Number(qp.nos_cutoff_marks) || 0;

    const tp = batch.training_partner;

    const companyName = tp?.company_name || "";

    let tpShortName = "";

      const match = companyName.match(/\(([^)]+)\)/);

    if (match) {

        // Case 1: If parentheses exist, take the value inside
        tpShortName = match[1];

    } else {

      // Case 2: Otherwise, build initials from words
      tpShortName = companyName
          .split(" ")
          .map(word => word[0])
          .filter(char => /[A-Za-z]/.test(char)) // keep only letters
          .join("");
    }

    const tpStateCode = tp?.state?.state_code;

    const usedRandoms = new Set<number>();

    for (const student of students) {
      const lastPart = student.certificate_no?.split("|").pop();

      if (lastPart && /^\d{3}$/.test(lastPart)) {
        usedRandoms.add(Number(lastPart));
      }
    }

    function getUniqueThreeDigits() {

        let num;

        do {
            num = Math.floor(100 + Math.random() * 900); // 100–999
        } while (usedRandoms.has(num));

        usedRandoms.add(num);

        return String(num);
    }

    for (let i = 0; i < students.length; i += chunkSize) {
      const chunk = students.slice(i, i + chunkSize);

      await prisma.$transaction(
        chunk.map((s) => {
          const theory = theoryMap.get(s.id) || 0;
          const practical = practicalMap.get(s.id) || 0;
          const viva = vivaMap.get(s.id) || 0;

          const theoryPercentage = getPercentage(
            theory,
            Number(qp.total_theory_marks)
          );

          const practicalPercentage = getPercentage(
            practical,
            Number(qp.total_practical_marks)
          );

          const vivaPercentage = getPercentage(
            viva,
            Number(qp.total_viva_marks)
          );

          const overallPercent = getEnabledOverallPercentage(
            {
              theory,
              practical,
              viva,
            },
            {
              theory: Number(qp.total_theory_marks),
              practical: Number(qp.total_practical_marks),
              viva: Number(qp.total_viva_marks),
            },
            {
              theory: hasTheory,
              practical: hasPractical,
              viva: hasViva,
            }
          );

          const nosResults = calculateNosPercentages(resultQuestions, {
            theoryCorrectQuestionIds: theoryCorrectMap.get(s.id),
            attempts: attemptsByStudent.get(s.id) || [],
          }).map((nos) => ({
            ...nos,
            cutoff: nosCutoff,
          }));

          const evaluation = evaluateResult({
            theory: {
              applicable: hasTheory,
              percentage: theoryPercentage,
              cutoff: Number(qp.theory_cutoff_marks) || 0,
            },
            practical: {
              applicable: hasPractical,
              percentage: practicalPercentage,
              cutoff: Number(qp.practical_cutoff_marks) || 0,
            },
            viva: {
              applicable: hasViva,
              percentage: vivaPercentage,
              cutoff: Number(qp.viva_cutoff_marks) || 0,
            },
            overall: {
              applicable: true,
              percentage: overallPercent,
              cutoff: Number(qp.overall_cutoff_marks) || 0,
            },
            nos: nosResults,
          });

          const result = evaluation.pass
            ? STUDENT_RESULT.PASS
            : STUDENT_RESULT.FAIL;

          let certificate_no: string | null = s.certificate_no;

          if (result === STUDENT_RESULT.PASS) {

            if (!certificate_no) {
              const uniqueNum = getUniqueThreeDigits();
              const agencyShortName = 'VISTA';

              certificate_no = [
                agencyShortName,
                tpShortName,
                tpStateCode,
                uniqueNum
              ].filter(Boolean).join("|");
            }

            // certificate_no = `${agencyShortName}|${tpShortName}|${tpStateCode || ""}|${uniqueNum}`;
          } else {
            certificate_no = null;
          }

          return prisma.students.update({
            where: { id: s.id },
            data: { result, certificate_no },
          });
        })
      );

      processed += chunk.length;

      if (onProgress) {
        const percent = 20 + Math.floor((processed / total) * 70); // 20 → 90

        await onProgress(percent);
      }
    }

    if (onProgress) await onProgress(100);

    return students.length;
  } catch (err) {
    console.error("Batch Result Error:", err);
    throw err;
  }
};

export default updateBatchWiseCandidateResult;
