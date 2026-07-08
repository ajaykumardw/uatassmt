import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'

export async function GET() {
  const languages = await prisma.languages.findMany({
    select: {
      id: true,
      alias: true,
      full_name: true,
      short_name: true,
    },
    orderBy: { full_name: 'asc' }
  })

  const data = languages.map(l => ({
    id: Number(l.id),
    alias: l.alias,
    full_name: l.full_name,
    short_name: l.short_name,
  }))

  return NextResponse.json({
    status: 'Success',
    statusCode: 200,
    data
  })
}
