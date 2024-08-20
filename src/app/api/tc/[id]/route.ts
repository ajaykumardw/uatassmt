// Next Imports
import { NextResponse } from 'next/server'


// Data Imports
import { getServerSession } from 'next-auth';

import prisma from '@/libs/prisma';

import { authOptions } from '@/libs/auth';

export async function GET(
  req: Request,
  context: { params: { id: number } }
) {

  const session = await getServerSession(authOptions);
  const createdBy = Number(session?.user.id)
  const id = Number(context.params.id);

  const trainingPartner = await prisma.users.findFirst({
    where: {
      id: id,
      created_by: createdBy
    }
  })

  return NextResponse.json(trainingPartner);
}

export async function POST(req: Request, context: { params: { id: number } }) {

  const { tcId, tcName, email, status, firstName, lastName, phoneNumber, state, city, address, pinCode } = await req.json()

  const session = await getServerSession(authOptions)
  const agency_id = Number(session?.user?.agency_id)

  const id = Number(context.params.id);

  const userExist = await prisma.users.findUnique({
    where: {
      id: id,
      master_id: agency_id
    }
  })

  if(userExist){

    const result = await prisma.users.update({
      where: {
        id: id
      },
      data: {
        user_name: tcId,
        company_name: tcName,
        email: email as string,
        first_name: firstName.toString(),
        last_name: lastName.toString(),
        mobile_no: phoneNumber.toString(),
        state_id: Number(state),
        city_id: Number(city),
        pin_code: pinCode.toString(),
        address: address.toString(),
        status: Number(status)
      }
    })

    if(result){

      return NextResponse.json({ success: true, message: "Training Center updated successfully." })
    }

    return NextResponse.json({ success: false, message: "Training Center not updated." })
  }else {
    return NextResponse.json({ success: false, message: "Training Center not found." }, {status: 404})
  }
}
