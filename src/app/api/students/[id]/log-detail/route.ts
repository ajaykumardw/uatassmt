// import prisma from "@/libs/prisma";
// import { NextResponse } from "next/server";

// export async function GET(
//   req: Request,
//   context: { params: { id: number } }
// ) {

//   const id = Number(context.params.id);

//   const examSetResult = await prisma.exam_set_results.findMany({
//     where: {
//       student_id: id
//     },
//     include: {
//       question: {
//         include:{
//           pc_questions:{
//             include:{
//               pc:{
//                 include:{
//                   nos:true
//                 }
//               }
//             }
//           }
//         }
//       }
//     },
//     orderBy:{
//       id:"asc"
//     }
//   });

//   const report = examSetResult.map((item,index)=>{

//     const pcData = item.question.pc_questions?.[0];

//     const options:any = {
//       1: item.question.option1,
//       2: item.question.option2,
//       3: item.question.option3,
//       4: item.question.option4,
//       5: item.question.option5
//     };

//     const correctAnswerText = item.correct_answer
//       ? `${options[item.correct_answer] || ""}`
//       : "";

//     const studentAnswerText = item.student_answer
//       ? `${options[item.student_answer] || ""}`
//       : '--';

//     return {

//       sr_no:index+1,

//       nos_name: pcData?.pc?.nos?.nos_name || "",

//       pc_name: pcData?.pc?.pc_name || "",

//       question: item.question.question,

//       correct_answer: correctAnswerText,

//       candidate_response: studentAnswerText,

//       status:
//         item.student_answer === item.correct_answer
//         ? 1
//         : item.student_answer == 0
//         ? -1
//         : 0
//     }

//   })
//   // .sort((a,b)=>
//   //   a.nos_name.localeCompare(b.nos_name) ||
//   //   a.pc_name.localeCompare(b.pc_name)
//   // );

//   return NextResponse.json(report);

// }


import { NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { format } from "date-fns";

import { authOptions } from "@/libs/auth";

import prisma from "@/libs/prisma";

import { decrypt } from "@/utils/encryption";

import { agencyImagePath, agencyUsersFilePath, sscImagePath } from "@/configs/customDataConfig";
import getValidImage from "@/utils/getValidImage";
import { RESULT_CRITERIA } from "@/configs/resultCriteria";
import {
  evaluateResult,
  getEnabledObtained,
  getEnabledTotal,
  getPercentage,
  getSectionStatus,
} from "@/libs/resultCriteria";
import {
  calculateNosPercentages,
  type ResultQuestion,
} from "@/libs/resultCriteriaNos";

// =======================================
// COMMON SORT HELPER
// Sort By NOS -> PC -> ID
// =======================================

// const sortByNosAndPc = (data: any[]) => {
//   return [...data].sort((a, b) => {
//     const aQuestion = a.questions || a.question;
//     const bQuestion = b.questions || b.question;

//     const aPc = aQuestion?.pc_questions?.[0];
//     const bPc = bQuestion?.pc_questions?.[0];

//     // =========================
//     // SORT BY NOS ID
//     // =========================
//     const aNosId = aPc?.pc?.nos?.nos_id || "";
//     const bNosId = bPc?.pc?.nos?.nos_id || "";

//     const nosNumA =
//       parseInt(aNosId.replace(/^\D+/g, ""), 10) || 0;

//     const nosNumB =
//       parseInt(bNosId.replace(/^\D+/g, ""), 10) || 0;

//     if (nosNumA !== nosNumB) {
//       return nosNumA - nosNumB;
//     }

//     // =========================
//     // SORT BY PC ID
//     // =========================
//     const aPcId = aPc?.pc?.pc_id || "";
//     const bPcId = bPc?.pc?.pc_id || "";

//     const pcNumA =
//       parseInt(aPcId.replace(/^\D+/g, ""), 10) || 0;

//     const pcNumB =
//       parseInt(bPcId.replace(/^\D+/g, ""), 10) || 0;

//     if (pcNumA !== pcNumB) {
//       return pcNumA - pcNumB;
//     }

//     // fallback
//     return (a.id || 0) - (b.id || 0);
//   });
// };

const sortByNosAndPc = (data: any[]) => {
  return [...data].sort((a, b) => {
    const aQuestion = a.questions || a.question;
    const bQuestion = b.questions || b.question;

    const aPc = aQuestion?.pc_questions?.[0];
    const bPc = bQuestion?.pc_questions?.[0];

    const aNos = aPc?.pc?.nos?.nos_name || "";
    const bNos = bPc?.pc?.nos?.nos_name || "";

    const nosCompare = aNos.localeCompare(bNos, undefined, {
      numeric: true,
      sensitivity: "base"
    });

    if (nosCompare !== 0) return nosCompare;

    const aPcName = aPc?.pc?.pc_name || "";
    const bPcName = bPc?.pc?.pc_name || "";

    return aPcName.localeCompare(bPcName, undefined, {
      numeric: true,
      sensitivity: "base"
    });
  });
};

export async function GET(
  req: Request,
  context: { params: { id: number } }
) {

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({
      status: 'Error',
      statusCode: 401,
      message: "Unauthorized"
    }, { status: 401 });
  }

  const isAgency = session?.user?.is_master;
  const agencyName = session?.user?.name;

  if (!isAgency) {
    return NextResponse.json({
      status: 'Error',
      statusCode: 403,
      message: "Forbidden: Insufficient permissions"
    }, { status: 403 });
  }

  const studentId = Number(context.params.id);

  const student =
    await prisma.students.findUnique({

      where: { id: studentId },

      include: {
        batch: {
          select: {
            batch_name: true,
            theory_exam_set_id: true,
            practical_exam_set_id: true,
            viva_exam_set_id: true,
            assessment_start_datetime: true,
            theory_exam_set: true,
            scheme: true,
            sub_scheme: true,
            qualification_pack: {
              select: {
                qualification_pack_id: true,
                qualification_pack_name: true,
                version: true,
                total_theory_marks: true,
                theory_cutoff_marks: true,
                total_practical_marks: true,
                practical_cutoff_marks: true,
                total_viva_marks: true,
                viva_cutoff_marks: true,
                total_project_marks: true,
                total_marks: true,
                overall_cutoff_marks: true,
                nos_cutoff_marks: true,
                ssc: {
                  select: {
                    id: true,
                    ssc_image: true,
                  }
                }

              }
            },
            agency: {
              select: {
                id: true,
                avatar: true,
                first_name: true,
                last_name: true,
                company_name: true,
                sign_image: true,
              }
            },
            training_partner: true,
            training_center: {
              select: {
                id: true,
                company_name: true,
                first_name: true,
                last_name: true,
                sign_image: true
              }
            },
            center_spoc_person_name: true,
          }
        }
      }

    });

  if (!student)
    return NextResponse.json([]);

  const examSetId =
    student.batch.theory_exam_set_id;

  const examSetIds = [
    student.batch.theory_exam_set_id,
    student.batch.practical_exam_set_id,
    student.batch.viva_exam_set_id,
  ].filter((id): id is number => Boolean(id));

  const questionsRaw =
    await prisma.exam_sets_questions.findMany({

      where: {
        exam_set_id: {
          in: examSetIds
        }
      },

      include: {

        questions: {
          include: {
            pc_questions: {
              include: {
                pc: {
                  include: {
                    nos: true
                  }
                }
              }
            }
          }
        }

      },

      orderBy: {
        id: "asc"
      }

    });

  const questions = sortByNosAndPc(
    questionsRaw.filter((item) => item.exam_set_id === examSetId)
  );

  const examSetType = new Map<number, "theory" | "practical" | "viva">();

  if (student.batch.theory_exam_set_id) {
    examSetType.set(student.batch.theory_exam_set_id, "theory");
  }

  if (student.batch.practical_exam_set_id) {
    examSetType.set(student.batch.practical_exam_set_id, "practical");
  }

  if (student.batch.viva_exam_set_id) {
    examSetType.set(student.batch.viva_exam_set_id, "viva");
  }

  const resultQuestions: ResultQuestion[] = questionsRaw.map((item) => ({
    id: item.questions.id,
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

  const results =
    await prisma.exam_set_results.findMany({

      where: {
        student_id: studentId,
        exam_set_id: examSetId!
      }

    });

  const resultMap =
    new Map(
      results.map(r => [
        r.question_id,
        r
      ])
    );

  const theoryCorrectQuestionIds = new Set<number>();

  for (const result of results) {
    if (result.student_answer === result.correct_answer) {
      theoryCorrectQuestionIds.add(result.question_id);
    }
  }

  const practicalQuestionIds = resultQuestions
    .filter((question) => question.type === "practical")
    .map((question) => question.id);

  const vivaQuestionIds = resultQuestions
    .filter((question) => question.type === "viva")
    .map((question) => question.id);

//   const report = questions.map((item, index) => {

//     const question =
//       item.questions;

//     const result =
//       resultMap.get(question.id);

//     const pcData =
//       question.pc_questions?.[0];

//     const options: any = {

//       1: question.option1,
//       2: question.option2,
//       3: question.option3,
//       4: question.option4,
//       5: question.option5

//     };

//     const correct =
//       options[question.answer || 0] || "--";

//     const studentAnswer =
//       result?.student_answer
//         ? options[result.student_answer]
//         : "--";

//     return {

//       sr_no: index + 1,

//       nos_name:
//         pcData?.pc?.nos?.nos_name || "",

//       pc_name:
//         pcData?.pc?.pc_name || "",

//       question:
//         question.question,

//       correct_answer:
//         correct,

//       candidate_response:
//         studentAnswer,

//       status: !result ? -1 : result.student_answer === question.answer ? 1 : result.student_answer == 0 ? -1 : 0

//     };

//   });

  const report = questions.map((item, index) => {

    const question =
      item.questions;

    const result =
      resultMap.get(question.id);

    const pcData =
      question.pc_questions?.[0];

    let openTime = "--";
    let submitTime = "--";
    let duration = "--";

    if (result?.attempt_time_data) {
        try {
        const attempts: any[] = JSON.parse(result.attempt_time_data);

        if (attempts.length > 0) {

            // ✅ First open time
            const firstOpen = attempts[0][1];

            if (firstOpen) {
            openTime = format(new Date(firstOpen), "HH:mm:ss");
            }

            // ✅ Last submit time
            const lastClose = attempts[attempts.length - 1][2];

            if (lastClose) {
            submitTime = format(new Date(lastClose), "HH:mm:ss");
            }

            // ✅ Total duration (sum of all attempts)
            let totalSeconds = 0;

            for (const attempt of attempts) {
                const start = attempt[1] ? new Date(attempt[1]) : null;
                const end = attempt[2] ? new Date(attempt[2]) : null;

                if (start && end) {
                    totalSeconds += Math.floor((end.getTime() - start.getTime()) / 1000);
                }
            }

            const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
            const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
            const s = String(totalSeconds % 60).padStart(2, "0");

            duration = `${h}:${m}:${s}`;
        }

        } catch (e) {
            console.log("Invalid attempt_time_data:", result.attempt_time_data);
        }
    }


    const options: any = {

      1: question.option1,
      2: question.option2,
      3: question.option3,
      4: question.option4,
      5: question.option5

    };

    const correct =
      options[question.answer || 0] || "--";

    const marks = item.marks || question.marks || 0;

    const isCorrect = result?.student_answer === result?.correct_answer;

    let obtainedMarks = 0;

    if (isCorrect) {
      obtainedMarks = marks;
    }

    const studentAnswer =
      result?.student_answer
        ? options[result.student_answer]
        : "--";

    return {

      sr_no: index + 1,

      nos_name:
        pcData?.pc?.nos?.nos_name || "",

      pc_name:
        pcData?.pc?.pc_name || "",

      question:
        question.question,

      correct_answer:
        correct,

      candidate_response:
        studentAnswer,

      status: !result ? -1 : result.student_answer === result.correct_answer ? 1 : result.student_answer == 0 ? -1 : 0,

      open_time: openTime,
      submit_time: submitTime,
      duration: duration,
      max_marks: marks,
      obtained_marks: obtainedMarks,
      question_type: question.question_type

    };

  });

  // =========================
  // PRACTICAL SECTION
  // =========================

  const practicalAttemptsRaw = await prisma.student_question_attempts.findMany({
    where: {
      student_id: studentId,
      question_id: {
        in: practicalQuestionIds
      }
    },
    include: {
      question: {
        include: {
          pc_questions: {
            include: {
              pc: {
                include: {
                  nos: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      id: "asc"
    }
  });

  const practicalAttempts = sortByNosAndPc(practicalAttemptsRaw);

  const practical_report = practicalAttempts.map((item, index) => {
    const pcData = item.question.pc_questions?.[0];

    return {
      sr_no: index + 1,

      nos_name: pcData?.pc?.nos?.nos_name || "",

      pc_name: pcData?.pc?.pc_name || "",

      question: item.question.question,

      max_marks: Number(item.max_marks || 0),

      obtained_marks: Number(item.obtained_marks || 0),

      question_type: item.question.question_type,
    };
  });

  // =========================
  // VIVA SECTION
  // =========================

  const vivaAttemptsRaw = await prisma.student_question_attempts.findMany({
    where: {
      student_id: studentId,
      question_id: {
        in: vivaQuestionIds
      }
    },
    include: {
      question: {
        include: {
          pc_questions: {
            include: {
              pc: {
                include: {
                  nos: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      id: "asc"
    }
  });

  const vivaAttempts = sortByNosAndPc(vivaAttemptsRaw);

  const viva_report = vivaAttempts.map((item, index) => {
    const pcData = item.question.pc_questions?.[0];

    return {
      sr_no: index + 1,

      nos_name: pcData?.pc?.nos?.nos_name || "",

      pc_name: pcData?.pc?.pc_name || "",

      question: item.question.question,

      max_marks: Number(item.max_marks || 0),

      obtained_marks: Number(item.obtained_marks || 0),

      question_type: item.question.question_type,
    };
  });

  const totalTheoryMarks = Number(
    student.batch.qualification_pack.total_theory_marks
  );

  const totalPracticalMarks = Number(
    student.batch.qualification_pack.total_practical_marks
  )

  const totalVivaMarks = Number(
    student.batch.qualification_pack.total_viva_marks
  )

  const totalProjectMarks = Number(
    student.batch.qualification_pack.total_project_marks
  )

  const hasTheory = Boolean(student.batch.theory_exam_set_id);
  const hasPractical = Boolean(student.batch.practical_exam_set_id);
  const hasViva = Boolean(student.batch.viva_exam_set_id);

  const totalMarks = getEnabledTotal(
    {
      theory: totalTheoryMarks,
      practical: totalPracticalMarks,
      viva: totalVivaMarks,
    },
    {
      theory: hasTheory,
      practical: hasPractical,
      viva: hasViva,
    }
  );

  let obtainedTheoryMarks = 0;
  let obtainedPracticalMarks = 0;
  let obtainedVivaMarks = 0;

  const obtainedProjectMarks = 0;

  questions.forEach((item) => {
    const question = item.questions;
    const result = resultMap.get(question.id);

    const marks = item.marks || question.marks || 0;

    if (result && result.student_answer === result.correct_answer) {
      obtainedTheoryMarks += marks;
    }
  });

  practicalAttempts.forEach((item) => {
    obtainedPracticalMarks += Number(item.obtained_marks || 0);
  });

  vivaAttempts.forEach((item) => {
    obtainedVivaMarks += Number(item.obtained_marks || 0);
  });

  const attemptMarks = [
    ...practicalAttemptsRaw.map((item) => ({
      questionId: item.question_id,
      obtainedMarks: Number(item.obtained_marks || 0),
    })),
    ...vivaAttemptsRaw.map((item) => ({
      questionId: item.question_id,
      obtainedMarks: Number(item.obtained_marks || 0),
    })),
  ];

  const nosCutoff =
    Number(student.batch.qualification_pack.nos_cutoff_marks) || 0;

  const nosResults = calculateNosPercentages(resultQuestions, {
    theoryCorrectQuestionIds,
    attempts: attemptMarks,
  }).map((nos) => ({
    ...nos,
    cutoff: nosCutoff,
  }));

  const summary_report = nosResults.map((nos, index) => ({
    sr_no: index + 1,
    nos_name: nos.nosName || nos.nosCode,
    total_marks: nos.totalMarks,
    obtained_marks: nos.obtainedMarks,
  }));

  const theoryPercentage = getPercentage(obtainedTheoryMarks, totalTheoryMarks);
  const practicalPercentage = getPercentage(obtainedPracticalMarks, totalPracticalMarks);
  const vivaPercentage = getPercentage(obtainedVivaMarks, totalVivaMarks);
  const projectPercentage = getPercentage(obtainedProjectMarks, totalProjectMarks);

  const theoryCutoff =
    Number(student.batch.qualification_pack.theory_cutoff_marks) || 0;

  const practicalCutoff =
    Number(student.batch.qualification_pack.practical_cutoff_marks) || 0;

  const vivaCutoff =
    Number(student.batch.qualification_pack.viva_cutoff_marks) || 0;

  const projectCutoff =
    Number(student.batch.qualification_pack.overall_cutoff_marks) || 0;

  const theoryResultStatus = getSectionStatus(
    theoryPercentage,
    theoryCutoff,
    RESULT_CRITERIA.theory && hasTheory
  );

  const practicalResultStatus = getSectionStatus(
    practicalPercentage,
    practicalCutoff,
    RESULT_CRITERIA.practical && hasPractical
  );

  const vivaResultStatus = getSectionStatus(
    vivaPercentage,
    vivaCutoff,
    RESULT_CRITERIA.viva && hasViva
  );

  const projectResultStatus =
    projectPercentage >= projectCutoff ? "PASS" : "FAIL";

  const obtainedMarks = getEnabledObtained(
    {
      theory: obtainedTheoryMarks,
      practical: obtainedPracticalMarks,
      viva: obtainedVivaMarks,
    },
    {
      theory: hasTheory,
      practical: hasPractical,
      viva: hasViva,
    }
  );

  const overallCutoff =
    Number(student.batch.qualification_pack.overall_cutoff_marks) || 0;

  const overallPercentage = getPercentage(obtainedMarks, totalMarks);

  const evaluation = evaluateResult({
    theory: {
      applicable: hasTheory,
      percentage: theoryPercentage,
      cutoff: theoryCutoff,
    },
    practical: {
      applicable: hasPractical,
      percentage: practicalPercentage,
      cutoff: practicalCutoff,
    },
    viva: {
      applicable: hasViva,
      percentage: vivaPercentage,
      cutoff: vivaCutoff,
    },
    overall: {
      applicable: true,
      percentage: overallPercentage,
      cutoff: overallCutoff,
    },
    nos: nosResults,
  });

  const overallResultStatus = evaluation.pass ? "PASS" : "FAIL";

  const sscImage = student.batch.qualification_pack.ssc?.ssc_image
    ? getValidImage(student.batch.qualification_pack.ssc.ssc_image, `ssc/${student.batch.qualification_pack.ssc.id}`)
    : null;

  const agencyImage = student.batch.agency?.avatar
    ? getValidImage(student.batch.agency.avatar, `agency/${student.batch.agency.id}`)
    : null;

  const tpImage = student.batch.training_partner?.avatar
    ? getValidImage(student.batch.training_partner.avatar, `agency/users/${student.batch.training_partner.id}`)
    : null;

  const agencyStamp = student.batch.agency?.sign_image ? getValidImage(student.batch.agency.sign_image, `agency/${student.batch.agency.id}/sign`) : null;
  const tcStamp = student.batch.training_center?.sign_image ? getValidImage(student.batch.training_center.sign_image, `agency/users/${student.batch.training_center.id}/sign`) : null;

  return NextResponse.json({

    candidate: {

      ssc_image: sscImage ? sscImagePath(student.batch.qualification_pack.ssc.id, sscImage) || null : null,

      agency_image: agencyImage ? agencyImagePath(student.batch.agency.id, agencyImage) || null : null,
      agency_sign: agencyStamp ? agencyImagePath(student.batch.agency.id, `sign/${agencyStamp}`) || null : null,

      tp_image: tpImage ? agencyUsersFilePath(student.batch.training_partner.id, tpImage) || null : null,
      tc_sign: tcStamp ? agencyUsersFilePath(student.batch.training_center.id, `sign/${tcStamp}`) || null : null,

      agency_name: agencyName || "",
      agency_head_name: student.batch.agency ? (student.batch.agency?.first_name + " " + student.batch.agency?.last_name).trim() : "",
      center_manager_name: student.batch?.center_spoc_person_name ? student.batch.center_spoc_person_name : student.batch.training_center ? (student.batch.training_center?.first_name + " " + student.batch.training_center?.last_name).trim() : "",

      name: student.candidate_name.toUpperCase(),
      candidate_id: student.candidate_id,
      aadhaar: student.aadhaar_no ? decrypt(student.aadhaar_no) : null,
      assessment_date: student.batch.assessment_start_datetime ? format(student.batch.assessment_start_datetime, 'dd-MMM-yyyy') : null,

      batch: student.batch.batch_name,

      scheme:
        student.batch.scheme.scheme_name,

      sub_scheme:
        student.batch.sub_scheme.scheme_name,

      qp:
        student.batch.qualification_pack
          .qualification_pack_name,

      partner:
        student.batch.training_partner
          .company_name,


      total_marks: totalMarks,
      obtained_marks: obtainedMarks,
      percentage: overallPercentage.toFixed(2),
      result_status: overallResultStatus,
      total_theory_marks: totalTheoryMarks,
      obtained_theory_marks: obtainedTheoryMarks,
      theory_percentage: theoryPercentage.toFixed(2),
      theory_result_status: theoryResultStatus,
      total_practical_marks: totalPracticalMarks,
      obtained_practical_marks: obtainedPracticalMarks,
      practical_percentage: practicalPercentage.toFixed(2),
      practical_result_status: practicalResultStatus,
      total_viva_marks: totalVivaMarks,
      obtained_viva_marks: obtainedVivaMarks,
      viva_percentage: vivaPercentage.toFixed(2),
      viva_result_status: vivaResultStatus,
      total_project_marks: totalProjectMarks,
      obtained_project_marks: obtainedProjectMarks,
      project_percentage: projectPercentage.toFixed(2),
      project_result_status: projectResultStatus,
      summary_report: summary_report

    },

    report,
    practical_report,
    viva_report


  });

}
