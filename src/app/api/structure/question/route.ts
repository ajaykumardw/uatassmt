
// Next Imports
import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

// Data Imports
import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

// export async function GET(req: Request) {

//   const url = new URL(req.url);

//   const qpId = url.searchParams.get('qpId');

//   const nosId = url.searchParams.get('nosId');

//   const pcId = url.searchParams.get('pcId');

//   const qType = url.searchParams.get('qType') || 'theory';

//   const questionType = qType === 'practical' ? 'practical' : qType === 'viva' ? 'viva' : 'theory';

//   const page = Number(url.searchParams.get('page') || 1);

//   const limit = Number(url.searchParams.get('limit') || 50);

//   const questions = await prisma.questions.findMany({

//     where: {

//       question_type: questionType,

//       ...(qpId && {

//         pc: {
//           some: {
//             nos: {
//               qualification_packs: {
//                 some: {
//                   id: Number(qpId)
//                 }
//               }
//             }
//           }

//         }

//       }),

//       ...(nosId && {

//         pc: {
//           some: {
//             nos_id: Number(nosId)
//           }

//         }

//       }),

//       ...(pcId && {

//         pc: {
//           some: {
//             id: Number(pcId)
//           }

//         }

//       })

//     },

//     include: {

//       pc: {
//         select: {
//           id: true,
//           pc_id: true,
//           pc_name: true
//         },

//         orderBy: {
//           pc_id: 'asc'
//         }
//       },

//       exam_sets_questions: {
//         select: {
//           id: true
//         }
//       }

//     },

//     skip: (page - 1) * limit,

//     take: limit,

//     orderBy: {
//       id: 'desc'
//     }

//   });

//   const formatted = questions.map(q => ({

//     ...q,

//     inExamSet: q.exam_sets_questions.length > 0

//   }));

//   return NextResponse.json(formatted);

// }


export async function GET(req: Request) {

  const url = new URL(req.url);

  const qpId = url.searchParams.get('qpId');

  const nosId = url.searchParams.get('nosId');

  const pcId = url.searchParams.get('pcId');

  const search = url.searchParams.get('search') || '';

  const qType = url.searchParams.get('qType') || 'theory';

  const page = Number(url.searchParams.get('page') || 1);

  const limit = Number(url.searchParams.get('limit') || 25);

  const where: any = {

    question_type: qType,

    ...(search && {

      question: {
        contains: search,
      }

    })

  };

  if (qpId) {

    where.pc = {

      some: {
        nos: {
          qualification_packs: {
            some: {
              id: Number(qpId)
            }
          }
        }
      }

    };

  }

  if (nosId) {

    where.pc = {

      some: {
        nos_id: Number(nosId)
      }

    };

  }

  if (pcId) {

    where.pc = {

      some: {
        id: Number(pcId)
      }

    };

  }

  const [questions, total] = await Promise.all([

    prisma.questions.findMany({

      where,

      include: {

        pc: {
          select: {
            id: true,
            pc_id: true,
            pc_name: true
          }
        },

        exam_sets_questions: {
          select: {
            id: true
          }
        }

      },

      skip: (page - 1) * limit,

      take: limit,

      orderBy: {
        id: 'desc'
      }

    }),

    prisma.questions.count({ where })

  ]);

  return NextResponse.json({

    data: questions.map(q => ({

      ...q,

      inExamSet: q.exam_sets_questions.length > 0

    })),

    total,

    page,

    limit

  });

}
