// // Next Imports
// import { NextResponse } from 'next/server'


// // Data Imports
// import { getServerSession } from 'next-auth';

// import type { pc } from '@prisma/client';

// import { authOptions } from '@/libs/auth';

// import prisma from '@/libs/prisma';

// export async function GET(
//   req: Request,
//   context: { params: { id: number } }
// ) {

//   const session = await getServerSession(authOptions);
//   const agencyId = Number(session?.user.agency_id);
//   const id = Number(context.params.id);

//   const batch = await prisma.batches.findFirst({
//     where: {
//       id: id,
//       agency_id: agencyId
//     },
//     include: {
//       qualification_pack: {
//         include: {
//           version: true,
//           ssc: {
//             select: {
//               id: true,
//               ssc_name: true,
//               ssc_code: true,
//               agency: {
//                 select: {
//                   id: true,
//                   company_name: true
//                 }
//               }
//             }
//           }
//         }
//       },
//       theory_exam_set: {
//         include: {
//           exam_sets_questions: {
//             select: {
//               questions: {
//                 select: {
//                   id: true,
//                   marks: true,

//                   pc: {
//                     select: {
//                       id: true,
//                       pc_id: true,
//                       pc_name: true,
//                       theory_marks: true,
//                       practical_marks: true,
//                       viva_marks: true,
//                       nos: {
//                         select: {
//                           nos_id: true,
//                           nos_name: true
//                         }
//                       }
//                     },
//                     orderBy: {
//                       pc_id: 'asc'
//                     }
//                   }
//                 }
//               }
//             }
//           },
//         }
//       },
//       practical_exam_set: {
//         include: {
//           exam_sets_questions: {
//             select: {
//               questions: {
//                 select: {
//                   pc: {
//                     include: {
//                       nos: true
//                     }
//                   }
//                 }
//               }
//             }
//           },
//         }
//       },
//       viva_exam_set: {
//         include: {
//           exam_sets_questions: {
//             select: {
//               questions: {
//                 select: {
//                   pc: {
//                     include: {
//                       nos: true
//                     }
//                   }
//                 }
//               }
//             }
//           },
//         }
//       },
//       students: {
//         select: {
//           id: true,
//           batch_id: true,
//           user_name: true,
//           candidate_id: true,
//           candidate_name: true,

//           // student_exam_set_results: true,

//           exam_set_results: {
//             select: {
//               id: true,
//               exam_set_id: true,
//               student_id: true,
//               question_id: true,
//               student_answer: true,
//               correct_answer: true,
//               question: {
//                 select: {
//                   id: true,
//                   question_type: true,
//                   answer: true,
//                   marks: true,
//                   pc: {
//                     select: {
//                       id: true,
//                       pc_id: true,
//                       pc_name: true,
//                       theory_marks: true,
//                       nos: {
//                         select: {
//                           nos_id: true,
//                           nos_name: true
//                         }
//                       }
//                     },
//                     orderBy: {
//                       pc_id: 'asc'
//                     }
//                   }
//                 }
//               }
//             }
//           },

//           student_question_attempts: {
//             select: {
//               id: true,
//               student_id: true,
//               question_id: true,
//               max_marks: true,
//               obtained_marks: true,
//               question: {
//                 select: {
//                   id: true,
//                   question_type: true,
//                   answer: true,
//                   marks: true,
//                   pc: {
//                     select: {
//                       id: true,
//                       pc_id: true,
//                       pc_name: true,
//                       theory_marks: true,
//                       nos: {
//                         select: {
//                           nos_id: true,
//                           nos_name: true
//                         }
//                       }
//                     },
//                     orderBy: {
//                       pc_id: 'asc'
//                     }
//                   }
//                 }
//               }
//             }
//           }
//         }
//       },
//       scheme: {
//         select: {
//           id: true,
//           scheme_name: true,
//           scheme_code: true
//         }
//       },
//       sub_scheme: {
//         select:{
//           id: true,
//           scheme_name: true,
//           scheme_code: true
//         }
//       },
//     }
//   })



//   // console.log(batch)

//   if(batch){


//     const customBatch: any = batch;

//     // Combine NOS from all exam sets into one array

//     const combinedNOS = groupAllExamSetPCsToNOS(
//       batch.theory_exam_set,
//       batch.practical_exam_set,
//       batch.viva_exam_set
//     );

//     customBatch.nos = combinedNOS;

//     return NextResponse.json(customBatch);
//   }

//   return NextResponse.json({message: "Batch not found!"}, {status: 404});

// }


// function groupAllExamSetPCsToNOS(...examSets: any[]) {
//   const nosMap = new Map();

