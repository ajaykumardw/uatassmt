// Next Imports
import { NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

// export async function GET() {


export async function GET(
  req: Request,
  context: { params: { id: number } }
) {

  // const session = await getServerSession(authOptions);
  // const agencyId = Number(session?.user?.agency_id);

  const id = Number(context.params.id);

  const students = await prisma.students.findUnique({
    omit:{
      password: true
    },
    where: {
      id: id
    }
  })

  // console.log(qualificationPacks);

  return NextResponse.json(students);
}


export async function POST(
  req: Request,
  context: { params: { id: number } }
) {

  const data = await req.json();

  const session = await getServerSession(authOptions);
  const agencyId = Number(session?.user?.agency_id);
  const id = Number(context.params.id);

  const studentExist = await prisma.students.findUnique({
    where:{
      id: id,
      agency_id: agencyId
    },
    select: {
      id: true,
      candidate_name: true
    }

  })

  if(studentExist){
    const result = await prisma.students.update({
      where: {
        id: id
      },
      data: {
        candidate_name: data.candidateName,
        mobile_no: data.mobileNo.toString(),
        date_of_birth: data.dob,
        gender: data.gender,
        category: data.category,
        father_name: data.fatherName,
        mother_name: data.motherName,
        state: data.state,
        city: data.city,
        address: data.address
      }
    })

    if(result){
      return NextResponse.json({message: 'Students updated successfully!'})
    }else{
      return NextResponse.json({message: 'Students not updated!'}, {status: 500})
    }
  }else{
    return NextResponse.json({message: 'Students not found!'}, {status: 404})
  }

  // const mappedData = await Promise.all(data.map(async (item: any) => ({
  //   batch_id: Number(item.batchId),
  //   candidate_id: item.CandidateId.toString(),
  //   user_name: item.CandidateId.toString(),
  //   candidate_name: item.CandidateName.toString(),
  //   gender: item.Gender.toLowerCase(),
  //   category: item.Category,
  //   date_of_birth: new Date(item.DOB.split('.').reverse().join('-')),
  //   father_name: item.FatherName,
  //   mother_name: item.MotherName,
  //   address: item.Address,
  //   city: item.City,
  //   state: item.State,
  //   mobile_no: item.MobileNo.toString(),
  //   agency_id: agencyId,
  //   created_by: createdBy
  // })));

  // console.log("data", data);

  // const datas = mappedData;
  // console.log("mapped data", datas);






}
