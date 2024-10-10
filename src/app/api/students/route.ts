// Next Imports
import { NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { hash } from 'bcrypt';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function GET(req: Request) {

  const url = new URL(await req.url);
  const searchBy = url.searchParams.get('searchBy');
  const searchValue = url.searchParams.get('searchValue');

  const session = await getServerSession(authOptions);
  const agencyId = Number(session?.user?.agency_id);

  const whereCondition = {
    agency_id: agencyId,
    ...(searchBy === 'candidate_id' ? { candidate_id: searchValue?.toString() } : (searchBy === 'phone_number' ? { mobile_no: searchValue?.toString()} : {})),
  };

  const students = await prisma.students.findMany({
    where: whereCondition
  })

  return NextResponse.json(students);
}

export async function POST(req: Request) {

  const data = await req.json();

  const session = await getServerSession(authOptions);
  const createdBy = Number(session?.user.id);
  const agencyId = Number(session?.user?.agency_id);

  const mappedData = await Promise.all(data.map(async (item: any) => ({
    batch_id: Number(item.batchId),
    candidate_id: item.CandidateId.toString(),
    user_name: item.CandidateId.toString(),
    password: await hash(item.Password.toString(), 8),
    candidate_name: item.CandidateName.toString(),
    gender: item.Gender.toLowerCase(),
    category: item.Category,
    date_of_birth: new Date(item.DOB.split('.').reverse().join('-')),
    father_name: item.FatherName,
    mother_name: item.MotherName,
    address: item.Address,
    city: item.City,
    state: item.State,
    mobile_no: item.MobileNo.toString(),
    agency_id: agencyId,
    created_by: createdBy
  })));

  const result = await prisma.students.createMany({
    data: mappedData
  })

  if(result){
    return NextResponse.json({message: 'Students uploaded successfully!'})
  }else{
    return NextResponse.json({message: 'Students not uploaded!'}, {status: 500})
  }


}
