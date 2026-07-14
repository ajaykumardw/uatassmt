import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/libs/prisma'
import { authOptions } from '@/libs/auth'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const ssc_id = url.searchParams.get('ssc_id')
    const payment_status = url.searchParams.get('payment_status')
    const date_from = url.searchParams.get('date_from')
    const date_to = url.searchParams.get('date_to')
    const search = url.searchParams.get('search')

    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    if (ssc_id) {
      whereClause += ' AND si.ssc_id = ?'
      params.push(Number(ssc_id))
    }
    if (payment_status) {
      whereClause += ' AND si.payment_status = ?'
      params.push(payment_status)
    }
    if (date_from) {
      whereClause += ' AND si.assessment_date >= ?'
      params.push(new Date(date_from))
    }
    if (date_to) {
      whereClause += ' AND si.assessment_date <= ?'
      params.push(new Date(date_to))
    }
    if (search) {
      whereClause += ' AND (b.batch_name LIKE ? OR ssc.ssc_name LIKE ?)'
      const like = `%${search}%`
      params.push(like, like)
    }

    const data = await prisma.$queryRawUnsafe(`
      SELECT
        si.id,
        si.batch_id,
        b.batch_name AS batch_name,
        si.ssc_id,
        ssc.ssc_name AS ssc_name,
        si.assessment_date,
        si.scheme,
        si.total_candidate,
        si.present_candidate,
        si.amount_per_candidate,
        si.total_amount,
        si.group_photo,
        si.attendance_sheet,
        si.payment_status,
        si.received_amount,
        si.deduction_amount,
        si.actual_received_amount,
        si.difference_amount,
        si.notes,
        si.created_at
      FROM ssc_invoices si
      LEFT JOIN batches b ON b.id = si.batch_id
      LEFT JOIN sector_skill_councils ssc ON ssc.id = si.ssc_id
      ${whereClause}
      ORDER BY si.id DESC
    `, ...params)

    const formatted = (data as any[]).map(row => ({
      ...row,
      amount_per_candidate: Number(row.amount_per_candidate),
      total_amount: Number(row.total_amount),
      received_amount: row.received_amount ? Number(row.received_amount) : null,
      deduction_amount: row.deduction_amount ? Number(row.deduction_amount) : null,
      actual_received_amount: row.actual_received_amount ? Number(row.actual_received_amount) : null,
      difference_amount: (row.total_amount ? Number(row.total_amount) : 0) - (row.actual_received_amount ? Number(row.actual_received_amount) : 0)
    }))

    return NextResponse.json({ status: 'Success', statusCode: 200, data: formatted })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { batch_id, ssc_id, assessment_date, scheme, total_candidate, present_candidate, amount_per_candidate, total_amount, group_photo, attendance_sheet, notes } = body

    if (!batch_id || !ssc_id || !total_candidate || !present_candidate || !amount_per_candidate || !total_amount) {
      return NextResponse.json({ status: 'Error', statusCode: 400, message: 'Missing required fields' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    const created_by = Number(session?.user?.id || 1)
    const agency_id = Number((session?.user as any)?.agency_id || 1)

    await prisma.$executeRaw`
      INSERT INTO ssc_invoices (batch_id, ssc_id, assessment_date, scheme, total_candidate, present_candidate, amount_per_candidate, total_amount, group_photo, attendance_sheet, notes, agency_id, created_by, created_at, updated_at)
      VALUES (${Number(batch_id)}, ${Number(ssc_id)}, ${assessment_date ? new Date(assessment_date) : null}, ${scheme || null}, ${Number(total_candidate)}, ${Number(present_candidate)}, ${Number(amount_per_candidate)}, ${Number(total_amount)}, ${group_photo || null}, ${attendance_sheet || null}, ${notes || null}, ${agency_id}, ${created_by}, NOW(), NOW())
    `

    return NextResponse.json({ status: 'Success', statusCode: 200, message: 'SSC invoice created successfully' })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}
