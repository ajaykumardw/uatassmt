// Next Imports
import { NextResponse } from 'next/server';

import prisma from '@/libs/prisma';

export async function GET(
  req: Request,
  { params }: { params: { id: number } }
) {

  const {id} = params;

  if (Number(id) === 0) {
    // Return an empty array if id is 0
    return NextResponse.json([]);
  }

  const subSchemes = await prisma.schemes.findMany({
    where: {
      parent_id: Number(id)
    },
    orderBy: {
      scheme_name: "asc"
    }
  });

  return NextResponse.json(subSchemes);
}
