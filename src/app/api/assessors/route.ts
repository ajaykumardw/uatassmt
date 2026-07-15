import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/libs/prisma'
import { authOptions } from '@/libs/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const agencyId = Number((session?.user as any)?.agency_id)

    const data = await prisma.users.findMany({
      where: {
        role_id: 1,
        master_id: agencyId,
        status: 1,
        is_deleted: 0
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true
      },
      orderBy: { first_name: 'asc' }
    })

    return NextResponse.json(data)
  } catch {
    return NextResponse.json([])
  }
}
