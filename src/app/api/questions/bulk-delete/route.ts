import { NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma'; // adjust to your actual prisma import path

export async function POST(req: Request) {


  const session = await getServerSession(authOptions);
  const agencyId = Number(session?.user?.agency_id);

  const { selectedIds } = await req.json();

  if (!Array.isArray(selectedIds) || selectedIds.length === 0) {

    return NextResponse.json({
      status: 'Success',
      statusCode: 200,
      message: 'No Questions provided, nothing to delete',
      data: {
        deletedCount: 0
      }
    }, { status: 404 });
  }


  const deletedQuestions = await prisma.questions.deleteMany({
    where: {
      id: { in: selectedIds },
      agency_id: agencyId
    },
  });

  return NextResponse.json({
    status: 'Success',
    statusCode: 200,
    message: 'Questions deleted successfully',
    data: {
      deletedCount: deletedQuestions.count,
      selectedIds: selectedIds
    }
  });

}
