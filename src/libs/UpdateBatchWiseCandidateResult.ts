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

const safePercent = (obtained: number, total: number) => {
  if (!total || total === 0) return 0;

  return (obtained / total) * 100;
};

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
      select: { id: true },
    });

    if (!students.length) throw new Error("No students found");

    const studentIds = students.map((s) => s.id);

    if (onProgress) await onProgress(20);

    // =========================
    // 3. THEORY MARKS MAP
    // =========================
    let questionMarks = new Map<number, number>();

    if (batch.theory_exam_set_id) {
      const questions = await prisma.exam_sets_questions.findMany({
        where: { exam_set_id: batch.theory_exam_set_id },
        select: { question_id: true, marks: true },
      });

      questionMarks = new Map(
        questions.map((q) => [q.question_id, Number(q.marks)])
      );
    }

    // =========================
    // 4. THEORY RESULTS
    // =========================
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
          theoryMap.set(
            r.student_id,
            (theoryMap.get(r.student_id) || 0) +
              (questionMarks.get(r.question_id) || 0)
          );
        }
      }
    }

    // =========================
    // 5. PRACTICAL + VIVA
    // =========================
    const attempts = await prisma.student_question_attempts.findMany({
      where: { student_id: { in: studentIds } },
      select: {
        student_id: true,
        obtained_marks: true,
        question: {
          select: { question_type: true },
        },
      },
    });

    const practicalMap = new Map<number, number>();
    const vivaMap = new Map<number, number>();

    for (const a of attempts) {
      const marks = Number(a.obtained_marks) || 0;
      const type = a.question?.question_type;

      if (type === "practical") {
        practicalMap.set(a.student_id, (practicalMap.get(a.student_id) || 0) + marks);
      } else if (type === "viva") {
        vivaMap.set(a.student_id, (vivaMap.get(a.student_id) || 0) + marks);
      }
    }

    // =========================
    // 6. PROCESS IN CHUNKS
    // =========================
    const chunkSize = 100;
    let processed = 0;
    const total = students.length;

    for (let i = 0; i < students.length; i += chunkSize) {
      const chunk = students.slice(i, i + chunkSize);

      await prisma.$transaction(
        chunk.map((s) => {
          const theory = theoryMap.get(s.id) || 0;
          const practical = practicalMap.get(s.id) || 0;
          const viva = vivaMap.get(s.id) || 0;

          const totalMarks = theory + practical + viva;

          const overallPercent = safePercent(totalMarks, Number(qp.total_marks));

          const theoryOk =
            !batch.theory_exam_set_id ||
            safePercent(theory, Number(qp.total_theory_marks)) >=
              Number(qp.theory_cutoff_marks);

          const practicalOk =
            !batch.practical_exam_set_id ||
            safePercent(practical, Number(qp.total_practical_marks)) >=
              Number(qp.practical_cutoff_marks);

          const vivaOk =
            !batch.viva_exam_set_id ||
            safePercent(viva, Number(qp.total_viva_marks)) >=
              Number(qp.viva_cutoff_marks);

          const result =
            theoryOk &&
            practicalOk &&
            vivaOk &&
            overallPercent >= Number(qp.overall_cutoff_marks)
              ? "pass"
              : "fail";

          return prisma.students.update({
            where: { id: s.id },
            data: { result },
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
