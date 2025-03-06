// Next Imports
import { NextResponse } from 'next/server'

// Data Imports
import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function GET(
  req: Request,
  context: { params: { id: number } }
) {

  const session = await getServerSession(authOptions);
  const agency_id = Number(session?.user?.agency_id)
  const id = Number(context.params.id);

  const user = await prisma.users.findFirst({
    where: {
      id: id,
      created_by: agency_id
    },
    include: {
      user_additional_data: true,
      role: true
    }
  })

  return NextResponse.json(user);
}

export async function POST(
  req: Request,
  context: { params: { id: number } }
) {

  // const session = await getServerSession(authOptions);

  // const createdBy = Number(session?.user.id);
  // const agencyId = Number(session?.user.agency_id);

  const id = Number(context.params.id);

  const { firstName, lastName, state, city } = await req.json();

  const user = await prisma.users.findUnique({
    where: {
      id: id
    }
  })

  if(!user){
    return NextResponse.json({ success: false, message: "User not Found." }, { status: 404})
  }

  try {
    const result = await prisma.users.update({
      where: {
        id: id
      },
      data: {
        first_name: firstName,
        last_name: lastName,
        state_id: Number(state),
        city_id: Number(city)
      }
    })

    if(result){
      return NextResponse.json({ success: true, message: "User updated successfully." })
    } else {
      return NextResponse.json({ success: false, message: "User not updated." }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: "Something went wrong. Please try again later." }, { status: 400 })
  }
}
