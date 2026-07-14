import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/libs/prisma'
import { authOptions } from '@/libs/auth'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const scheme_id = url.searchParams.get('scheme_id')
    const status = url.searchParams.get('status')

    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    if (scheme_id) {
      whereClause += ' AND tia.scheme_id = ?'
      params.push(Number(scheme_id))
    }
    if (status) {
      whereClause += ' AND tia.status = ?'
      params.push(Number(status))
    }

    const data = await prisma.$queryRawUnsafe(`
      SELECT
        tia.id,
        tia.scheme_id,
        s.scheme_name AS scheme_name,
        tia.amount_per_candidate,
        tia.status
      FROM tp_invoice_amounts tia
      LEFT JOIN schemes s ON s.id = tia.scheme_id
      ${whereClause}
      ORDER BY tia.id DESC
    `, ...params)

    const formatted = (data as any[]).map(row => ({
      ...row,
      amount_per_candidate: Number(row.amount_per_candidate)
    }))

    return NextResponse.json({ status: 'Success', statusCode: 200, data: formatted })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { scheme_id, amount_per_candidate } = body

    if (!scheme_id || !amount_per_candidate) {
      return NextResponse.json({ status: 'Error', statusCode: 400, message: 'Missing required fields' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    const created_by = Number(session?.user?.id || 1)

    const existing = await prisma.$queryRaw`
      SELECT id FROM tp_invoice_amounts WHERE scheme_id = ${Number(scheme_id)} LIMIT 1
    `

    if ((existing as any[]).length > 0) {
      return NextResponse.json({ status: 'Error', statusCode: 409, message: 'Amount record already exists for this scheme' }, { status: 409 })
    }

    await prisma.$executeRaw`
      INSERT INTO tp_invoice_amounts (scheme_id, amount_per_candidate, status, created_by, created_at, updated_at)
      VALUES (${Number(scheme_id)}, ${Number(amount_per_candidate)}, 1, ${created_by}, NOW(), NOW())
    `

    return NextResponse.json({ status: 'Success', statusCode: 200, message: 'TP amount created successfully' })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}
