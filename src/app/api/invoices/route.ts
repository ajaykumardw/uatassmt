import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import prisma from '@/libs/prisma'
import { authOptions } from '@/libs/auth'
import { generateInvoiceNumber } from '@/libs/invoiceHelper'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const type = url.searchParams.get('type')
    const status = url.searchParams.get('status')
    const search = url.searchParams.get('search')
    const date_from = url.searchParams.get('date_from')
    const date_to = url.searchParams.get('date_to')
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 10))
    const skip = (page - 1) * limit

    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    if (type) {
      whereClause += ' AND i.type = ?'
      params.push(Number(type))
    }

    if (status) {
      whereClause += ' AND i.status = ?'
      params.push(Number(status))
    }

    if (date_from) {
      whereClause += ' AND i.assessment_date >= ?'
      params.push(new Date(date_from))
    }

    if (date_to) {
      whereClause += ' AND i.assessment_date <= ?'
      params.push(new Date(date_to))
    }

    if (search) {
      whereClause += ' AND (b.batch_name LIKE ? OR i.invoice_number LIKE ?)'
      const like = `%${search}%`

      params.push(like, like)
    }

    const session = await getServerSession(authOptions)
    const user = session?.user as any

    if (user?.is_ssc) {
      const userRow = await prisma.$queryRaw<Array<{ ssc_id: number }>>`
        SELECT ssc_id FROM users WHERE id = ${Number(user.id)} LIMIT 1
      `

      const sscId = (userRow as any[])[0]?.ssc_id

      if (sscId) {
        whereClause += ' AND i.ssc_id = ?'
        params.push(Number(sscId))
      }
    } else if (user?.user_type === 'U' && user?.role_id === '1') {
      whereClause += ' AND i.assessor_id = ?'
      params.push(Number(user.id))
    } else if (user?.user_type === 'U' && user?.role_id === '2') {
      whereClause += ' AND i.tp_id = ?'
      params.push(Number(user.id))
    } else if (user?.user_type === 'AG') {
      whereClause += ' AND i.agency_id = ?'
      params.push(Number(user.agency_id))
    }

    const fromClause = `
      FROM invoices i
      LEFT JOIN batches b ON b.id = i.batch_id
      LEFT JOIN sector_skill_councils ssc ON ssc.id = i.ssc_id
    `

    const countResult = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as total ${fromClause} ${whereClause}
    `, ...params)

    const total = Number((countResult as any[])[0].total)

    const selectParams = [...params, limit, skip]

    const data = await prisma.$queryRawUnsafe(`
      SELECT
        i.id,
        i.invoice_number,
        i.type,
        i.batch_id,
        b.batch_name AS batch_name,
        i.ssc_id,
        ssc.ssc_name AS ssc_name,
        i.scheme,
        i.assessor_id,
        i.tp_id,
        i.assessment_date,
        i.total_candidate,
        i.present_candidate,
        i.amount_per_candidate,
        i.total_amount,
        i.advance_amount,
        i.tds_amount,
        i.other_deduction,
        i.net_amount,
        i.gst_amount,
        i.group_photo,
        i.attendance_sheet,
        i.invoice_pdf,
        i.signed_copy,
        i.payment_receipt,
        i.status,
        i.notes,
        i.created_at
      ${fromClause} ${whereClause}
      ORDER BY i.id DESC
      LIMIT ? OFFSET ?
    `, ...selectParams)

    const formatted = (data as any[]).map(row => ({
      ...row,
      type: Number(row.type),
      status: Number(row.status),
      amount_per_candidate: Number(row.amount_per_candidate),
      total_amount: Number(row.total_amount),
      advance_amount: row.advance_amount ? Number(row.advance_amount) : null,
      tds_amount: row.tds_amount ? Number(row.tds_amount) : null,
      other_deduction: row.other_deduction ? Number(row.other_deduction) : null,
      net_amount: row.net_amount ? Number(row.net_amount) : null,
      gst_amount: row.gst_amount ? Number(row.gst_amount) : null
    }))

    return NextResponse.json({
      status: 'Success',
      statusCode: 200,
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      type, batch_id, ssc_id, scheme, assessor_id, tp_id, assessment_date,
      amount_per_candidate, total_amount,
      advance_amount, tds_amount, other_deduction, net_amount, gst_amount,
      group_photo, attendance_sheet, invoice_pdf, signed_copy, payment_receipt, notes
    } = body

    if (!type || !batch_id || !amount_per_candidate || !total_amount) {
      return NextResponse.json({ status: 'Error', statusCode: 400, message: 'Missing required fields' }, { status: 400 })
    }

    if (Number(type) === 1) {
      if (!ssc_id) {
        return NextResponse.json({ status: 'Error', statusCode: 400, message: 'Missing required fields for SSC invoice' }, { status: 400 })
      }
    } else if (Number(type) === 2) {
      if (!ssc_id || !assessor_id) {
        return NextResponse.json({ status: 'Error', statusCode: 400, message: 'Missing required fields for Assessor invoice' }, { status: 400 })
      }
    } else if (Number(type) === 3) {
      if (!tp_id) {
        return NextResponse.json({ status: 'Error', statusCode: 400, message: 'Missing required fields for TP invoice' }, { status: 400 })
      }
    } else {
      return NextResponse.json({ status: 'Error', statusCode: 400, message: 'Invalid invoice type' }, { status: 400 })
    }

    const batchRows = await prisma.$queryRaw`
      SELECT id, batch_size FROM batches WHERE id = ${Number(batch_id)} LIMIT 1
    `

    const batch = (batchRows as any[])[0]

    if (!batch) {
      return NextResponse.json({ status: 'Error', statusCode: 400, message: 'Batch not found' }, { status: 400 })
    }

    const total_candidate = body.total_candidate ? Number(body.total_candidate) : Number(batch.batch_size) || 0
    const present_candidate = body.present_candidate !== undefined ? Number(body.present_candidate) : total_candidate

    const session = await getServerSession(authOptions)
    const created_by = Number(session?.user?.id || 1)
    const agency_id = Number((session?.user as any)?.agency_id || 1)

    const invoice_number = await generateInvoiceNumber(Number(type))

    await prisma.$executeRaw`
      INSERT INTO invoices (
        invoice_number, type, batch_id, ssc_id, scheme, assessor_id, tp_id,
        assessment_date, total_candidate, present_candidate, amount_per_candidate,
        total_amount, advance_amount, tds_amount, other_deduction, net_amount,
        gst_amount, group_photo, attendance_sheet, invoice_pdf, signed_copy, payment_receipt,
        status, notes, agency_id, created_by, created_at, updated_at
      ) VALUES (
        ${invoice_number}, ${Number(type)}, ${Number(batch_id)}, ${ssc_id ? Number(ssc_id) : null},
        ${scheme || null}, ${assessor_id ? Number(assessor_id) : null}, ${tp_id ? Number(tp_id) : null},
        ${assessment_date ? new Date(assessment_date) : null}, ${Number(total_candidate)},
        ${present_candidate ? Number(present_candidate) : 0}, ${Number(amount_per_candidate)},
        ${Number(total_amount)}, ${advance_amount ? Number(advance_amount) : 0},
        ${tds_amount ? Number(tds_amount) : 0}, ${other_deduction ? Number(other_deduction) : 0},
        ${net_amount ? Number(net_amount) : null}, ${gst_amount ? Number(gst_amount) : 0},
        ${group_photo || null}, ${attendance_sheet || null}, ${invoice_pdf || null},
        ${signed_copy || null}, ${payment_receipt || null}, 1, ${notes || null}, ${agency_id}, ${created_by}, NOW(), NOW()
      )
    `

    return NextResponse.json({ status: 'Success', statusCode: 200, message: 'Invoice created successfully' })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}
