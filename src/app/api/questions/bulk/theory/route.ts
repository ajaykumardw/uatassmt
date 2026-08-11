// Next Imports
import { NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function POST(req: Request) {

  const {uploadData, sscID, qpID} = await req.json();

  const session = await getServerSession(authOptions);
  const createdBy = Number(session?.user.id);
  const agencyId = Number(session?.user?.agency_id);

  const validationErrors: string[] = [];

  const uploadItems = await Promise.all(uploadData.map(async (item: any) => {

    const pcIds = item.PC_ID.toString().split(',').map((id: string) => id.trim());

    const pcs = await prisma.pc.findMany({
      where: {
        nos: {
          nos_id: item.NOS_ID
        },
        pc_id: {
          in: pcIds.map((pcId: string) => pcId.toString()), // Convert to numbers if needed
        },
      },
      select: {
        id: true,
        theory_marks: true
      }
    });

    const totalPcTheoryMarks = pcs.reduce((sum: number, pc: any) => sum + Number(pc.theory_marks || 0), 0);
    const providedMarks = Number(item.Marks);

    if (totalPcTheoryMarks < providedMarks) {
      validationErrors.push(
        `Question "${item.Question}" has Marks (${providedMarks}) greater than the total theory marks (${totalPcTheoryMarks}) of its linked PC(s) [${pcIds.join(', ')}]. Please provide correct marks.`
      );
    }

    return { item, pcs };
  }));

  if (validationErrors.length > 0) {
    return NextResponse.json({
      message: 'Validation failed!',
      errors: validationErrors
    }, { status: 400 });
  }

  const result = await Promise.all(uploadItems.map(async ({ item, pcs }) => {

    return await prisma.questions.create({
      data: {
        ssc_id: Number(sscID),
        qp_id: Number(qpID),
        language_id: 1,
        question_type: 'theory',
        question_level: item.Question_Level,
        question_explanation: item.Question_Explanation,
        question: item.Question,
        option1: item.Option1,
        option2: item.Option2,
        option3: item.Option3,
        option4: item.Option4,
        option5: item.Option5,
        answer: Number(item.Correct_Answer),
        marks: Number(item.Marks),
        agency_id: agencyId,
        created_by: createdBy,
        pc_questions:{
          create:pcs.map((pc: { id: number }) => ({

            agency_id:agencyId,

            created_by:createdBy,

            pc:{
              connect:{
                id:pc.id
              }
            }

          }))
        }

        // pc_questions: {
        //   connect: pcs.map(selectPc => ({ id: Number(selectPc.id) })),

        //   //connect: pcs.map(selectPc => ({ id: Number(selectPc.id) })),
        // }
      }
    });

  }));

  // const result = await prisma.questions.createMany({
  //   data: mappedData
  // })

  if(result){
    return NextResponse.json({message: 'Questions uploaded successfully!'})
  }else{
    return NextResponse.json({message: 'Questions not uploaded!'}, {status: 500})
  }


}

// export async function POSTs(req: Request) {

//   const reqData = await req.json();

//   const {sscId, qpId, pcId, questionLevel, questionName, questionExplanation, option1, option2, option, correctAnswer, questionMarks} = reqData;
//   const session = await getServerSession(authOptions);
//   const createdBy = Number(session?.user.id);
//   const agency_id = Number(session?.user?.agency_id);

//   const filterOption = option.filter((opt: string) => {
//     return opt !== ''
//   });

//   // const pcExist = await prisma.questions.findUnique({
//   //   where: {
//   //     agency_id: agency_id,
//   //     id: pcId
//   //   }
//   // })


//   // if(pcExist){

//   //   return NextResponse.json({message: 'PC already exist.'}, {status: 409});
//   // }else{

//     const result = await prisma.questions.create({
//       data: {
//         agency_id: agency_id,
//         ssc_id: sscId,
//         qp_id: qpId,
//         language_id: 1,
//         question_type: 'theory',
//         question_level: questionLevel,
//         question_explanation: questionExplanation,
//         question: questionName,
//         option1: option1,
//         option2: option2,
//         option3: filterOption[0],
//         option4: filterOption[1],
//         option5: filterOption[2],
//         answer: Number(correctAnswer),
//         marks: Number(questionMarks),
//         created_by: createdBy,
//         pc: {
//           connect: {
//             id: Number(pcId)
//           }
//         }
//       }
//     });

//     if(result){
//       return NextResponse.json({message: 'Question created successfully!'})
//     }else{
//       return NextResponse.json({message: 'Not created Question!'}, {status: 500})
//     }

//   // }

// }
