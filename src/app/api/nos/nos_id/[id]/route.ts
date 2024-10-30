// Next Imports
import { NextResponse } from 'next/server'

// Data Imports
import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';


export async function GET(
  req: Request,
  context: { params: { id: string } }
) {
  const id = decodeURIComponent(context.params.id.toString());
  const session = await getServerSession(authOptions);
  const agency_id = Number(session?.user?.agency_id);

  const nos = await prisma.nos.findUnique({
    where: {
      nos_id: id,
      agency_id: agency_id
    },
    select: {
      id: true,
      nos_id: true,
      nos_name: true,
      status: true
    }
  })

  return NextResponse.json(nos);
}

