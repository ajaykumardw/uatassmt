// Next Imports
import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

// Data Imports
import prisma from '@/libs/prisma';
import { formateTimeZone } from '@/utils/formateTimeZone';

export async function GET() {

  const logSessions = await prisma.log_sessions.findMany({});

  return NextResponse.json(logSessions);
}

export async function POST(req: NextRequest) {

  const { userId, action, user_agent } = await req.json();

  if(action == 'login'){

    await prisma.log_sessions.create({
      data: {
        user_id: userId,
        status: 'IN',
        ip_address: req.headers.get('x-forwarded-for') || req.ip,
        user_agent: user_agent,
        login_at: formateTimeZone(new Date())
      }
    })

    return NextResponse.json({message: 'log created successfully!'})

  }else if(action === 'logout'){

    const session = await prisma.log_sessions.findFirst({
      where: {
        user_id: userId,
        logout_at: null
      },
      select: {
        id: true
      }
    })

    if(session?.id){
      await prisma.log_sessions.update({
        where: {
          id: session.id,
          logout_at: null
        },
        data: {
          status: 'OUT',
          logout_at: formateTimeZone(new Date())
        }
      })

      return NextResponse.json({message: 'log updated successfully!'})
    }

  }

  return NextResponse.json({message: 'log not created!'})

}
