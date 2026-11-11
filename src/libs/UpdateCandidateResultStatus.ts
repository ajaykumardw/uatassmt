// import prisma from "@/libs/prisma";

// const updateCandidateResultStatus = async (studentId: number) => {

//   try {

//     const candidate = await prisma.students.findUnique({
//       where: {
//         id: studentId
//       },
//       select: {
//         id: true,
//         candidate_id: true,
//         candidate_name: true,
//         batch_id: true,
//         batch: {
//           select: {
//             batch_name: true,
//             theory_exam_set_id: true,
//             practical_exam_set_id: true,
//             viva_exam_set_id: true,
//             assessment_start_datetime: true,
//             assessment_end_datetime: true,
//             theory_exam_set: true,
//             scheme: true,
//             sub_scheme: true,
//             qualification_pack: {
//               select: {
//                 qualification_pack_id: true,
//                 qualification_pack_name: true,
//                 version: true,
//                 total_theory_marks: true,
//                 theory_cutoff_marks: true,
//                 total_practical_marks: true,
//                 practical_cutoff_marks: true,
//                 total_viva_marks: true,
//                 viva_cutoff_marks: true,
//                 total_project_marks: true,
//                 total_marks: true,
//                 overall_cutoff_marks: true,
//                 ssc: {
//                   select: {
//                     id: true,
//                     ssc_image: true,
//                   }
//                 }

//               }
//             },
//           }
//         }
//       }
//     })

//     if (!candidate) {
//       console.error(`Candidate with ID ${studentId} not found.`);
//       return;
//     }

//     const batch = candidate?.batch;

//     if(batch == null) {
//       console.error(`Batch information not found for candidate with ID ${studentId}.`);
//       return;
//     }


//     if(batch?.assessment_start_datetime && batch?.assessment_start_datetime > new Date()) {
//       console.error(`Assessment for candidate with ID ${studentId} has not started yet.`);
//       return;
//     }

//     // total
//     const totalMarks = Number(batch?.qualification_pack.total_marks) || 0;
//     const overallCutoffMarks = Number(batch?.qualification_pack.overall_cutoff_marks) || 0;

//     // theory
//     const totalTheoryMarks = Number(batch?.qualification_pack.total_theory_marks) || 0;
//     const theoryCutoffMarks = Number(batch?.qualification_pack.theory_cutoff_marks) || 0;

//     // practical
//     const totalPracticalMarks = Number(batch?.qualification_pack.total_practical_marks) || 0;
//     const practicalCutoffMarks = Number(batch?.qualification_pack.practical_cutoff_marks) || 0;

//     // viva
//     const totalVivaMarks = Number(batch?.qualification_pack.total_viva_marks) || 0;
//     const vivaCutoffMarks = Number(batch?.qualification_pack.viva_cutoff_marks) || 0;

//     // project
//     const totalProjectMarks = Number(batch?.qualification_pack.total_project_marks) || 0;
//     const projectCutoffMarks = Number(batch?.qualification_pack.overall_cutoff_marks) || 0;

//     let obtainedTheoryMarks = 0;
//     let obtainedPracticalMarks = 0;
//     let obtainedVivaMarks = 0;
//     let obtainedProjectMarks = 0;

//     if (batch?.theory_exam_set_id) {

//       const examSetQuestions = await prisma.exam_sets_questions.findMany({
//         where: {
//           exam_set_id: batch.theory_exam_set_id
//         },
//         select: {
//           question_id: true,
//           marks: true
//         }
//       })

//       const theoryResult = await prisma.exam_set_results.findMany({
//         where: {
//           student_id: studentId,
//           exam_set_id: batch.theory_exam_set_id,
//         },
//         select: {
//           exam_set_id: true,
//           student_id: true,
//           question_id: true,
//           student_answer: true,
//           correct_answer: true,
//         }
//       })

//       const resultMap = new Map(
//         theoryResult.map(result => [result.question_id, result])
//       );

//       examSetQuestions.forEach(item => {
//         const result = resultMap.get(item.question_id);
//         const marks = item.marks || 0;

//         if (result) {
//           if (result.student_answer === result.correct_answer) {
//             obtainedTheoryMarks += marks;
//           }
//         }
//       })

//     }

