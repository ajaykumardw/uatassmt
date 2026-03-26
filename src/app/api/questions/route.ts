// Next Imports
import { NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

// export async function GET(req: Request) {

//   const url = new URL(await req.url);
//   const qpId = url.searchParams.get('qpId');
//   const qType = url.searchParams.get('qType');

//   // console.log('qType', qType);

//   if(qpId){
//     const questions = await prisma.questions.findMany({
//       where: {

//         // qp_id: Number(qpId),

//         question_type: qType == 'practical' ? 'practical' : qType == 'viva' ? 'viva' : 'theory',
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
//       },
//       include: {
//         pc: {
//           orderBy: {
//             pc_id: 'asc'
//           },
//         }
//       }
//     })

//     questions.forEach(q =>
//       q.pc.sort((a, b) => {
//         const numA = parseInt(a.pc_id.replace(/^\D+/g, ''), 10);
//         const numB = parseInt(b.pc_id.replace(/^\D+/g, ''), 10);

//         return numA - numB;
//       })
//     );

//     return NextResponse.json(questions);

//   }

//   // const questions = await prisma.questions.findMany({
//   // });
//   const questions = await prisma.sector_skill_councils.findMany({
//     select: {
//       id: true,
//       agency_id: true,
//       ssc_name: true,
//       qualification_packs: {
//         select: {
//           id: true,
//           qualification_pack_id: true,
//           qualification_pack_name: true,
//           nsqf_level: true,
//           nos: {
//             orderBy: {
//               nos_id: 'asc'
//             },
//             select: {
//               id: true,
//               nos_id: true,
//               nos_name: true,
//               pc: {
//                 orderBy: {
//                   pc_id: 'asc'
//                 },
//                 select: {
//                   id: true,
//                   pc_id: true,
//                   pc_name: true,
//                   theory_marks: true,
//                   practical_marks: true,
//                   viva_marks: true,
//                   questions: {
//                     where: {
//                       question_type: 'theory'
//                     },
//                     include: {
//                       pc: {
//                         orderBy: {
//                           pc_id: 'asc'
//                         },
//                         select: {
//                           id: true,
//                           pc_id: true,
//                           pc_name: true,
//                           nos: {
//                             select: {
//                               id: true,
//                               nos_id: true,
//                               nos_name: true,
//                               qualification_packs: {
//                                 select: {
//                                   id: true,
//                                   qualification_pack_id: true,
//                                   qualification_pack_name: true,
//                                 }
//                               }
//                             }
//                           }
//                         }
//                       },
//                       exam_sets_questions: {
//                         select: {
//                           id: true,
//                           exam_set_id: true
//                         }
//                       }
//                     }
//                   }
//                 }
//               }
//             }
//           }
//         }
//       }
//     },
//     orderBy:{
//       ssc_name: "asc"
//     }
//   });

//   // questions.forEach(ssc => {
//   //   ssc.qualification_packs.forEach(qp => {
//   //     qp.nos.forEach(nos => {
//   //       nos.pc.forEach(pc => {
//   //         pc.questions.sort((a, b) => {
//   //           const numA = parseInt(a.pc[0].pc_id.replace(/^\D+/g, ''), 10);
//   //           const numB = parseInt(b.pc[0].pc_id.replace(/^\D+/g, ''), 10);

//   //           return numA - numB;
//   //         });
//   //       });
//   //     });
//   //   });
//   // });

//   questions.forEach(ssc => {
//     ssc.qualification_packs.forEach(qp => {
//       qp.nos.forEach(nos => {
//         nos.pc.forEach(pc => {
//           pc.questions = pc.questions.map(question => {
//             question.pc.sort((a, b) => {
//               const numA = parseInt(a.pc_id.replace(/^\D+/g, ''), 10);
//               const numB = parseInt(b.pc_id.replace(/^\D+/g, ''), 10);

//               return numA - numB;
//             });

//             return {
//               ...question,
//               inExamSet: question.exam_sets_questions.length > 0
//             };
//           });
//         });
//       });
//     });
//   });

//   // console.log(qualificationPacks);

//   return NextResponse.json(questions);
// }

// export async function GET(req: Request) {

//   const url = new URL(req.url);
//   const qpId = url.searchParams.get('qpId');
//   const qType = url.searchParams.get('qType');

//   const questionType =
//     qType == 'practical'
//       ? 'practical'
//       : qType == 'viva'
//       ? 'viva'
//       : 'theory';

//   // ✅ Optimized query when qpId exists
//   if(qpId){

//     const questions = await prisma.questions.findMany({

//       where:{
//         question_type: questionType,

//         pc:{
//           some:{
//             nos:{
//               qualification_packs: {
//                 some: {
//                   id: Number(qpId)
//                 }
//               }
//             }
//           }
//         }
//       },

//       include:{

//         pc:{
//           where:{
//             nos:{
//               qualification_packs: {
//                 some: {
//                   id: Number(qpId)
//                 }
//               }
//             }
//           },

//           select:{
//             id:true,
//             pc_id:true,
//             pc_name:true,

//             nos:{
//               select:{
//                 id:true,
//                 nos_id:true,
//                 nos_name:true
//               }
//             }
//           },

//           orderBy:{
//             pc_id:'asc'
//           }
//         },

//         exam_sets_questions:{
//           select:{
//             id:true,
//             exam_set_id:true
//           }
//         }

//       },

//       orderBy:{
//         id:'desc'
//       }

//     });

//     // ✅ Lightweight formatting
//     const formatted = questions.map(q=>({

//       ...q,

//       pc:q.pc.sort((a,b)=>{

//         const numA=parseInt(a.pc_id.replace(/^\D+/g,''),10);
//         const numB=parseInt(b.pc_id.replace(/^\D+/g,''),10);

//         return numA-numB;

//       }),

//       inExamSet:q.exam_sets_questions.length>0

//     }));

//     return NextResponse.json(formatted);

//   }

//   // ✅ Optimized default query (no qpId)
//   const questions = await prisma.questions.findMany({

//     where:{
//       question_type:'theory'
//     },

//     include:{

//       pc:{
//         select:{
//           id:true,
//           pc_id:true,
//           pc_name:true,

//           nos:{
//             select:{
//               id:true,
//               nos_id:true,
//               nos_name:true,

//               qualification_packs:{
//                 select:{
//                   id:true,
//                   qualification_pack_id:true,
//                   qualification_pack_name:true,

//                   ssc:{
//                     select:{
//                       id:true,
//                       ssc_name:true
//                     }
//                   }
//                 }
//               }
//             }
//           }
//         },

//         orderBy:{
//           pc_id:'asc'
//         }

//       },

//       exam_sets_questions:{
//         select:{
//           id:true,
//           exam_set_id:true
//         }
//       }

//     },

//     orderBy:{
//       id:'desc'
//     }

//   });

//   const formatted = questions.map(q=>({

//     ...q,

//     pc:q.pc.sort((a,b)=>{

//       const numA=parseInt(a.pc_id.replace(/^\D+/g,''),10);
//       const numB=parseInt(b.pc_id.replace(/^\D+/g,''),10);

//       return numA-numB;

//     }),

//     inExamSet:q.exam_sets_questions.length>0

//   }));

//   return NextResponse.json(formatted);

// }

export async function GET(req: Request) {

  const url = new URL(req.url);
  const qpId = url.searchParams.get('qpId');
  const qType = url.searchParams.get('qType');

  const session = await getServerSession(authOptions);
  const agency_id = Number(session?.user?.agency_id);

  const questionType =
    qType === 'practical'
      ? 'practical'
      : qType === 'viva'
      ? 'viva'
      : 'theory';


  // ================= QP FILTER =================

  if (qpId) {

    const questions = await prisma.questions.findMany({

      where: {

        agency_id: agency_id,

        question_type: questionType,

        pc_questions:{
          some:{
            agency_id: agency_id,
            pc:{
              nos:{
                qualification_packs:{
                  some: {
                    id:Number(qpId)
                  }
                }
              }
            }
          }
        }

      },

      select:{

        id:true,
        question:true,
        marks:true,
        question_type:true,
        question_level: true,

        pc_questions:{
          select:{
            pc:{
              select:{
                id:true,
                pc_id:true,
                pc_name:true
              }
            }
          }
        }

      }

    });


    // Flatten PC mapping
    const formatted = questions.map(q=>({

      ...q,

      pc:q.pc_questions
        .map(p=>p.pc)
        .sort((a,b)=>{

          const numA=parseInt(a.pc_id.replace(/^\D+/g,''),10);
          const numB=parseInt(b.pc_id.replace(/^\D+/g,''),10);

          return numA-numB;

        })

    }));


    return NextResponse.json(formatted);

  }


  // ================= FULL TREE =================


  const data = await prisma.sector_skill_councils.findMany({

    select:{

      id:true,
      agency_id:true,
      ssc_name:true,

      qualification_packs:{
        select:{

          id:true,
          qualification_pack_id:true,
          qualification_pack_name:true,
          nsqf_level:true,

          nos:{
            orderBy:{nos_id:'asc'},

            select:{

              id:true,
              nos_id:true,
              nos_name:true,

              pc:{
                where: {
                  agency_id: agency_id
                },
                orderBy:{pc_id:'asc'},

                select:{

                  id:true,
                  pc_id:true,
                  pc_name:true,

                  theory_marks:true,
                  practical_marks:true,
                  viva_marks:true,

                  pc_questions:{

                    where:{
                      agency_id: agency_id,
                      question:{
                        agency_id: agency_id,
                        question_type:'theory'
                      }
                    },

                    select:{

                      agency_id:true,

                      question:{

                        include:{

                          // id:true,
                          // question:true,
                          // marks:true,
                          // question_type:true,
                          pc_questions: {
                            include: {
                              pc: true
                            }
                          },

                          exam_sets_questions:{
                            select:{
                              id:true,
                              exam_set_id:true
                            }
                          }

                        }

                      },

                      pc:{
                        select:{
                          id:true,
                          pc_id:true,
                          pc_name:true,

                          // pc:{
                          //   select:{
                          //     id:true,
                          //     pc_id:true,
                          //     pc_name:true
                          //   }
                          // }
                        }
                      }

                    }

                  }

                }

              }

            }

          }

        }

      }

    },

    orderBy:{
      ssc_name:'asc'
    }

  });


  // ================= FLATTEN STRUCTURE =================


  const formatted = data.map((ssc: any) => ({

    ...ssc,

    qualification_packs:ssc.qualification_packs.map((qp: any) => ({

      ...qp,

      nos:qp.nos.map((nos: any) => ({

        ...nos,

        pc:nos.pc.map((pc: any) => ({
          ...pc,

          // questions:pc.questions.map((q: any) => {

          //   const question=q.question;

          //   const pcs=q.pc
          //     .map((p: any) => p.pc)
          //     .sort((a: any, b: any) => {

          //       const numA=parseInt(a.pc_id.replace(/^\D+/g,''),10);
          //       const numB=parseInt(b.pc_id.replace(/^\D+/g,''),10);

          //       return numA-numB;

          //     });

          //   return{

          //     ...question,

          //     pc:pcs,

          //     inExamSet:question.exam_sets_questions.length>0

          //   };

          // })

          questions:pc.pc_questions.map((q:any)=>{

            const question=q.question;

            // const pcs=q.pc.sort((a:any,b:any)=>{

            //   const numA=parseInt(a.pc_id.replace(/^\D+/g,''),10);
            //   const numB=parseInt(b.pc_id.replace(/^\D+/g,''),10);

            //   return numA-numB;

            // });

            // const pcs=Array.isArray(q.pc)
            //   ? q.pc.sort((a:any,b:any)=>{

            //       const numA=parseInt(a.pc_id.replace(/^\D+/g,''),10);
            //       const numB=parseInt(b.pc_id.replace(/^\D+/g,''),10);

            //       return numA-numB;

            //     })
            //   : [];

            const pcs=question.pc_questions
              ?.map((rel:any)=>rel.pc)
              .sort((a:any,b:any)=>{

                const numA=parseInt(a.pc_id.replace(/^\D+/g,''),10);

                const numB=parseInt(b.pc_id.replace(/^\D+/g,''),10);

                return numA-numB;

              }) || [];

            return{

              ...question,

              pc:pcs,

              inExamSet:question.exam_sets_questions.length>0

            };

          })

        }))

      }))

    }))

  }));

  // console.log(formatted);


  return NextResponse.json(formatted);

}

export async function POST(req: Request) {

  const reqData = await req.json();

  // const {selectPC, sscId, qpId, pcId, questionLevel, questionName, questionExplanation, option1, option2, option, correctAnswer, questionMarks} = reqData;

  const {selectPC, sscId, qpId, questionLevel, questionName, questionExplanation, option1, option2, option, correctAnswer} = reqData;
  const session = await getServerSession(authOptions);
  const createdBy = Number(session?.user.id);
  const agency_id = Number(session?.user?.agency_id);

  const filterOption = option.filter((opt: string) => {
    return opt !== ''
  });

  // const pcExist = await prisma.questions.findUnique({
  //   where: {
  //     agency_id: agency_id,
  //     id: pcId
  //   }
  // })


  // if(pcExist){

  //   return NextResponse.json({message: 'PC already exist.'}, {status: 409});
  // }else{

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

    const result = await prisma.questions.create({
      data: {
        agency_id: agency_id,
        ssc_id: sscId,
        qp_id: qpId,
        language_id: 1,
        question_type: 'theory',
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
        created_by: createdBy,
        pc_questions: {
          create: selectPC.map((pcId: any) => ({
            agency_id: agency_id,
            created_by: createdBy,
            pc: {
              connect: {id: Number(pcId)}
            }
          })),

          // connect: selectPC.map((pcId: any) => ({ id: Number(pcId) }))
        }
      }
    });

    if(result){
      return NextResponse.json({message: 'Question created successfully!'})
    }else{
      return NextResponse.json({message: 'Not created Question!'}, {status: 500})
    }

  // }

}
