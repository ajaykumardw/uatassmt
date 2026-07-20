import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import prisma from '@/libs/prisma'
import { authOptions } from '@/libs/auth'

const STATUS_REV: Record<string, number> = { draft: 0, pending: 1, approved: 2, rejected: 3, paid: 4 }

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)

    const session = await getServerSession(authOptions)
    const user = session?.user as any

    const data = await prisma.$queryRaw`
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
        CONCAT(au.first_name, ' ', au.last_name) AS assessor_name,
        i.tp_id,
        CONCAT(tu.first_name, ' ', tu.last_name) AS tp_name,
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
        i.agency_id,
        i.created_by,
        i.created_at,
        i.updated_at
      FROM invoices i
      LEFT JOIN batches b ON b.id = i.batch_id
      LEFT JOIN sector_skill_councils ssc ON ssc.id = i.ssc_id
      LEFT JOIN users au ON au.id = i.assessor_id
      LEFT JOIN users tu ON tu.id = i.tp_id
      WHERE i.id = ${id}
      LIMIT 1
    `

    const rows = data as any[]

    if (rows.length === 0) {
      return NextResponse.json({ status: 'Error', statusCode: 404, message: 'Invoice not found' }, { status: 404 })
    }

    const row = rows[0]

    let allowed = false

    if (user?.is_ssc) {
      const userRow = await prisma.$queryRaw<Array<{ ssc_id: number }>>`
        SELECT ssc_id FROM users WHERE id = ${Number(user.id)} LIMIT 1
      `

      const sscId = (userRow as any[])[0]?.ssc_id

      if (sscId && Number(sscId) === Number(row.ssc_id)) allowed = true
    } else if (user?.user_type === 'U' && user?.role_id === '1') {
      if (Number(user.id) === Number(row.assessor_id)) allowed = true
    } else if (user?.user_type === 'U' && user?.role_id === '2') {
      if (Number(user.id) === Number(row.tp_id)) allowed = true
    } else if (user?.user_type === 'AG') {
      if (Number(user.agency_id) === Number(row.agency_id)) allowed = true
    }

    if (!allowed) {
      return NextResponse.json({ status: 'Error', statusCode: 403, message: 'Access denied' }, { status: 403 })
    }

    row.type = Number(row.type)
    row.status = Number(row.status)
    row.amount_per_candidate = Number(row.amount_per_candidate)
    row.total_amount = Number(row.total_amount)
    row.advance_amount = row.advance_amount ? Number(row.advance_amount) : null
    row.tds_amount = row.tds_amount ? Number(row.tds_amount) : null
    row.other_deduction = row.other_deduction ? Number(row.other_deduction) : null
    row.net_amount = row.net_amount ? Number(row.net_amount) : null
    row.gst_amount = row.gst_amount ? Number(row.gst_amount) : null

    return NextResponse.json({ status: 'Success', statusCode: 200, data: row })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    const body = await req.json()

    const existing = await prisma.$queryRaw`
      SELECT id, status FROM invoices WHERE id = ${id} LIMIT 1
    `

    const rows = existing as any[]

    if (rows.length === 0) {
      return NextResponse.json({ status: 'Error', statusCode: 404, message: 'Invoice not found' }, { status: 404 })
    }

    if (Number(rows[0].status) === 4) {
      return NextResponse.json({ status: 'Error', statusCode: 400, message: 'Invoice is paid and cannot be edited' }, { status: 400 })
    }

    const {
      type, batch_id, ssc_id, scheme, assessor_id, tp_id, assessment_date,
      amount_per_candidate, total_amount,
      advance_amount, tds_amount, other_deduction, net_amount, gst_amount,
      group_photo, attendance_sheet, invoice_pdf, signed_copy, payment_receipt,
      status, notes
    } = body

    const setClauses: string[] = []
    const values: any[] = []

    if (type !== undefined) { setClauses.push('type = ?'); values.push(Number(type)) }
    if (batch_id !== undefined) { setClauses.push('batch_id = ?'); values.push(Number(batch_id)) }
    if (ssc_id !== undefined) { setClauses.push('ssc_id = ?'); values.push(ssc_id ? Number(ssc_id) : null) }
    if (scheme !== undefined) { setClauses.push('scheme = ?'); values.push(scheme) }
    if (assessor_id !== undefined) { setClauses.push('assessor_id = ?'); values.push(assessor_id ? Number(assessor_id) : null) }
    if (tp_id !== undefined) { setClauses.push('tp_id = ?'); values.push(tp_id ? Number(tp_id) : null) }
    if (assessment_date !== undefined) { setClauses.push('assessment_date = ?'); values.push(assessment_date ? new Date(assessment_date) : null) }
    if (amount_per_candidate !== undefined) { setClauses.push('amount_per_candidate = ?'); values.push(Number(amount_per_candidate)) }
    if (total_amount !== undefined) { setClauses.push('total_amount = ?'); values.push(Number(total_amount)) }
    if (advance_amount !== undefined) { setClauses.push('advance_amount = ?'); values.push(Number(advance_amount)) }
    if (tds_amount !== undefined) { setClauses.push('tds_amount = ?'); values.push(Number(tds_amount)) }
    if (other_deduction !== undefined) { setClauses.push('other_deduction = ?'); values.push(Number(other_deduction)) }
    if (net_amount !== undefined) { setClauses.push('net_amount = ?'); values.push(net_amount ? Number(net_amount) : null) }
    if (gst_amount !== undefined) { setClauses.push('gst_amount = ?'); values.push(Number(gst_amount)) }
    if (group_photo !== undefined) { setClauses.push('group_photo = ?'); values.push(group_photo) }
    if (attendance_sheet !== undefined) { setClauses.push('attendance_sheet = ?'); values.push(attendance_sheet) }
    if (invoice_pdf !== undefined) { setClauses.push('invoice_pdf = ?'); values.push(invoice_pdf) }
    if (signed_copy !== undefined) { setClauses.push('signed_copy = ?'); values.push(signed_copy) }
    if (payment_receipt !== undefined) { setClauses.push('payment_receipt = ?'); values.push(payment_receipt) }
    if (status !== undefined) { setClauses.push('status = ?'); values.push(STATUS_REV[status] !== undefined ? STATUS_REV[status] : Number(status)) }
    if (notes !== undefined) { setClauses.push('notes = ?'); values.push(notes) }

    if (setClauses.length === 0) {
      return NextResponse.json({ status: 'Error', statusCode: 400, message: 'No fields to update' }, { status: 400 })
    }

    setClauses.push('updated_at = NOW()')

    values.push(id)

    await prisma.$executeRawUnsafe(
      `UPDATE invoices SET ${setClauses.join(', ')} WHERE id = ?`,
      ...values
    )

    return NextResponse.json({ status: 'Success', statusCode: 200, message: 'Invoice updated successfully' })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)

    const existing = await prisma.$queryRaw`
      SELECT id FROM invoices WHERE id = ${id} LIMIT 1
    `

    if ((existing as any[]).length === 0) {
      return NextResponse.json({ status: 'Error', statusCode: 404, message: 'Invoice not found' }, { status: 404 })
    }

    await prisma.$executeRaw`
      DELETE FROM invoices WHERE id = ${id}
    `

    return NextResponse.json({ status: 'Success', statusCode: 200, message: 'Invoice deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}
