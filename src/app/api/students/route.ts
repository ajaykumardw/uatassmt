// Next Imports
import { NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { hash } from 'bcrypt';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';
import { decrypt, encrypt, maskAadhaar } from '@/utils/encryption';
import { isValidAadhaar } from '@/libs/aadhaar';

export async function GET(req: Request) {

  const url = new URL(await req.url);
  const searchBy = url.searchParams.get('searchBy');
  const searchValue = url.searchParams.get('searchValue');
  const batchId = url.searchParams.get('batchId') ? Number(url.searchParams.get('batchId')) : null;

  const session = await getServerSession(authOptions);
  const agencyId = Number(session?.user?.agency_id);

  const whereCondition = {
    agency_id: agencyId,
    ...(batchId ? { batch_id: batchId } : {}),
    ...(searchBy === 'candidate_id' ? { candidate_id: searchValue?.toString() } : (searchBy === 'phone_number' ? { mobile_no: searchValue?.toString()} : {})),
  };

  const students = await prisma.students.findMany({
    where: whereCondition
  })

  const studentsWithFormattedAadhaar = students.map(student =>  {
    return {
      ...student,
      aadhaar_no: student.aadhaar_no ? maskAadhaar(decrypt(student.aadhaar_no)) : null
    };
  });

  return NextResponse.json(studentsWithFormattedAadhaar);
}

export async function POST(req: Request) {

  const data = await req.json();

  const session = await getServerSession(authOptions);
  const createdBy = Number(session?.user.id);
  const agencyId = Number(session?.user?.agency_id);

  const mappedData = await Promise.all(data.map(async (item: any) => ({
    batch_id: Number(item.batchId),
    candidate_id: item.CandidateId.toString().trim(),
    user_name: item.CandidateId.toString().trim(),
    password: await hash(item.Password.toString().trim(), 8),
    candidate_name: item.CandidateName.toString().trim(),
    gender: item.Gender && item.Gender.toLowerCase(),
    category: item.Category.trim(),
    date_of_birth: item.DOB && new Date(item.DOB.split('.').reverse().join('-')),
    father_name: item.FatherName.toString().trim(),
    mother_name: item.MotherName.toString().trim(),
    address: item.Address.toString().trim(),
    city: item.City.toString().trim(),
    state: item.State.toString().trim(),
    mobile_no: item.MobileNo && item.MobileNo.toString().trim(),
    agency_id: agencyId,
    created_by: createdBy,
    aadhaar_no: item.AadhaarNo && isValidAadhaar(item.AadhaarNo.toString().trim()) ? encrypt(item.AadhaarNo.toString().trim()) : null
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
