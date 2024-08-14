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
