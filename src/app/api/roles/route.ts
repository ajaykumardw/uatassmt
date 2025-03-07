// Next Imports
import { NextResponse } from 'next/server'

// Data Imports
import prisma from '@/libs/prisma';

export async function GET() {

  const data = await prisma.role.findMany({})

  return NextResponse.json(data)
}
