import { NextResponse } from 'next/server';

import prisma from '@/libs/prisma'; // adjust to your actual prisma import path

export async function POST(req: Request) {
  const { pcIds, nosId } = await req.json();

  if (!Array.isArray(pcIds) || pcIds.length === 0) {
    return NextResponse.json({ nonExistingPcIds: [] });
  }

  const existingPcs = await prisma.pc.findMany({
    where: {
      pc_id: { in: pcIds },
      nos: {
        nos_id: nosId ?? undefined,
      },
    },
    select: {
      pc_id: true,
      theory_marks: true,
    },
  });

  const existingIds = existingPcs.map(pc => pc.pc_id);
  const nonExistingPcIds = pcIds.filter(id => !existingIds.includes(id));

  const pcTheoryMarks: Record<string, number> = {};

  existingPcs.forEach(pc => {
    const id = pc.pc_id as string;

    pcTheoryMarks[id] = Number(pc.theory_marks || 0);
  });

  return NextResponse.json({ nonExistingPcIds, pcTheoryMarks });
}
