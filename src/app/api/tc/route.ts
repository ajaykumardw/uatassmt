// Next Imports
import { NextResponse } from 'next/server'

// import {hash} from 'bcrypt'

// Data Imports
import { getServerSession } from 'next-auth';

import prisma from '@/libs/prisma';

import { authOptions } from '@/libs/auth';

export async function GET(req: Request) {

  const url = new URL(await req.url);
  const id = url.searchParams.get('tpId');
  const session = await getServerSession(authOptions);
  // const isMaster = session?.user.is_master;
  const createdBy = Number(id) || Number(session?.user.id);

  // const whereCondition = isMaster ? {master_id: createdBy, user_type: 'TC'} : {created_by: createdBy, user_type: 'TC'};

  const trainingCenters = await prisma.users.findMany({
    where: {
      created_by: createdBy,
      user_type: "TC"
    },
    orderBy:{
      company_name: "asc"
    }
  });

  return NextResponse.json(trainingCenters);
}



export async function POST(req: Request) {

  // return NextResponse.json({success: false, message: "User not created"}, {status: 500})

  const { tcId, tcName, email, status, firstName, lastName, phoneNumber, state, city, address, pinCode } = await req.json()

  // const hashPassword = await hash(password, 10)
  const userType = 'TC'
  const session = await getServerSession(authOptions)
  const agency_id = Number(session?.user?.agency_id)
  const createdBy = Number(session?.user.id)

  const result = await prisma.users.create({
    data: {
      user_name: tcId.toString(),
      company_name: tcName,
      email: email as string,
      user_type: userType,
      first_name: firstName,
      last_name: lastName,
      mobile_no: phoneNumber,
      is_master: false,
      master_id: agency_id,
      state_id: Number(state),
      city_id: Number(city),
      pin_code: pinCode.toString(),
      address: address.toString(),
      status: Number(status),
      created_by: createdBy
    }
  })

  if(result){

    // await prisma.users_additional_data.create({
    //   data: {
    //     user_id: result.id,
    //     gst_no: gstNumber,
    //     pan_card_no: panCardNumber
    //   }
    // })

    return NextResponse.json({ success: true, message: "Training Center created successfully." })
  }

  return NextResponse.json({ success: false, message: "Training Center not created." })
}
