// Next Imports
import { NextResponse } from 'next/server'

// Data Imports
import prisma from '@/libs/prisma';

export async function GET(
  req: Request,
  context: { params: { id: number } }
) {

  const id = context.params.id;

  const data = await prisma.users.findUnique({
    where: {
      id: Number(id),
      user_type: 'AG'
    }
  })

  if(data){

    return NextResponse.json(data)
  }
  else{

    return NextResponse.json({message: 'agency not found'},{status: 404})
  }
}

export async function POST(
  req: Request,
  context: { params: { id: number } }
) {

  const id = context.params.id;
  const { email, companyName, contactPersonFirstName, contactPersonLastName, phoneNumber, landlineNumber, state, city, pincode, address } = await req.json()


  const agencyExist = await prisma.users.findUnique({
    where: {
      id: Number(id),
      user_type: 'AG'
    }
  })

  if(agencyExist){

    const result = await prisma.users.update({
      where: {
        id: Number(id),
        user_type: 'AG'
      },
      data: {
        email: email,
        company_name: companyName,
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
      }
    })

    if( result ){
      return NextResponse.json({message: 'Agency updated successfully!'})
    }

    return NextResponse.json({message: 'Agency not updated'}, {status: 500})
  }
  else{
    return NextResponse.json({message: 'Agency not found'}, {status: 404})
  }
}
