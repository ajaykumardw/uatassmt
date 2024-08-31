// Next Imports
import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth';

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