//     if (batch?.practical_exam_set_id) {

//       const examSetQuestions = await prisma.exam_sets_questions.findMany({
//         where: {
//           exam_set_id: batch.practical_exam_set_id
//         }
//       })

//       const practicalResult = await prisma.student_question_attempts.findMany({
//         where: {
//           student_id: studentId,
//           question: {
//             question_type: "practical",
//           }
//         },
//         select: {
//           question_id: true,
//           max_marks: true,
//           obtained_marks: true,
//         }
//       });

//       const resultMap = new Map(
//         practicalResult.map(result => [result.question_id, result])
//       );

//       examSetQuestions.forEach(item => {
//         const result = resultMap.get(item.question_id);

//         if (result) {
//           obtainedPracticalMarks += Number(result.obtained_marks) || 0;
//         }
//       })

//     }

//     if (batch?.viva_exam_set_id) {

//       const examSetQuestions = await prisma.exam_sets_questions.findMany({
//         where: {
//           exam_set_id: batch.viva_exam_set_id
//         }
//       })

//       const vivaResult = await prisma.student_question_attempts.findMany({
//         where: {
//           student_id: studentId,
//           question: {
//             question_type: "viva",
//           }
//         },
//         select: {
//           question_id: true,
//           max_marks: true,
//           obtained_marks: true,
//         }
//       });

//       const resultMap = new Map(vivaResult.map(r => [r.question_id, r]));

//       examSetQuestions.forEach(item => {
//         const result = resultMap.get(item.question_id);

//         if (result) {
//           obtainedVivaMarks += Number(result.obtained_marks) || 0;
//         }
//       })

//     }

//     const theoryPercentage = totalTheoryMarks > 0 ? (obtainedTheoryMarks / totalTheoryMarks) * 100 : 0;
//     const theoryStatus = theoryPercentage >= theoryCutoffMarks ? "pass" : "fail";

//     const practicalPercentage = totalPracticalMarks > 0 ? (obtainedPracticalMarks / totalPracticalMarks) * 100 : 0;
//     const practicalStatus = practicalPercentage >= practicalCutoffMarks ? "pass" : "fail";

//     const vivaPercentage = totalVivaMarks > 0 ? (obtainedVivaMarks / totalVivaMarks) * 100 : 0;
//     const vivaStatus = vivaPercentage >= vivaCutoffMarks ? "pass" : "fail";

//     const projectPercentage = totalProjectMarks > 0 ? (obtainedProjectMarks / totalProjectMarks) * 100 : 0;
//     const projectStatus = projectPercentage >= projectCutoffMarks ? "pass" : "fail";

//     const totalObtainedMarks = obtainedTheoryMarks + obtainedPracticalMarks + obtainedVivaMarks + obtainedProjectMarks;
//     const overallPercentage = totalMarks > 0 ? (totalObtainedMarks / totalMarks) * 100 : 0;

//     // const overallStatus = overallPercentage >= overallCutoffMarks ? "pass" : "fail";

//     const overallStatus =
//       theoryStatus === "pass" &&
//       practicalStatus === "pass" &&
//       vivaStatus === "pass" &&
//       overallPercentage >= overallCutoffMarks
//         ? "pass"
//         : "fail";

//     await prisma.students.update({
//       where: {
//         id: studentId
//       },
//       data: {
//         result: overallStatus,
//       }
//     });




//   } catch (error) {
//     console.error(error);
//   }

// }

// export default updateCandidateResultStatus;

import { STUDENT_RESULT } from "@/configs/customDataConfig";
import prisma from "@/libs/prisma";
import { evaluateResult, getEnabledOverallPercentage, getPercentage } from "@/libs/resultCriteria";
import { calculateNosPercentages, type ResultQuestion } from "@/libs/resultCriteriaNos";

