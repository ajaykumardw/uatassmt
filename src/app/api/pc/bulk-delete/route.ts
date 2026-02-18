import { NextResponse } from 'next/server';

import prisma from '@/libs/prisma'; // adjust to your actual prisma import path

export async function POST(req: Request) {
  const { pcIds, nosId } = await req.json();

  if (!Array.isArray(pcIds) || pcIds.length === 0) {
    return NextResponse.json({
      status: 'Success',
      statusCode: 200,
      message: 'No PC IDs provided, nothing to delete',
      data: {
        deletedCount: 0
      }
    }, { status: 404 });
  }


  const deletedPCs = await prisma.pc.deleteMany({
    where: {
      id: { in: pcIds },
      nos: {
        id: nosId ?? undefined,
      },
    },
  });

  return NextResponse.json({
    status: 'Success',
    statusCode: 200,
    message: 'PCs deleted successfully',
    data: {
      deletedCount: deletedPCs.count
    }
  });

}
