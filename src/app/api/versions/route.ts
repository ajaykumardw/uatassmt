import { NextResponse } from "next/server";

import prisma from '@/libs/prisma';

export async function GET() {

  const versions = await prisma.version.findMany({
    orderBy: {
      id: 'desc'
    }
  })

  return NextResponse.json(versions);
}
