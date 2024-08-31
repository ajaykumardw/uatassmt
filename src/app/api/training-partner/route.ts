// Next Imports
import { NextResponse } from 'next/server'

import {hash} from 'bcrypt'

// Data Imports
import { getServerSession } from 'next-auth';

import prisma from '@/libs/prisma';

import { authOptions } from '@/libs/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  const agency_id = Number(session?.user?.agency_id);

  const trainingPartners = await prisma.users.findMany({
    where: {
      master_id: agency_id,
      user_type: 'U',
      role_id: 2
    },
    orderBy:{
      company_name: "asc"
    }
  });

  return NextResponse.json(trainingPartners);
}


export async function POST(req: Request) {

  // return NextResponse.json({success: false, message: "User not created"}, {status: 500})

  const { username, email, password, firstName, lastName, phoneNumber, state, city, pinCode, address, panCardNumber, gstNumber } = await req.json()
  const hashPassword = await hash(password, 10)
  const userType = 'U'
  const session = await getServerSession(authOptions)
  const agency_id = Number(session?.user?.agency_id)
  const createdBy = Number(session?.user.id)

  const result = await prisma.users.create({
    data: {
      user_name: username.toString(),
      email: email as string,
      password: hashPassword,
      user_type: userType,
      first_name: firstName.toString(),
      last_name: lastName.toString(),
      mobile_no: phoneNumber.toString(),
      is_master: false,
      master_id: agency_id,
      role_id: 2,
      state_id: Number(state),
      city_id: Number(city),
      pin_code: pinCode.toString(),
      address: address.toString(),
      created_by: createdBy
    }
  })

  if(result){

    await prisma.users_additional_data.create({
      data: {
        user_id: result.id,
        gst_no: gstNumber,
        pan_card_no: panCardNumber
      }
    })

    return NextResponse.json({ success: true, message: "User created successfully." })
  }

  return NextResponse.json({ success: false, message: "User not created." })
}