//   for (const examSet of examSets) {
//     for (const questionSet of examSet?.exam_sets_questions || []) {
//       const pcs = questionSet?.questions?.pc || [];

//       for (const pc of pcs) {
//         if (!pc?.nos) continue;

//         const nosKey = pc.nos.nos_id;

//         if (!nosMap.has(nosKey)) {
//           nosMap.set(nosKey, {
//             nos_id: pc.nos.nos_id,
//             nos_name: pc.nos.nos_name,
//             pcs: [],
//           });
//         }

//         const nosEntry = nosMap.get(nosKey);

//         // Deduplicate PC by pc_id
//         const exists = nosEntry.pcs.some((existingPc: pc) => existingPc.pc_id === pc.pc_id);

//         if (!exists) {
//           nosEntry.pcs.push({
//             id: pc.id,
//             pc_id: pc.pc_id,
//             pc_name: pc.pc_name,
//             theory_marks: pc.theory_marks,
//             practical_marks: pc.practical_marks,
//             viva_marks: pc.viva_marks
//           });
//         }
//       }
//     }
//   }


//   // Convert Maps → Arrays + sort
//   return Array.from(nosMap.values()).map(nos=>({

//     nos_id: nos.nos_id,
//     nos_name: nos.nos_name,

//     pcs: Array.from(nos.pcs.values())
//       .sort((a:any,b:any)=>{

//         const numA = parseInt(a.pc_id.replace(/^\D+/g, ''), 10);
//         const numB = parseInt(b.pc_id.replace(/^\D+/g, ''), 10);

//         return numA - numB;

//       })

//   }))
//   .sort((a:any,b:any)=> a.nos_id.localeCompare(b.nos_id))

//   return Array.from(nosMap.values());
// }

// Next Imports
import { NextResponse } from 'next/server'


// Data Imports
import { getServerSession } from 'next-auth';

