import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'

const INVOICE_STATUS_MAP: Record<number, string> = { 0: 'draft', 1: 'pending_approval', 2: 'approved', 3: 'rejected' }
const AMOUNT_STATUS_MAP: Record<number, string> = { 0: 'pending', 1: 'transferred' }
const INVOICE_STATUS_REV: Record<string, number> = { draft: 0, pending_approval: 1, approved: 2, rejected: 3 }
const AMOUNT_STATUS_REV: Record<string, number> = { pending: 0, transferred: 1 }

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)

    const data = await prisma.$queryRaw`
      SELECT
        ai.id,
        ai.invoice_number,
        ai.batch_id,
        b.batch_name AS batch_name,
        ai.ssc_id,
        ssc.ssc_name AS ssc_name,
        ai.assessor_id,
        CONCAT(u.first_name, ' ', u.last_name) AS assessor_name,
        ai.assessment_date,
        ai.total_candidate,
        ai.present_candidate,
        ai.amount_per_candidate,
        ai.total_amount,
        ai.invoice_pdf,
        ai.signed_copy,
        ai.invoice_status,
        ai.amount_status,
        ai.advance_amount,
        ai.tds_amount,
        ai.other_deduction,
        ai.net_amount,
        ai.transaction_no,
        ai.transaction_slip,
        ai.notes,
        ai.agency_id,
        ai.created_by,
        ai.created_at,
        ai.updated_at
      FROM assessor_invoices ai
      LEFT JOIN batches b ON b.id = ai.batch_id
      LEFT JOIN sector_skill_councils ssc ON ssc.id = ai.ssc_id
      LEFT JOIN users u ON u.id = ai.assessor_id
      WHERE ai.id = ${id}
      LIMIT 1
    `

    const rows = data as any[]
    if (rows.length === 0) {
      return NextResponse.json({ status: 'Error', statusCode: 404, message: 'Invoice not found' }, { status: 404 })
    }

    const row = rows[0]
    row.invoice_status = INVOICE_STATUS_MAP[row.invoice_status as number] ?? row.invoice_status
    row.amount_status = AMOUNT_STATUS_MAP[row.amount_status as number] ?? row.amount_status
    row.amount_per_candidate = Number(row.amount_per_candidate)
    row.total_amount = Number(row.total_amount)
    row.advance_amount = row.advance_amount ? Number(row.advance_amount) : null
    row.tds_amount = row.tds_amount ? Number(row.tds_amount) : null
    row.other_deduction = row.other_deduction ? Number(row.other_deduction) : null
    row.net_amount = row.net_amount ? Number(row.net_amount) : null

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
      SELECT id FROM assessor_invoices WHERE id = ${id} LIMIT 1
    `

    if ((existing as any[]).length === 0) {
      return NextResponse.json({ status: 'Error', statusCode: 404, message: 'Invoice not found' }, { status: 404 })
    }

    const {
      batch_id, ssc_id, assessor_id, assessment_date, total_candidate, present_candidate,
      amount_per_candidate, total_amount, invoice_pdf, signed_copy,
      invoice_status, amount_status, advance_amount, tds_amount, other_deduction,
      net_amount, transaction_no, transaction_slip, notes
    } = body

    const setClauses: string[] = []
    const values: any[] = []

    if (batch_id !== undefined) { setClauses.push('batch_id = ?'); values.push(Number(batch_id)) }
    if (ssc_id !== undefined) { setClauses.push('ssc_id = ?'); values.push(Number(ssc_id)) }
    if (assessor_id !== undefined) { setClauses.push('assessor_id = ?'); values.push(Number(assessor_id)) }
    if (assessment_date !== undefined) { setClauses.push('assessment_date = ?'); values.push(assessment_date ? new Date(assessment_date) : null) }
    if (total_candidate !== undefined) { setClauses.push('total_candidate = ?'); values.push(Number(total_candidate)) }
    if (present_candidate !== undefined) { setClauses.push('present_candidate = ?'); values.push(Number(present_candidate)) }
    if (amount_per_candidate !== undefined) { setClauses.push('amount_per_candidate = ?'); values.push(Number(amount_per_candidate)) }
    if (total_amount !== undefined) { setClauses.push('total_amount = ?'); values.push(Number(total_amount)) }
    if (invoice_pdf !== undefined) { setClauses.push('invoice_pdf = ?'); values.push(invoice_pdf) }
    if (signed_copy !== undefined) { setClauses.push('signed_copy = ?'); values.push(signed_copy) }

    const invStatusVal = invoice_status !== undefined ? INVOICE_STATUS_REV[invoice_status] ?? Number(invoice_status) : undefined
    if (invStatusVal !== undefined) { setClauses.push('invoice_status = ?'); values.push(invStatusVal) }

    const amtStatusVal = amount_status !== undefined ? AMOUNT_STATUS_REV[amount_status] ?? Number(amount_status) : undefined
    if (amtStatusVal !== undefined) { setClauses.push('amount_status = ?'); values.push(amtStatusVal) }

    if (advance_amount !== undefined) { setClauses.push('advance_amount = ?'); values.push(Number(advance_amount)) }
    if (tds_amount !== undefined) { setClauses.push('tds_amount = ?'); values.push(Number(tds_amount)) }
    if (other_deduction !== undefined) { setClauses.push('other_deduction = ?'); values.push(Number(other_deduction)) }
    if (net_amount !== undefined) { setClauses.push('net_amount = ?'); values.push(Number(net_amount)) }
    if (transaction_no !== undefined) { setClauses.push('transaction_no = ?'); values.push(transaction_no) }
    if (transaction_slip !== undefined) { setClauses.push('transaction_slip = ?'); values.push(transaction_slip) }
    if (notes !== undefined) { setClauses.push('notes = ?'); values.push(notes) }

    setClauses.push('updated_at = NOW()')
    values.push(id)

    await prisma.$executeRawUnsafe(
      `UPDATE assessor_invoices SET ${setClauses.join(', ')} WHERE id = ?`,
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
      SELECT id FROM assessor_invoices WHERE id = ${id} LIMIT 1
    `

    if ((existing as any[]).length === 0) {
      return NextResponse.json({ status: 'Error', statusCode: 404, message: 'Invoice not found' }, { status: 404 })
    }

    await prisma.$executeRaw`
      DELETE FROM assessor_invoices WHERE id = ${id}
    `

    return NextResponse.json({ status: 'Success', statusCode: 200, message: 'Invoice deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}
