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

  const question = await prisma.questions.findUnique({
    where: {
      id: id,
      agency_id: agency_id,
      question_type: 'viva'
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

  // // Sort PCs numerically by pc_id number
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

  const sortedPc=question?.pc_questions
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

// export async function POST(
//   req: Request,
//   context: { params: { id: number } }
// ) {
//   const id = Number(context.params.id);

//   const session = await getServerSession(authOptions);
//   const agency_id = Number(session?.user?.agency_id);

//   const {sscId, qpId, nosId, selectPC, questionName} = await req.json();

//   const questionExist = await prisma.questions.findUnique({
//     where: {
//       id: id,
//       agency_id: agency_id
//     },
//     include: {
//       pc: {
//         include: {
//           pc: true
//         }
//       }
//     }
//   })

//   if (questionExist) {

//     const newPCToConnect = selectPC.filter((pcId: any) => {
//       return !questionExist.pc.some(existingPC => existingPC.id === Number(pcId));
//     });

//     // Find nos to disconnect (those present in DB but not in selectedNos)
//     const pcToDisconnect = questionExist.pc.filter(existingPC => {
//       return !selectPC.includes(existingPC.id.toString());
//     });

//     const pcsTotalMarks = await prisma.pc.aggregate({
//       _sum: {
//         practical_marks: true
//       },
//       where: {
//         id: {
//           in: selectPC.map((value: string) => Number(value))
//         }
//       }
//     });

//     const result = await prisma.questions.update({
//       where: {
//         id: id,
//         agency_id: agency_id
//       },
//       data: {
//         ssc_id: Number(sscId),
//         qp_id: Number(qpId),
//         nos_id: Number(nosId),
//         question: questionName,
//         marks: Number(pcsTotalMarks._sum.practical_marks),
//         pc: {
//           connect: newPCToConnect.map((pcId: any) => ({ id: Number(pcId)})),
//           disconnect: pcToDisconnect.map((pc) => ({ id: pc.id}))
//         }
//       }
//     });

//     if(result){

//       return NextResponse.json({ message: 'Viva Question is updated successfully!' });
//     }else{

//       return NextResponse.json({ message: 'Viva Question not updated!' }, { status: 500 });
//     }
//   } else {

//     return NextResponse.json({ message: 'Viva Question not found' }, { status: 404 });
//   }
// }

export async function POST(
  req:Request,
  context:{params:{id:number}}
){

  const id=Number(context.params.id);

  const session=await getServerSession(authOptions);

  const agency_id=Number(session?.user?.agency_id);

  const {sscId,qpId,nosId,selectPC,questionName}=await req.json();

  const questionExist=await prisma.questions.findFirst({

    where:{
      id:id,
      agency_id:agency_id
    },

    include:{
      pc_questions:{
        include: {
          pc: true
        }
      }
    }

  });

  if(!questionExist){

    return NextResponse.json(
      {message:'Viva Question not found'},
      {status:404}
    );

  }

  const existingPCIds=questionExist.pc_questions
    .map(rel=>rel.pc_id);

  const selectedIds=selectPC.map(Number);

  const pcToAdd=selectedIds.filter(
    (pcId: number)=>!existingPCIds.includes(pcId)
  );

  const pcToRemove=existingPCIds.filter(
    (pcId: number)=>!selectedIds.includes(pcId)
  );

  const pcsTotalMarks=await prisma.pc.aggregate({

    _sum:{
      viva_marks:true
    },

    where:{
      id:{
        in:selectedIds
      }
    }

  });

  await prisma.questions.update({

    where:{
      id:id
    },

    data:{

      ssc_id:Number(sscId),

      qp_id:Number(qpId),

      nos_id:Number(nosId),

      question:questionName,

      marks:Number(pcsTotalMarks._sum.viva_marks) || 0,

      pc_questions:{

        create:pcToAdd.map((pcId: number)=>({

          agency_id:agency_id,

          created_by:Number(session?.user.id),

          pc:{
            connect:{id:pcId}
          }

        })),

        deleteMany:{
          pc_id:{
            in:pcToRemove
          }
        }

      }

    }

  });

  return NextResponse.json({

    message:'Viva Question updated successfully!'

  });

}
