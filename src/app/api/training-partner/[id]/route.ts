// Next Imports
import { NextResponse } from 'next/server'


// Data Imports
import { getServerSession } from 'next-auth';

import prisma from '@/libs/prisma';

import { authOptions } from '@/libs/auth';


export async function POST(req: Request, context: { params: { id: number } }) {

  const { username, email, firstName, lastName, phoneNumber, state, city, pinCode, address, panCardNumber, gstNumber } = await req.json()

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
        user_name: username.toString(),
        email: email as string,
        first_name: firstName.toString(),
        last_name: lastName.toString(),
        mobile_no: phoneNumber.toString(),
        state_id: Number(state),
        city_id: Number(city),
        pin_code: pinCode.toString(),
        address: address.toString(),
      }
    })

    if(result){

      await prisma.users_additional_data.update({
        where: {
          user_id: id
        },
        data: {
          gst_no: gstNumber,
          pan_card_no: panCardNumber
        }
      })

      return NextResponse.json({ success: true, message: "User updated successfully." })
    }

    return NextResponse.json({ success: false, message: "User not updated." })
  }else {
    return NextResponse.json({ success: false, message: "User not found." }, {status: 404})
  }
}
