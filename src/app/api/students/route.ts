// Next Imports
import { NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function GET() {

  // const session = await getServerSession(authOptions);
  // const agencyId = Number(session?.user?.agency_id);

  // const batches = await prisma.batches.findMany({
  //   where: {
  //     agency_id: agencyId
  //   },
  //   select: {
  //     id: true,
  //     batch_name: true,
  //     batch_size: true,
  //     assessment_start_datetime: true,
  //     assessment_end_datetime: true,
  //     qualification_pack: {
  //       select: {
  //         qualification_pack_id: true,
  //         qualification_pack_name: true,
  //         ssc: {
  //           select: {
  //             ssc_code: true
  //           }
  //         }
  //       }
  //     },
  //     training_partner: {
  //       select: {
  //         first_name: true,
  //         last_name: true
  //       }
  //     },
  //     training_center: {
  //       select: {
  //         user_name: true
  //       }
  //     },
  //     scheme: {
  //       select: {
  //         id: true,
  //         scheme_name: true,
  //         scheme_code: true
  //       }
  //     },
  //     sub_scheme: {
  //       select:{
  //         id: true,
  //         scheme_name: true,
  //         scheme_code: true
  //       }
  //     }
  //   },
  //   orderBy: {
  //     assessment_start_datetime: "desc"
  //   }
  // });

  // // console.log(batches)

  // return NextResponse.json(batches);
}

export async function POST(req: Request) {

  const data = await req.json();

  const session = await getServerSession(authOptions);
  const createdBy = Number(session?.user.id);
  const agencyId = Number(session?.user?.agency_id);

  const mappedData = data.map((item: any) => ({
    batch_name: item.BatchName.toString(),
    enrollment_no: item.EnrollmentNo,
    trainee_name: item.NameOfTheTrainee,
    gender: item.Gender.toLowerCase(),
    category: item.Category,
    date_of_birth: new Date(item.DOB.split('.').reverse().join('-')),
    father_name: item.FatherName,
    mother_name: item.MotherName,
    address: item.AddressOfTheTrainee,
    city: item.City,
    state: item.State,
    mobile_no: item.MobileNo.toString(),
    agency_id: agencyId,
    created_by: createdBy
  }));
  console.log("data", data);
  console.log("mapped data", mappedData);

  const result = await prisma.students.createMany({
    data: mappedData
  })

  if(result){
    return NextResponse.json({message: 'Students uploaded successfully!'})
  }else{
    return NextResponse.json({message: 'Students not uploaded!'}, {status: 500})
  }


}
