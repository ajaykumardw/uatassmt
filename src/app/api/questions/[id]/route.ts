// Next Imports
import { NextResponse } from 'next/server'

// Data Imports
import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function GET(
  req: Request,
  context: { params: { id: number } }
) {

  const session = await getServerSession(authOptions);
  const agency_id = Number(session?.user?.agency_id);

  const id = Number(context.params.id);

  const question = await prisma.questions.findFirst({
    where: {
      id: id,
      agency_id: agency_id
    },
    include: {
      pc: true
    }
  })

  return NextResponse.json(question);
}

export async function POST(
  req: Request,
  context: { params: { id: number } }
) {
  const id = Number(context.params.id);

  const session = await getServerSession(authOptions);
  const agency_id = Number(session?.user?.agency_id);

  const {selectPC, questionType, questionLevel, questionName, questionExplanation, option1, option2, option, correctAnswer, questionMarks} = await req.json();

  const filterOption = option.filter((opt: string) => {
    return opt !== ''
  });

  // const theoryCutoff = isTheoryCutoff === true ? theoryCutoffMarks : '';
  // const vivaCutoff = isVivaCutoff === true ? vivaCutoffMarks : '';
  // const practicalCutoff = isPracticalCutoff === true ? practicalCutoffMarks : '';
  // const overallCutoff = isOverallCutoff === true ? overallCutoffMarks : '';

  const questionExist = await prisma.questions.findUnique({
    where: {
      id: id,
      agency_id: agency_id
    },
    include: {
      pc: true
    }
  })

  if (questionExist) {

    const newPCToConnect = selectPC.filter((pcId: any) => {
      return !questionExist.pc.some(existingPC => existingPC.id === Number(pcId));
    });

    // Find nos to disconnect (those present in DB but not in selectedNos)
    const pcToDisconnect = questionExist.pc.filter(existingPC => {
      return !selectPC.includes(existingPC.id.toString());
    });

    const result = await prisma.questions.update({
      where: {
        id: id,
        agency_id: agency_id
      },
      data: {
        question_type: questionType,
        question_level: questionLevel,
        question_explanation: questionExplanation,
        question: questionName,
        option1: option1,
        option2: option2,
        option3: filterOption[0],
        option4: filterOption[1],
        option5: filterOption[2],
        answer: Number(correctAnswer),
        marks: Number(questionMarks),
        pc: {
          connect: newPCToConnect.map((pcId: any) => ({ id: Number(pcId) })),
          disconnect: pcToDisconnect.map(pc => ({ id: pc.id }))
        }
      }
    });

    if(result){

      return NextResponse.json({ message: 'Question updated successfully!' });
    }else{

      return NextResponse.json({ message: 'Question not updated!' }, { status: 500 });
    }
  } else {

    return NextResponse.json({ message: 'Question not found' }, { status: 404 });
  }
}

// export async function PATCH(
//   req: Request,
//   context: { params: { id: number } }
// ) {
//   const id = Number(context.params.id);

//   const session = await getServerSession(authOptions);
//   const agency_id = Number(session?.user?.agency_id);

//   const { selectedNos } = await req.json();

//   // Fetch the existing qualification pack
//   const qualificationPackExist = await prisma.qualification_packs.findUnique({
//     where: {
//       id: id,
//       agency_id: agency_id
//     },
//     include: {
//       nos: true // Include related NOS to check existing connections
//     }
//   });

//   if (qualificationPackExist) {
//     // Filter selectedNos to exclude ones already connected
//     const newNosToConnect = selectedNos.filter((nosId: any) => {
//       return !qualificationPackExist.nos.some(existingNos => existingNos.id === nosId);
//     });

//     // Find nos to disconnect (those present in DB but not in selectedNos)
//     const nosToDisconnect = qualificationPackExist.nos.filter(existingNos => {
//       return !selectedNos.includes(existingNos.id);
//     });

//     // Update the qualification pack with new connections and disconnects
//     const result = await prisma.qualification_packs.update({
//       where: {
//         id: id,
//         agency_id: agency_id
//       },
//       data: {
//         nos: {
//           connect: newNosToConnect.map((nosId: any) => ({ id: nosId })),
//           disconnect: nosToDisconnect.map(nos => ({ id: nos.id }))
//         }
//       }
//     });

//     if (result) {
//       return NextResponse.json({ message: 'NOS updated successfully' });
//     } else {
//       return NextResponse.json({ message: 'Failed to update NOS' }, { status: 500 });
//     }
//   } else {
//     return NextResponse.json({ message: 'Qualification pack not found' }, { status: 404 });
//   }
// }

