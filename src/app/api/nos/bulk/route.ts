// Next Imports
import { NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function POST(req: Request) {

  const { uploadData, sscID, qpID } = await req.json();

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
        nos: {
          connect: {
            nos_id: item.NOS_ID
          }
        },
        created_by: createdBy
      }
    });
  }));

  const createNOSandPCResult = await Promise.all(falseArray.map(async (item: any) => {
    
    return await prisma.nos.create({
      data: {
        agency_id: agencyId,
        qualification_packs: {
          connect: {
            qualification_pack_id: item.QP_ID
          }
        },
        ssc_id: Number(sscID),
        nos_id: item.NOS_ID,
        nos_name: item.NOS_Name,
        pc: {
          connectOrCreate: {
            where: {
              pc_id: item.PC_ID
            },
            create: {
              agency_id: agencyId,
              pc_id: item.PC_ID,
              pc_name: item.PC_Name,
              created_by: createdBy
            }
          }
        },
        created_by: createdBy
      }
    })
  }))

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