const updateCandidateResultStatus = async (studentId: number) => {
  try {
    // 🔥 QUERY 1: Student + batch + config
    const student = await prisma.students.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        batch: {
          select: {
            theory_exam_set_id: true,
            practical_exam_set_id: true,
            viva_exam_set_id: true,
            assessment_start_datetime: true,
            assessment_end_datetime: true,

            qualification_pack: {
              select: {
                total_marks: true,
                total_theory_marks: true,
                total_practical_marks: true,
                total_viva_marks: true,
                theory_cutoff_marks: true,
                practical_cutoff_marks: true,
                viva_cutoff_marks: true,
                overall_cutoff_marks: true,
                nos_cutoff_marks: true,
              }
            }
          }
        }
      }
    });

    if (!student?.batch) return;

    const batch = student.batch;
    const qp = batch.qualification_pack;

    // ⛔ time validations
    const now = new Date();

    if (batch.assessment_start_datetime && batch.assessment_start_datetime > now) return;

    // if (batch.assessment_end_datetime && batch.assessment_end_datetime > now) return;

    // =========================
    // 🔥 QUERY 2: THEORY (batch questions + results)
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

    let obtainedTheoryMarks = 0;

    const theoryCorrectQuestionIds = new Set<number>();

    if (batch.theory_exam_set_id) {
      const theoryResults = await prisma.exam_set_results.findMany({
        where: {
          student_id: studentId,
          exam_set_id: batch.theory_exam_set_id,
        },
        select: {
          question_id: true,
          student_answer: true,
          correct_answer: true,
        },
      });

      for (const r of theoryResults) {
        if (r.student_answer === r.correct_answer) {
          theoryCorrectQuestionIds.add(r.question_id);

          obtainedTheoryMarks += theoryQuestionMarks.get(r.question_id) || 0;
        }
      }
    }

    // =========================
    // 🔥 QUERY 3: PRACTICAL + VIVA (batch-aware filtering)
    // =========================

    let obtainedPracticalMarks = 0;
    let obtainedVivaMarks = 0;

    const validQuestionIds = resultQuestions
      .filter((question) => question.type === "practical" || question.type === "viva")
      .map((question) => question.id);

    const attemptMarks: Array<{ questionId: number; obtainedMarks: number }> = [];

    if (validQuestionIds.length > 0) {
      const attempts = await prisma.student_question_attempts.findMany({
        where: {
          student_id: studentId,
          question_id: { in: validQuestionIds },
        },
        select: {
          question_id: true,
          obtained_marks: true,
        },
      });

      const typeByQuestionId = new Map(
        resultQuestions.map((question) => [question.id, question.type])
      );

      for (const a of attempts) {
        const obtainedMarks = Number(a.obtained_marks) || 0;

        const type = typeByQuestionId.get(a.question_id);

        attemptMarks.push({
          questionId: a.question_id,
          obtainedMarks,
        });

        if (type === "practical") {
          obtainedPracticalMarks += obtainedMarks;
        }

        if (type === "viva") {
          obtainedVivaMarks += obtainedMarks;
        }
      }
    }

    // =========================
    // 📊 CALCULATIONS
    // =========================

    const hasTheory = Boolean(batch.theory_exam_set_id);
    const hasPractical = Boolean(batch.practical_exam_set_id);
    const hasViva = Boolean(batch.viva_exam_set_id);

    const theoryPercentage = getPercentage(
      obtainedTheoryMarks,
      Number(qp.total_theory_marks)
    );

    const practicalPercentage = getPercentage(
      obtainedPracticalMarks,
      Number(qp.total_practical_marks)
    );

    const vivaPercentage = getPercentage(
      obtainedVivaMarks,
      Number(qp.total_viva_marks)
    );

    const overallPercentage = getEnabledOverallPercentage(
      {
        theory: obtainedTheoryMarks,
        practical: obtainedPracticalMarks,
        viva: obtainedVivaMarks,
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

    const nosCutoff = Number(qp.nos_cutoff_marks) || 0;

    const nosResults = calculateNosPercentages(resultQuestions, {
      theoryCorrectQuestionIds,
      attempts: attemptMarks,
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
        percentage: overallPercentage,
        cutoff: Number(qp.overall_cutoff_marks) || 0,
      },
      nos: nosResults,
    });

    const overallStatus = evaluation.pass
      ? STUDENT_RESULT.PASS
      : STUDENT_RESULT.FAIL;

    // 🔥 UPDATE
    await prisma.students.update({
      where: { id: studentId },
      data: {
        result: overallStatus,
      },
    });

    return overallStatus;

  } catch (error) {
    console.error(error);

    return null;
  }
};

export default updateCandidateResultStatus;
