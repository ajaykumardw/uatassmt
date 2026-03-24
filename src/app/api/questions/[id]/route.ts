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
      pc_questions: {
        orderBy: {
          pc_id: 'asc'
        },
        include: {
          pc: true
        }
      }
    }
  })

  // question?.pc.sort((a, b) => {
  //   const numA = parseInt(a.pc_id.replace(/^\D+/g, ''), 10);
  //   const numB = parseInt(b.pc_id.replace(/^\D+/g, ''), 10);

  //   return numA - numB;
  // });

  // return NextResponse.json(question);

  if(!question){

    return NextResponse.json(
      {message:'Question not found'},
      {status:404}
    );

  }

  const sortedPc=question.pc_questions
    .map(rel=>rel.pc)
    .sort((a,b)=>{

      const numA=parseInt(a.pc_id.replace(/^\D+/g,''),10);
      const numB=parseInt(b.pc_id.replace(/^\D+/g,''),10);

      return numA-numB;

    });

  const formatted={

    ...question,

    pc:sortedPc

  };

  return NextResponse.json(formatted);

}

export async function POST(
  req: Request,
  context: { params: { id: number } }
) {
  const id = Number(context.params.id);

  const session = await getServerSession(authOptions);
  const agency_id = Number(session?.user?.agency_id);

  const {selectPC, questionType, questionLevel, questionName, questionExplanation, option1, option2, option, correctAnswer} = await req.json();

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
      pc_questions: {
        include: {
          pc: true
        }
      }
    }
  })

  if (questionExist) {

    const newPCToConnect = selectPC.filter((pcId: any) => {
      return !questionExist.pc_questions.some(existingPC => existingPC.pc.id === Number(pcId));
    });

    // Find nos to disconnect (those present in DB but not in selectedNos)
    const pcToDisconnect = questionExist.pc_questions.filter(existingPC => {
      return !selectPC.includes(existingPC.pc.id.toString());
    });


    const pcsTotalMarks = await prisma.pc.aggregate({
      _sum: {
        theory_marks: true
      },
      where: {
        id: {
          in: selectPC.map((value: string) => Number(value))
        }
      }
    });

    console.log(pcsTotalMarks._sum.theory_marks); // This will directly give you the sum of theory_marks


    console.log("pcsTotalMarks: ", pcsTotalMarks);


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
        marks: Number(pcsTotalMarks._sum.theory_marks),
        pc_questions: {
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

