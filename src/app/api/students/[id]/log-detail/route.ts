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

import { authOptions } from "@/libs/auth";

import { format } from "date-fns";

import prisma from "@/libs/prisma";

import { decrypt } from "@/utils/encryption";

import { sscImagePath } from "@/configs/customDataConfig";

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
                ssc: {
                  select: {
                    id: true,
                    ssc_image: true,
                  }
                }

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

  const report = questions.map((item, index) => {

    const question =
      item.questions;

    const result =
      resultMap.get(question.id);

    const pcData =
      question.pc_questions?.[0];

    const options: any = {

      1: question.option1,
      2: question.option2,
      3: question.option3,
      4: question.option4,
      5: question.option5

    };

    const correct =
      options[question.answer || 0] || "--";

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

      status: !result ? -1 : result.student_answer === question.answer ? 1 : result.student_answer == 0 ? -1 : 0

    };

  });

  const totalMarks = Number(
    student.batch.qualification_pack.total_theory_marks
  );

  let obtainedMarks = 0;

  questions.forEach((item) => {
    const question = item.questions;
    const result = resultMap.get(question.id);

    const marks = item.marks || question.marks || 0;

    if (result && result.student_answer === question.answer) {
      obtainedMarks += marks;
    }
  });

  const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

  const cutoff =
    Number(student.batch.qualification_pack.theory_cutoff_marks) || 0;

  const resultStatus =
    percentage >= cutoff ? "PASS" : "FAIL";

  return NextResponse.json({

    candidate: {

      ssc_image: student.batch.qualification_pack.ssc?.ssc_image ? sscImagePath(student.batch.qualification_pack.ssc.id, student.batch.qualification_pack.ssc.ssc_image) || null : null,

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
      percentage: percentage.toFixed(2),
      result_status: resultStatus

    },

    report,


  });

}
