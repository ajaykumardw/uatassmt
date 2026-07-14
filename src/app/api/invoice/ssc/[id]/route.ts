import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'

const PAYMENT_MAP: Record<number, string> = { 0: 'pending', 1: 'received' }
const PAYMENT_REV: Record<string, number> = { pending: 0, received: 1 }

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)

    const data = await prisma.$queryRaw`
      SELECT
        si.id,
        si.invoice_number,
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
        si.agency_id,
        si.created_by,
        si.created_at,
        si.updated_at
      FROM ssc_invoices si
      LEFT JOIN batches b ON b.id = si.batch_id
      LEFT JOIN sector_skill_councils ssc ON ssc.id = si.ssc_id
      WHERE si.id = ${id}
      LIMIT 1
    `

    const rows = data as any[]
    if (rows.length === 0) {
      return NextResponse.json({ status: 'Error', statusCode: 404, message: 'Invoice not found' }, { status: 404 })
    }

    const row = rows[0]
    row.payment_status = PAYMENT_MAP[Number(row.payment_status)] || 'pending'
    row.amount_per_candidate = Number(row.amount_per_candidate)
    row.total_amount = Number(row.total_amount)
    row.received_amount = row.received_amount ? Number(row.received_amount) : null
    row.deduction_amount = row.deduction_amount ? Number(row.deduction_amount) : null
    row.actual_received_amount = row.actual_received_amount ? Number(row.actual_received_amount) : null
    row.difference_amount = row.difference_amount ? Number(row.difference_amount) : null

    return NextResponse.json({ status: 'Success', statusCode: 200, data: row })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    const body = await req.json()
    const {
      batch_id, ssc_id, assessment_date, scheme, total_candidate, present_candidate,
      amount_per_candidate, total_amount, group_photo, attendance_sheet, notes,
      payment_status, received_amount, deduction_amount, actual_received_amount, difference_amount
    } = body

    const existing = await prisma.$queryRaw`
      SELECT id FROM ssc_invoices WHERE id = ${id} LIMIT 1
    `

    if ((existing as any[]).length === 0) {
      return NextResponse.json({ status: 'Error', statusCode: 404, message: 'Invoice not found' }, { status: 404 })
    }

    const setClauses: string[] = []
    const values: any[] = []

    if (batch_id !== undefined) { setClauses.push('batch_id = ?'); values.push(Number(batch_id)) }
    if (ssc_id !== undefined) { setClauses.push('ssc_id = ?'); values.push(Number(ssc_id)) }
    if (assessment_date !== undefined) { setClauses.push('assessment_date = ?'); values.push(assessment_date ? new Date(assessment_date) : null) }
    if (scheme !== undefined) { setClauses.push('scheme = ?'); values.push(scheme) }
    if (total_candidate !== undefined) { setClauses.push('total_candidate = ?'); values.push(Number(total_candidate)) }
    if (present_candidate !== undefined) { setClauses.push('present_candidate = ?'); values.push(Number(present_candidate)) }
    if (amount_per_candidate !== undefined) { setClauses.push('amount_per_candidate = ?'); values.push(Number(amount_per_candidate)) }
    if (total_amount !== undefined) { setClauses.push('total_amount = ?'); values.push(Number(total_amount)) }
    if (group_photo !== undefined) { setClauses.push('group_photo = ?'); values.push(group_photo) }
    if (attendance_sheet !== undefined) { setClauses.push('attendance_sheet = ?'); values.push(attendance_sheet) }
    if (notes !== undefined) { setClauses.push('notes = ?'); values.push(notes) }
    if (payment_status !== undefined) { setClauses.push('payment_status = ?'); values.push(PAYMENT_REV[payment_status] !== undefined ? PAYMENT_REV[payment_status] : Number(payment_status)) }
    if (received_amount !== undefined) { setClauses.push('received_amount = ?'); values.push(Number(received_amount)) }
    if (deduction_amount !== undefined) { setClauses.push('deduction_amount = ?'); values.push(Number(deduction_amount)) }
    if (actual_received_amount !== undefined) { setClauses.push('actual_received_amount = ?'); values.push(Number(actual_received_amount)) }
    if (difference_amount !== undefined) { setClauses.push('difference_amount = ?'); values.push(Number(difference_amount)) }

    if (setClauses.length === 0) {
      return NextResponse.json({ status: 'Error', statusCode: 400, message: 'No fields to update' }, { status: 400 })
    }

    setClauses.push('updated_at = NOW()')
    values.push(id)

    await prisma.$executeRawUnsafe(
      `UPDATE ssc_invoices SET ${setClauses.join(', ')} WHERE id = ?`,
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
      SELECT id FROM ssc_invoices WHERE id = ${id} LIMIT 1
    `

    if ((existing as any[]).length === 0) {
      return NextResponse.json({ status: 'Error', statusCode: 404, message: 'Invoice not found' }, { status: 404 })
    }

    await prisma.$executeRaw`
      DELETE FROM ssc_invoices WHERE id = ${id}
    `

    return NextResponse.json({ status: 'Success', statusCode: 200, message: 'Invoice deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}
