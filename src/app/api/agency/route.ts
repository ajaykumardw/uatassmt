// Next Imports
import { NextResponse } from 'next/server'

import {hash} from 'bcrypt'

// Data Imports
import { getServerSession } from 'next-auth';

import prisma from '@/libs/prisma';

import { authOptions } from '@/libs/auth';


export async function GET() {

  const userType = 'AG';

  const data = await prisma.users.findMany({
    where: {
      user_type: userType
    },
    include: {
      state: true,
      city: true
    }
  })

  return NextResponse.json(data)
}

export async function POST(req: Request) {

  const { email, password, companyName, contactPersonFirstName, contactPersonLastName, phoneNumber, landlineNumber, state, city, pincode, address } = await req.json()
  const hashPassword = await hash(password, 10)
  const userType = 'AG'
  const session = await getServerSession(authOptions)
  const createdBy = Number(session?.user.id)

  const result = await prisma.users.create({
    data: {
      email: email,
      password: hashPassword,
      company_name: companyName,
      user_type: userType,
      first_name: contactPersonFirstName,
      last_name: contactPersonLastName,
      mobile_no: phoneNumber,
      landline_no: landlineNumber,
      is_master: true,
      master_id: 0,
      state_id: Number(state),
      city_id: Number(city),
      pin_code: pincode,
      address: address,
      created_by: createdBy
    }
  })

  if(result){

    return NextResponse.json({ data: {'email': email, 'password': password}})
  }

  return NextResponse.json({data: 'not created'})
}
