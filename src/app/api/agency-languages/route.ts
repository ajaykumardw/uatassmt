import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/libs/auth'

import prisma from '@/libs/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  const agencyId = Number(session?.user?.agency_id)

  if (!agencyId) {
    return NextResponse.json({ status: 'Error', statusCode: 401, message: 'Unauthorized' }, { status: 401 })
  }

  const allLanguages = await prisma.languages.findMany({
    select: {
      id: true,
      alias: true,
      full_name: true,
      short_name: true,
    },
    orderBy: { full_name: 'asc' }
  })

  const enabledRows = await prisma.agency_languages.findMany({
    where: { agency_id: agencyId },
    select: { language_id: true }
  })

  const enabledIds = enabledRows.map(r => r.language_id)

  const data = {
    all_languages: allLanguages.map(l => ({ ...l, id: Number(l.id) })),
    enabled_language_ids: enabledIds,
  }

  return NextResponse.json({
    status: 'Success',
    statusCode: 200,
    data
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const agencyId = Number(session?.user?.agency_id)
  const userId = Number(session?.user?.id)

  if (!agencyId) {
    return NextResponse.json({ status: 'Error', statusCode: 401, message: 'Unauthorized' }, { status: 401 })
  }

  const { language_ids } = await req.json()

  if (!Array.isArray(language_ids)) {
    return NextResponse.json({ status: 'Error', statusCode: 400, message: 'language_ids must be an array' }, { status: 400 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.agency_languages.deleteMany({
      where: { agency_id: agencyId }
    })

    if (language_ids.length > 0) {
      await tx.agency_languages.createMany({
        data: language_ids.map((langId: number) => ({
          agency_id: agencyId,
          language_id: langId,
          created_by: userId,
        }))
      })
    }
  })

  return NextResponse.json({
    status: 'Success',
    statusCode: 200,
    message: 'Languages updated successfully'
  })
}
