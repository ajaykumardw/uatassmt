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

import { agencyImagePath, sscImagePath } from "@/configs/customDataConfig";
import getValidImage from "@/utils/getValidImage";

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
              }
            },
            training_partner: true
          }
        }
      }

    });

  if (!student)
    return NextResponse.json([]);

  const examSetId =
    student.batch.theory_exam_set_id;

  const questions =
    await prisma.exam_sets_questions.findMany({

      where: {
        exam_set_id: examSetId!
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

    const isCorrect = result?.student_answer === question.answer;

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

      status: !result ? -1 : result.student_answer === question.answer ? 1 : result.student_answer == 0 ? -1 : 0,

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

  const practicalAttempts = await prisma.student_question_attempts.findMany({
    where: {
      student_id: studentId,
      question: {
        question_type: "practical"
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

  const vivaAttempts = await prisma.student_question_attempts.findMany({
    where: {
      student_id: studentId,
      question: {
        question_type: "viva"
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

  const totalMarks = Number(
    student.batch.qualification_pack.total_marks
  );

  let obtainedTheoryMarks = 0;
  let obtainedPracticalMarks = 0;
  let obtainedVivaMarks = 0;
  
  const obtainedProjectMarks = 0;

  questions.forEach((item) => {
    const question = item.questions;
    const result = resultMap.get(question.id);

    const marks = item.marks || question.marks || 0;

    if (result && result.student_answer === question.answer) {
      obtainedTheoryMarks += marks;
    }
  });

  practicalAttempts.forEach((item) => {
    obtainedPracticalMarks += Number(item.obtained_marks || 0);
  });

  vivaAttempts.forEach((item) => {
    obtainedVivaMarks += Number(item.obtained_marks || 0);
  });

  const theoryPercentage = totalTheoryMarks > 0 ? (obtainedTheoryMarks / totalTheoryMarks) * 100 : 0;
  const practicalPercentage = totalPracticalMarks > 0 ? (obtainedPracticalMarks / totalPracticalMarks) * 100 : 0;
  const vivaPercentage = totalVivaMarks > 0 ? (obtainedVivaMarks / totalVivaMarks) * 100 : 0;
  const projectPercentage = totalProjectMarks > 0 ? (obtainedProjectMarks / totalProjectMarks) * 100 : 0;

  const theoryCutoff =
    Number(student.batch.qualification_pack.theory_cutoff_marks) || 0;

  const practicalCutoff =
    Number(student.batch.qualification_pack.practical_cutoff_marks) || 0;

  const vivaCutoff =
    Number(student.batch.qualification_pack.viva_cutoff_marks) || 0;

  const projectCutoff =
    Number(student.batch.qualification_pack.overall_cutoff_marks) || 0;

  const theoryResultStatus =
    theoryPercentage >= theoryCutoff ? "PASS" : "FAIL";

  const practicalResultStatus =
    practicalPercentage >= practicalCutoff ? "PASS" : "FAIL";

  const vivaResultStatus =
    vivaPercentage >= vivaCutoff ? "PASS" : "FAIL";

  const projectResultStatus =
    projectPercentage >= projectCutoff ? "PASS" : "FAIL";

  const obtainedMarks = obtainedTheoryMarks + obtainedPracticalMarks + obtainedVivaMarks + obtainedProjectMarks;

  const overallCutoff =
    Number(student.batch.qualification_pack.overall_cutoff_marks) || 0;

  const overallPercentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

  const overallResultStatus =
    overallPercentage >= overallCutoff ? "PASS" : "FAIL";

  const sscImage = student.batch.qualification_pack.ssc?.ssc_image
    ? getValidImage(student.batch.qualification_pack.ssc.ssc_image, `ssc/${student.batch.qualification_pack.ssc.id}`)
    : null;

  const agencyImage = student.batch.agency?.avatar
    ? getValidImage(student.batch.agency.avatar, `agency/${student.batch.agency.id}`)
    : null;

  return NextResponse.json({

    candidate: {

      ssc_image: sscImage ? sscImagePath(student.batch.qualification_pack.ssc.id, sscImage) || null : null,

      agency_image: agencyImage ? agencyImagePath(student.batch.agency.id, agencyImage) || null : null,

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
      project_result_status: projectResultStatus

    },

    report,
    practical_report,
    viva_report


  });

}
