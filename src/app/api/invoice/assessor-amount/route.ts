import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import prisma from '@/libs/prisma'
import { authOptions } from '@/libs/auth'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const assessor_id = url.searchParams.get('assessor_id')
    const status = url.searchParams.get('status')

    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    if (assessor_id) {
      whereClause += ' AND aia.assessor_id = ?'
      params.push(Number(assessor_id))
    }

    if (status) {
      whereClause += ' AND aia.status = ?'
      params.push(Number(status))
    }

    const data = await prisma.$queryRawUnsafe(`
      SELECT
        aia.id,
        aia.assessor_id,
        CONCAT(u.first_name, ' ', u.last_name) AS assessor_name,
        aia.per_candidate_amount,
        aia.effective_from,
        aia.status
      FROM assessor_invoice_amounts aia
      LEFT JOIN users u ON u.id = aia.assessor_id
      ${whereClause}
      ORDER BY aia.id DESC
    `, ...params)

    const formatted = (data as any[]).map(row => ({
      ...row,
      per_candidate_amount: Number(row.per_candidate_amount)
    }))

    return NextResponse.json({ status: 'Success', statusCode: 200, data: formatted })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { assessor_id, per_candidate_amount, effective_from } = body

    if (!assessor_id || !per_candidate_amount) {
      return NextResponse.json({ status: 'Error', statusCode: 400, message: 'Missing required fields' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    const created_by = Number(session?.user?.id || 1)

    const existing = await prisma.$queryRaw`
      SELECT id FROM assessor_invoice_amounts WHERE assessor_id = ${Number(assessor_id)} LIMIT 1
    `

    if ((existing as any[]).length > 0) {
      return NextResponse.json({ status: 'Error', statusCode: 409, message: 'Amount record already exists for this assessor' }, { status: 409 })
    }

    await prisma.$executeRaw`
      INSERT INTO assessor_invoice_amounts (assessor_id, per_candidate_amount, effective_from, status, created_by, created_at, updated_at)
      VALUES (${Number(assessor_id)}, ${Number(per_candidate_amount)}, ${effective_from ? new Date(effective_from) : null}, 1, ${created_by}, NOW(), NOW())
    `

    return NextResponse.json({ status: 'Success', statusCode: 200, message: 'Assessor amount created successfully' })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}
