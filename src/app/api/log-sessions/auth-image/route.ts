// Next Imports
import { NextResponse } from 'next/server';

// Data Imports
import { getServerSession } from 'next-auth';

import prisma from '@/libs/prisma';

import { authOptions } from '@/libs/auth';

export async function GET() {

  const session = await getServerSession(authOptions)

  const studentLog = await prisma.log_sessions.findFirst({
    where: {
      unique_session_id: session?.user.sessionId
    },
    select: {
      id: true,
      auth_image: true
    }
  })

  return NextResponse.json(studentLog);
}

