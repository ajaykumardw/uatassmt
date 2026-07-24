import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import prisma from '@/libs/prisma'
import { authOptions } from '@/libs/auth'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ status: 'Error', statusCode: 401, message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const batchId = Number(searchParams.get('batchId'))

    if (!batchId) {
      return NextResponse.json({ status: 'Error', statusCode: 400, message: 'batchId is required' }, { status: 400 })
    }

    const media = await prisma.inspection_media.findMany({
      where: { batch_id: batchId },
      include: { category: true }
    })

    const grouped: Record<string, { id: number; fileName: string; path: string }[]> = {}

    for (const item of media) {
      const catName = item.category?.category_name

      if (!catName) continue

      if (!grouped[catName]) {
        grouped[catName] = []
      }

      const filePath = `storage/uploads/agency/batches/${batchId}/center-inspection/${item.file_name}`

      grouped[catName].push({
        id: item.id,
        fileName: item.file_name,
        path: filePath
      })
    }

    return NextResponse.json({
      status: 'Success',
      statusCode: 200,
      data: grouped
    })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}
