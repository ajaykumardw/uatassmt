// Next Imports
import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth';

import { hash } from 'bcrypt';

import { authOptions } from '@/libs/auth';

// Data Imports
import prisma from '@/libs/prisma';

export async function GET() {

  const session = await getServerSession(authOptions);
  const createdBy = Number(session?.user.id);

  const data = await prisma.users.findMany({
    where: {
      created_by: createdBy,
      user_type: 'U'
    },
    include: {
      role: true,
      user_additional_data: true
    },
    orderBy: {
      first_name: 'asc'
    }
  })

  return NextResponse.json(data)
}

export async function POST(req: Request) {

  const session = await getServerSession(authOptions);
  const createdBy = Number(session?.user.id);
  const agencyId = Number(session?.user.agency_id);

  const { username, password, firstName, lastName, email, role, state, city } = await req.json();

  console.log("data: ",username, password, firstName, lastName, email, role, state, city)

  const userExists = await prisma.users.findFirst({
    where: {
      OR: [
        { user_name: username.toString() },
        { email: email.toString() }
      ]
    }
  });

  if (userExists) {
    return NextResponse.json({ success: false, message: "User already exists with the same email or username." }, { status: 400 })
  }


  const hashPassword = await hash(password, 10)

  try {
    const result = await prisma.users.create({
      data: {
        user_name: username,
        password: hashPassword,
        first_name: firstName,
        last_name: lastName,
        email: email,
        role_id: Number(role),
        state_id: Number(state),
        city_id: Number(city),
        is_master: false,
        master_id: agencyId,
        created_by: createdBy
      }
    })

    if(result){

      return NextResponse.json({ success: true, message: "User created successfully." })
    } else {
      return NextResponse.json({ success: false, message: "User not created." }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: "Something went wrong. Please try again later." }, { status: 400 })
  }

}