import type { pc } from '@prisma/client';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function GET(
  req: Request,
  context: { params: { id: number } }
) {

  const session = await getServerSession(authOptions);
  const agencyId = Number(session?.user.agency_id);
  const id = Number(context.params.id);

  const batch = await prisma.batches.findFirst({
    where: {
      id: id,
      agency_id: agencyId
    },
    include: {
      qualification_pack: {
        include: {
          version: true,
          ssc: {
            select: {
              id: true,
              ssc_name: true,
              ssc_code: true,
              agency: {
                select: {
                  id: true,
                  company_name: true
                }
              }
            }
          }
        }
      },
      theory_exam_set: {
        include: {
          exam_sets_questions: {
            select: {
              questions: {
                select: {
                  id: true,
                  marks: true,

                  pc_questions: {
                    select: {
                      pc: {
                        select: {
                          id: true,
                          pc_id: true,
                          pc_name: true,
                          theory_marks: true,
                          practical_marks: true,
                          viva_marks: true,
                          nos: {
                            select: {
                              nos_id: true,
                              nos_name: true
                            }
                          }
                        }
                      }
                    },
                    orderBy: {
                      pc_id: 'asc'
                    }
                  }
                }
              }
            }
          },
        }
      },
      practical_exam_set: {
        include: {
          exam_sets_questions: {
            select: {
              questions: {
                select: {
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
            }
          },
        }
      },
      viva_exam_set: {
        include: {
          exam_sets_questions: {
            select: {
              questions: {
                select: {
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
            }
          },
        }
      },
      students: {
        select: {
          id: true,
          batch_id: true,
          user_name: true,
          candidate_id: true,
          candidate_name: true,

          // student_exam_set_results: true,

          exam_set_results: {
            select: {
              id: true,
              exam_set_id: true,
              student_id: true,
              question_id: true,
              student_answer: true,
              correct_answer: true,
              question: {
                select: {
                  id: true,
                  question_type: true,
                  answer: true,
                  marks: true,
                  pc_questions: {
                    select: {
                      pc: {
                        select: {
                          id: true,
                          pc_id: true,
                          pc_name: true,
                          theory_marks: true,
                          nos: {
                            select: {
                              nos_id: true,
                              nos_name: true
                            }
                          }
                        }
                      }
                    },
                    orderBy: {
                      pc_id: 'asc'
                    }
                  }
                }
              }
            }
          },

          student_question_attempts: {
            select: {
              id: true,
              student_id: true,
              question_id: true,
              max_marks: true,
              obtained_marks: true,
              question: {
                select: {
                  id: true,
                  question_type: true,
                  answer: true,
                  marks: true,
                  pc_questions: {
                    select: {
                      pc: {
                        select: {
                          id: true,
                          pc_id: true,
                          pc_name: true,
                          theory_marks: true,
                          nos: {
                            select: {
                              nos_id: true,
                              nos_name: true
                            }
                          }
                        }
                      }
                    },
                    orderBy: {
                      pc_id: 'asc'
                    }
                  }
                }
              }
            }
          }
        }
      },
      scheme: {
        select: {
          id: true,
          scheme_name: true,
          scheme_code: true
        }
      },
      sub_scheme: {
        select:{
          id: true,
          scheme_name: true,
          scheme_code: true
        }
      },
    }
  })



  // console.log(batch)

  if(batch){


    const customBatch: any = batch;

    // Combine NOS from all exam sets into one array

    const combinedNOS = groupAllExamSetPCsToNOS(
      batch.theory_exam_set,
      batch.practical_exam_set,
      batch.viva_exam_set
    );

    customBatch.nos = combinedNOS;

    return NextResponse.json(customBatch);
  }

  return NextResponse.json({message: "Batch not found!"}, {status: 404});

}


function groupAllExamSetPCsToNOS(...examSets: any[]) {
  const nosMap = new Map();

  for (const examSet of examSets) {
    for (const questionSet of examSet?.exam_sets_questions || []) {
      const pcs = questionSet?.questions?.pc_questions?.map((pcq: any) => pcq.pc) || [];

      for (const pc of pcs) {
        if (!pc?.nos) continue;

        const nosKey = pc.nos.nos_id;

        if (!nosMap.has(nosKey)) {
          nosMap.set(nosKey, {
            nos_id: pc.nos.nos_id,
            nos_name: pc.nos.nos_name,
            pcs: [],
          });
        }

        const nosEntry = nosMap.get(nosKey);

        // Deduplicate PC by pc_id
        const exists = nosEntry.pcs.some((existingPc: pc) => existingPc.pc_id === pc.pc_id);

        if (!exists) {
          nosEntry.pcs.push({
            id: pc.id,
            pc_id: pc.pc_id,
            pc_name: pc.pc_name,
            theory_marks: pc.theory_marks,
            practical_marks: pc.practical_marks,
            viva_marks: pc.viva_marks
          });
        }
      }
    }
  }


  // Convert Maps → Arrays + sort
  return Array.from(nosMap.values()).map(nos=>({

    nos_id: nos.nos_id,
    nos_name: nos.nos_name,

    pcs: Array.from(nos.pcs.values())
      .sort((a:any,b:any)=>{

        const numA = parseInt(a.pc_id.replace(/^\D+/g, ''), 10);
        const numB = parseInt(b.pc_id.replace(/^\D+/g, ''), 10);

        return numA - numB;

      })

  }))
  .sort((a:any,b:any)=> a.nos_id.localeCompare(b.nos_id))

  return Array.from(nosMap.values());
}


// // Next Imports
// import { NextResponse } from 'next/server'

// // Data Imports
// import { getServerSession } from 'next-auth';

// import type { pc } from '@prisma/client';

// import { authOptions } from '@/libs/auth';

// import prisma from '@/libs/prisma';

// export async function GET(
//   req: Request,
//   context: { params: { id: number } }
// ){

//   const session = await getServerSession(authOptions);

//   const agencyId = Number(session?.user.agency_id);

//   const id = Number(context.params.id);

//   const batch = await prisma.batches.findFirst({

//     where:{
//       id:id,
//       agency_id:agencyId
//     },

//     include:{

//       qualification_pack:{
//         include:{
//           version:true,
//           ssc:{
//             select:{
//               id:true,
//               ssc_name:true,
//               ssc_code:true,
//               agency:{
//                 select:{
//                   id:true,
//                   company_name:true
//                 }
//               }
//             }
//           }
//         }
//       },

//       theory_exam_set:{
//         include:{
//           exam_sets_questions:{
//             select:{
//               questions:{
//                 select:{
//                   id:true,
//                   marks:true,

//                   pc_questions:{
//                     include:{
//                       pc:{
//                         select:{
//                           id:true,
//                           pc_id:true,
//                           pc_name:true,
//                           theory_marks:true,
//                           practical_marks:true,
//                           viva_marks:true,
//                           nos:{
//                             select:{
//                               nos_id:true,
//                               nos_name:true
//                             }
//                           }
//                         }
//                       }
//                     }
//                   }

//                 }
//               }
//             }
//           }
//         }
//       },

//       practical_exam_set:{
//         include:{
//           exam_sets_questions:{
//             select:{
//               questions:{
//                 select:{
//                   pc_questions:{
//                     include:{
//                       pc:{
//                         include:{
//                           nos:true
//                         }
//                       }
//                     }
//                   }
//                 }
//               }
//             }
//           }
//         }
//       },

//       viva_exam_set:{
//         include:{
//           exam_sets_questions:{
//             select:{
//               questions:{
//                 select:{
//                   pc_questions:{
//                     include:{
//                       pc:{
//                         include:{
//                           nos:true
//                         }
//                       }
//                     }
//                   }
//                 }
//               }
//             }
//           }
//         }
//       },

//       students:{
//         select:{
//           id:true,
//           batch_id:true,
//           user_name:true,
//           candidate_id:true,
//           candidate_name:true,

//           exam_set_results:{
//             select:{
//               id:true,
//               exam_set_id:true,
//               student_id:true,
//               question_id:true,
//               student_answer:true,
//               correct_answer:true,

//               question:{
//                 select:{
//                   id:true,
//                   question_type:true,
//                   answer:true,
//                   marks:true,

//                   pc_questions:{
//                     include:{
//                       pc:{
//                         select:{
//                           id:true,
//                           pc_id:true,
//                           pc_name:true,
//                           theory_marks:true,
//                           nos:{
//                             select:{
//                               nos_id:true,
//                               nos_name:true
//                             }
//                           }
//                         }
//                       }
//                     }
//                   }

//                 }
//               }
//             }
//           },

//           student_question_attempts:{
//             select:{
//               id:true,
//               student_id:true,
//               question_id:true,
//               max_marks:true,
//               obtained_marks:true,

//               question:{
//                 select:{
//                   id:true,
//                   question_type:true,
//                   answer:true,
//                   marks:true,

//                   pc_questions:{
//                     include:{
//                       pc:{
//                         select:{
//                           id:true,
//                           pc_id:true,
//                           pc_name:true,
//                           theory_marks:true,
//                           nos:{
//                             select:{
//                               nos_id:true,
//                               nos_name:true
//                             }
//                           }
//                         }
//                       }
//                     }
//                   }

//                 }
//               }
//             }
//           }

//         }
//       },

//       scheme:{
//         select:{
//           id:true,
//           scheme_name:true,
//           scheme_code:true
//         }
//       },

//       sub_scheme:{
//         select:{
//           id:true,
//           scheme_name:true,
//           scheme_code:true
//         }
//       }

//     }

//   });

//   if(!batch){

//     return NextResponse.json(
//       {message:"Batch not found!"},
//       {status:404}
//     );

//   }

//   const customBatch:any=batch;

//   const combinedNOS=groupAllExamSetPCsToNOS(

//     batch.theory_exam_set,

//     batch.practical_exam_set,

//     batch.viva_exam_set

//   );

//   customBatch.nos=combinedNOS;

//   return NextResponse.json(customBatch);

// }


// function groupAllExamSetPCsToNOS(...examSets:any[]){

//   const nosMap=new Map();

//   for(const examSet of examSets){

//     for(const questionSet of examSet?.exam_sets_questions || []){

//       const pcs=questionSet?.questions?.pc || [];

//       for(const rel of pcs){

//         const pc=rel.pc;

//         if(!pc?.nos) continue;

//         const nosKey=pc.nos.nos_id;

//         if(!nosMap.has(nosKey)){

//           nosMap.set(nosKey,{

//             nos_id:pc.nos.nos_id,

//             nos_name:pc.nos.nos_name,

//             pcs:[]

//           });

//         }

//         const nosEntry=nosMap.get(nosKey);

//         const exists=nosEntry.pcs.some(
//           (existingPc:pc)=>existingPc.pc_id===pc.pc_id
//         );

//         if(!exists){

//           nosEntry.pcs.push({

//             id:pc.id,

//             pc_id:pc.pc_id,

//             pc_name:pc.pc_name,

//             theory_marks:pc.theory_marks,

//             practical_marks:pc.practical_marks,

//             viva_marks:pc.viva_marks

//           });

//         }

//       }

//     }

//   }

//   return Array.from(nosMap.values())

//   .map(nos=>({

//     nos_id:nos.nos_id,

//     nos_name:nos.nos_name,

//     pcs:nos.pcs.sort((a:any,b:any)=>{

//       const numA=parseInt(a.pc_id.replace(/^\D+/g,''),10);

//       const numB=parseInt(b.pc_id.replace(/^\D+/g,''),10);

//       return numA-numB;

//     })

//   }))

//   .sort((a:any,b:any)=>
//     a.nos_id.localeCompare(b.nos_id)
//   );

// }
