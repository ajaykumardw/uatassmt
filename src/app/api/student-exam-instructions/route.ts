// Next Imports
import { NextResponse } from 'next/server';

// Data Imports
import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function GET() {

  const session = await getServerSession(authOptions);
  const agency_id = Number(session?.user?.agency_id)

  console.log("session data from api", session);

  const examSets = await prisma.exam_sets.findMany({
    where:{
      agency_id: agency_id
    },
    include: {
      exam_sets_questions: {
        include: {
          questions: {
            select: {
              question_level: true
            }
          }
        }
      }
    }
  });

  return NextResponse.json(examSets);
}
