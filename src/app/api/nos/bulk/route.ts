// Next Imports
import { NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function POST(req: Request) {

  const { uploadData, sscID } = await req.json();

  const session = await getServerSession(authOptions);
  const createdBy = Number(session?.user.id);
  const agencyId = Number(session?.user?.agency_id);
  const trueArray = uploadData.filter((item: any) => item.nosIDExist);
  const falseArray = uploadData.filter((item: any) => !item.nosIDExist);

  const connectNOSandPCResult = await Promise.all(trueArray.map(async (item: any) => {
    return await prisma.pc.create({
      data: {
        agency_id: agencyId,
        pc_id: item.PC_ID,
        pc_name: item.PC_Name,
        theory_marks: item.Theory_Marks,
        practical_marks: item.Practical_Marks,
        viva_marks: item.Viva_Marks,
        project_marks: item.Project_Marks,
        total_marks: (item.Theory_Marks + item.Practical_Marks + item.Viva_Marks + item.Project_Marks),
        nos: {
          connect: {
            nos_id: item.NOS_ID
          }
        },
        created_by: createdBy
      }
    });
  }));

  // const createNOSandPCResult = await Promise.all(falseArray.map(async (item: any) => {

  //   const nosId = await prisma.nos.findFirst({
  //     where: {
  //       nos_id: item.NOS_ID,
  //     },
  //     select: {
  //       id: true
  //     }
  //   })

  //   return await prisma.nos.create({
  //     data: {
  //       agency_id: agencyId,
  //       qualification_packs: {
  //         connect: {
  //           qualification_pack_id: item.QP_ID
  //         }
  //       },
  //       ssc_id: Number(sscID),
  //       nos_id: item.NOS_ID,
  //       nos_name: item.NOS_Name,
  //       pc: {
  //         connectOrCreate: {
  //           where: {
  //             pc_id_nos_id: {
  //               pc_id: item.PC_ID,
  //               nos_id: nosId ? nosId.id : item.NOS_ID
  //             }
  //           },
  //           create: {
  //             agency_id: agencyId,
  //             pc_id: item.PC_ID,
  //             pc_name: item.PC_Name,
  //             theory_marks: Number(item.Theory_Marks),
  //             practical_marks: Number(item.Practical_Marks),
  //             viva_marks: Number(item.Viva_Marks),
  //             total_marks: (Number(item.Theory_Marks) + Number(item.Practical_Marks) + Number(item.Viva_Marks)),
  //             created_by: createdBy
  //           }
  //         }
  //       },
  //       created_by: createdBy
  //     }
  //   })
  // }))

  // For items where NOS doesn't exist, create NOS and related PC
  // const createNOSandPCResult = await Promise.all(
  //   falseArray.map(async (item: any) => {

  //     // const existingNOS = await prisma.nos.findUnique({
  //     //   where: {
  //     //     nos_id: item.NOS_ID
  //     //   },
  //     //   select: {
  //     //     id: true
  //     //   }
  //     // });

  //     // const existingNOS = await prisma.nos.findFirst({
  //     //   where: {
  //     //     nos_id: item.NOS_ID
  //     //   },
  //     //   select: {
  //     //     id: true
  //     //   }
  //     // });

  //     // if (existingNOS) {
  //     //   // NOS already exists unexpectedly, so just create PC
  //     //   return await prisma.pc.create({
  //     //     data: {
  //     //       agency_id: agencyId,
  //     //       pc_id: item.PC_ID,
  //     //       pc_name: item.PC_Name,
  //     //       theory_marks: Number(item.Theory_Marks),
  //     //       practical_marks: Number(item.Practical_Marks),
  //     //       viva_marks: Number(item.Viva_Marks),
  //     //       total_marks:
  //     //         Number(item.Theory_Marks) +
  //     //         Number(item.Practical_Marks) +
  //     //         Number(item.Viva_Marks),
  //     //       nos: {
  //     //         connect: {
  //     //           id: existingNOS.id,
  //     //           // nos_id: item.NOS_ID
  //     //         }
  //     //       },
  //     //       created_by: createdBy
  //     //     }
  //     //   });
  //     // } else {
  //     //   // Create NOS and nested PC
  //     //   return await prisma.nos.create({
  //     //     data: {
  //     //       agency_id: agencyId,
  //     //       ssc_id: Number(sscID),
  //     //       nos_id: item.NOS_ID,
  //     //       nos_name: item.NOS_Name,
  //     //       qualification_packs: {
  //     //         connect: {
  //     //           qualification_pack_id: item.QP_ID
  //     //         }
  //     //       },
  //     //       pc: {
  //     //         create: {
  //     //           agency_id: agencyId,
  //     //           pc_id: item.PC_ID,
  //     //           pc_name: item.PC_Name,
  //     //           theory_marks: Number(item.Theory_Marks),
  //     //           practical_marks: Number(item.Practical_Marks),
  //     //           viva_marks: Number(item.Viva_Marks),
  //     //           total_marks:
  //     //             Number(item.Theory_Marks) +
  //     //             Number(item.Practical_Marks) +
  //     //             Number(item.Viva_Marks),
  //     //           created_by: createdBy
  //     //         }
  //     //       },
  //     //       created_by: createdBy
  //     //     }
  //     //   });
  //     // }

  //     // await prisma.nos.upsert({
  //     //   where: { nos_id: item.NOS_ID },
  //     //   update: {}, // No update if it already exists
  //     //   create: {
  //     //     agency_id: agencyId,
  //     //     ssc_id: Number(sscID),
  //     //     nos_id: item.NOS_ID,
  //     //     nos_name: item.NOS_Name,
  //     //     qualification_packs: {
  //     //       connect: {
  //     //         qualification_pack_id: item.QP_ID
  //     //       }
  //     //     },
  //     //     pc: {
  //     //       create: {
  //     //         agency_id: agencyId,
  //     //         pc_id: item.PC_ID,
  //     //         pc_name: item.PC_Name,
  //     //         theory_marks: Number(item.Theory_Marks),
  //     //         practical_marks: Number(item.Practical_Marks),
  //     //         viva_marks: Number(item.Viva_Marks),
  //     //         total_marks:
  //     //           Number(item.Theory_Marks) +
  //     //           Number(item.Practical_Marks) +
  //     //           Number(item.Viva_Marks),
  //     //         created_by: createdBy
  //     //       }
  //     //     },
  //     //     created_by: createdBy
  //     //   }
  //     // });

  //   const normalizedNOS_ID = item.NOS_ID.trim();

  //   const existingNOS = await prisma.nos.findUnique({
  //     where: { nos_id: normalizedNOS_ID },
  //     select: { id: true }
  //   });

  //   console.log("existing nos:", existingNOS);

  //   if (existingNOS) {
  //     // NOS exists → create PC only
  //     return await prisma.pc.create({
  //       data: {
  //         agency_id: agencyId,
  //         pc_id: item.PC_ID,
  //         pc_name: item.PC_Name,
  //         theory_marks: Number(item.Theory_Marks),
  //         practical_marks: Number(item.Practical_Marks),
  //         viva_marks: Number(item.Viva_Marks),
  //         total_marks:
  //           Number(item.Theory_Marks) +
  //           Number(item.Practical_Marks) +
  //           Number(item.Viva_Marks),
  //         nos: {
  //           connect: { id: existingNOS.id }
  //         },
  //         created_by: createdBy
  //       }
  //     });
  //   } else {
  //     // NOS does not exist → create NOS and nested PC
  //     return await prisma.nos.create({
  //       data: {
  //         agency_id: agencyId,
  //         ssc_id: Number(sscID),
  //         nos_id: normalizedNOS_ID,
  //         nos_name: item.NOS_Name,
  //         qualification_packs: {
  //           connect: {
  //             qualification_pack_id: item.QP_ID
  //           }
  //         },
  //         pc: {
  //           create: {
  //             agency_id: agencyId,
  //             pc_id: item.PC_ID,
  //             pc_name: item.PC_Name,
  //             theory_marks: Number(item.Theory_Marks),
  //             practical_marks: Number(item.Practical_Marks),
  //             viva_marks: Number(item.Viva_Marks),
  //             total_marks:
  //               Number(item.Theory_Marks) +
  //               Number(item.Practical_Marks) +
  //               Number(item.Viva_Marks),
  //             created_by: createdBy
  //           }
  //         },
  //         created_by: createdBy
  //       }
  //     });
  //   }

  //   })
  // );

  const createNOSandPCResult = [];

  for (const item of falseArray) {
    const normalizedNOS_ID = item.NOS_ID.trim();

    // Check if NOS already exists by its unique `nos_id`
    const existingNOS = await prisma.nos.findUnique({
      where: { nos_id: normalizedNOS_ID },
      select: { id: true }
    });

    if (existingNOS) {
      // ✅ NOS exists → just create the PC and connect to NOS
      const createdPC = await prisma.pc.create({
        data: {
          agency_id: agencyId,
          pc_id: item.PC_ID,
          pc_name: item.PC_Name,
          theory_marks: Number(item.Theory_Marks),
          practical_marks: Number(item.Practical_Marks),
          viva_marks: Number(item.Viva_Marks),
          project_marks: Number(item.Project_Marks),
          total_marks:
            Number(item.Theory_Marks) +
            Number(item.Practical_Marks) +
            Number(item.Viva_Marks) +
            Number(item.Project_Marks),
          nos: {
            connect: { id: existingNOS.id }
          },
          created_by: createdBy
        }
      });

      createNOSandPCResult.push(createdPC);

    } else {
      // ❌ NOS doesn't exist → create both NOS and nested PC
      const createdNOSWithPC = await prisma.nos.create({
        data: {
          agency_id: agencyId,
          ssc_id: Number(sscID),
          nos_id: normalizedNOS_ID,
          nos_name: item.NOS_Name,
          qualification_packs: {
            connect: {
              qualification_pack_id: item.QP_ID
            }
          },
          pc: {
            create: {
              agency_id: agencyId,
              pc_id: item.PC_ID,
              pc_name: item.PC_Name,
              theory_marks: Number(item.Theory_Marks),
              practical_marks: Number(item.Practical_Marks),
              viva_marks: Number(item.Viva_Marks),
              project_marks: Number(item.Project_Marks),
              total_marks:
                Number(item.Theory_Marks) +
                Number(item.Practical_Marks) +
                Number(item.Viva_Marks) +
                Number(item.Project_Marks),
              created_by: createdBy
            }
          },
          created_by: createdBy
        }
      });

      createNOSandPCResult.push(createdNOSWithPC);
    }
  }

  // console.log("nos pc from api:", uploadData)
  // console.log("result from api:", result)
  // console.log("already exit nosID from api:", trueArray)
  // console.log("new nosID from api:", falseArray)

  // console.log("result from api:", connectNOSandPCResult, createNOSandPCResult);

  // const result = await prisma.questions.createMany({
  //   data: mappedData
  // })

  if (connectNOSandPCResult && createNOSandPCResult) {
    return NextResponse.json({ message: 'NOS & PC uploaded successfully!' })
  } else {
    return NextResponse.json({ message: 'NOS & PC not uploaded!' }, { status: 500 })
  }

}


// export async function POST(req: Request) {
//   const { uploadData, sscID } = await req.json();

//   const session = await getServerSession(authOptions);
//   const createdBy = Number(session?.user.id);
//   const agencyId = Number(session?.user?.agency_id);

//   const trueArray = uploadData.filter((item: any) => item.nosIDExist);
//   const falseArray = uploadData.filter((item: any) => !item.nosIDExist);

//   const connectNOSandPCResult: any[] = [];
//   const createNOSandPCResult: any[] = [];

//   // Handle PCs for existing NOS
//   for (const item of trueArray) {
//     const existingNOS = await prisma.nos.findUnique({
//       where: {
//         nos_id: item.NOS_ID
//       },
//       select: {
//         id: true
//       }
//     });

//     if (!existingNOS) {
//       console.warn(`NOS with ID ${item.NOS_ID} not found, skipping.`);
//       continue;
//     }

//     const existingPC = await prisma.pc.findFirst({
//       where: {
//         pc_id: item.PC_ID,
//         nos_id: existingNOS.id
//       }
//     });

//     if (!existingPC) {
//       const createdPC = await prisma.pc.create({
//         data: {
//           agency_id: agencyId,
//           pc_id: item.PC_ID,
//           pc_name: item.PC_Name,
//           theory_marks: Number(item.Theory_Marks),
//           practical_marks: Number(item.Practical_Marks),
//           viva_marks: Number(item.Viva_Marks),
//           total_marks:
//             Number(item.Theory_Marks) +
//             Number(item.Practical_Marks) +
//             Number(item.Viva_Marks),
//           nos: {
//             connect: {
//               id: existingNOS.id
//             }
//           },
//           created_by: createdBy
//         }
//       });

//       connectNOSandPCResult.push(createdPC);
//     } else {
//       console.log(`PC already exists for NOS_ID: ${item.NOS_ID} and PC_ID: ${item.PC_ID}, skipping.`);
//     }
//   }

//   // Handle new NOS and related PC
//   for (const item of falseArray) {
//     const existingNOS = await prisma.nos.findUnique({
//       where: {
//         nos_id: item.NOS_ID
//       },
//       select: {
//         id: true
//       }
//     });

//     if (existingNOS) {
//       const existingPC = await prisma.pc.findFirst({
//         where: {
//           pc_id: item.PC_ID,
//           nos_id: existingNOS.id
//         }
//       });

//       if (!existingPC) {
//         const createdPC = await prisma.pc.create({
//           data: {
//             agency_id: agencyId,
//             pc_id: item.PC_ID,
//             pc_name: item.PC_Name,
//             theory_marks: Number(item.Theory_Marks),
//             practical_marks: Number(item.Practical_Marks),
//             viva_marks: Number(item.Viva_Marks),
//             total_marks:
//               Number(item.Theory_Marks) +
//               Number(item.Practical_Marks) +
//               Number(item.Viva_Marks),
//             nos: {
//               connect: {
//                 id: existingNOS.id
//               }
//             },
//             created_by: createdBy
//           }
//         });

//         createNOSandPCResult.push(createdPC);
//       } else {
//         console.log(`Duplicate PC for existing NOS found (NOS_ID: ${item.NOS_ID}, PC_ID: ${item.PC_ID}), skipping.`);
//       }
//     } else {
//       const createdNOS = await prisma.nos.create({
//         data: {
//           agency_id: agencyId,
//           ssc_id: Number(sscID),
//           nos_id: item.NOS_ID,
//           nos_name: item.NOS_Name,
//           qualification_packs: {
//             connect: {
//               qualification_pack_id: item.QP_ID
//             }
//           },
//           pc: {
//             create: {
//               agency_id: agencyId,
//               pc_id: item.PC_ID,
//               pc_name: item.PC_Name,
//               theory_marks: Number(item.Theory_Marks),
//               practical_marks: Number(item.Practical_Marks),
//               viva_marks: Number(item.Viva_Marks),
//               total_marks:
//                 Number(item.Theory_Marks) +
//                 Number(item.Practical_Marks) +
//                 Number(item.Viva_Marks),
//               created_by: createdBy
//             }
//           },
//           created_by: createdBy
//         }
//       });

//       createNOSandPCResult.push(createdNOS);
//     }
//   }

//   if (connectNOSandPCResult.length || createNOSandPCResult.length) {
//     return NextResponse.json({ message: 'NOS & PC uploaded successfully!' });
//   } else {
//     return NextResponse.json({ message: 'NOS & PC not uploaded!' }, { status: 500 });
//   }
// }
