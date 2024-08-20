// Next Imports
import { NextResponse } from 'next/server'

// Data Imports
// import { getServerSession } from 'next-auth';

// import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function POST(
  req: Request,
  context: { params: { id: number } }
) {

  const id = Number(context.params.id);

  const user = await prisma.users.findFirst({
    where: {
      id: id
    }
  })

  return NextResponse.json({exists: !!user});
}
