import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'

const TP_INVOICE_MAP: Record<number, string> = { 0: 'draft', 1: 'shared' }
const TP_PAYMENT_MAP: Record<number, string> = { 0: 'pending', 1: 'received' }
const TP_INVOICE_REV: Record<string, number> = { draft: 0, shared: 1 }
const TP_PAYMENT_REV: Record<string, number> = { pending: 0, received: 1 }

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)

    const data = await prisma.$queryRaw`
      SELECT
        ti.id,
        ti.invoice_number,
        ti.batch_id,
        b.batch_name AS batch_name,
        ti.scheme_id,
        s.scheme_name AS scheme_name,
        ti.tp_id,
        CONCAT(u.first_name, ' ', u.last_name) AS tp_name,
        ti.total_candidate,
        ti.amount_per_candidate,
        ti.total_amount,
        ti.gst_amount,
        ti.invoice_pdf,
        ti.invoice_status,
        ti.payment_status,
        ti.payment_receipt,
        ti.notes,
        ti.agency_id,
        ti.created_by,
        ti.created_at,
        ti.updated_at
      FROM tp_invoices ti
      LEFT JOIN batches b ON b.id = ti.batch_id
      LEFT JOIN schemes s ON s.id = ti.scheme_id
      LEFT JOIN users u ON u.id = ti.tp_id
      WHERE ti.id = ${id}
      LIMIT 1
    `

    const rows = data as any[]
    if (rows.length === 0) {
      return NextResponse.json({ status: 'Error', statusCode: 404, message: 'Invoice not found' }, { status: 404 })
    }

    const row = rows[0]
    row.invoice_status = TP_INVOICE_MAP[row.invoice_status as number] ?? row.invoice_status
    row.payment_status = TP_PAYMENT_MAP[row.payment_status as number] ?? row.payment_status
    row.amount_per_candidate = Number(row.amount_per_candidate)
    row.total_amount = Number(row.total_amount)
    row.gst_amount = Number(row.gst_amount)

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
      SELECT id FROM tp_invoices WHERE id = ${id} LIMIT 1
    `

    if ((existing as any[]).length === 0) {
      return NextResponse.json({ status: 'Error', statusCode: 404, message: 'Invoice not found' }, { status: 404 })
    }

    const {
      batch_id, scheme_id, tp_id, total_candidate, amount_per_candidate,
      total_amount, gst_amount, invoice_pdf, invoice_status, payment_status,
      payment_receipt, notes
    } = body

    const setClauses: string[] = []
    const values: any[] = []

    if (batch_id !== undefined) { setClauses.push('batch_id = ?'); values.push(Number(batch_id)) }
    if (scheme_id !== undefined) { setClauses.push('scheme_id = ?'); values.push(Number(scheme_id)) }
    if (tp_id !== undefined) { setClauses.push('tp_id = ?'); values.push(Number(tp_id)) }
    if (total_candidate !== undefined) { setClauses.push('total_candidate = ?'); values.push(Number(total_candidate)) }
    if (amount_per_candidate !== undefined) { setClauses.push('amount_per_candidate = ?'); values.push(Number(amount_per_candidate)) }
    if (total_amount !== undefined) { setClauses.push('total_amount = ?'); values.push(Number(total_amount)) }
    if (gst_amount !== undefined) { setClauses.push('gst_amount = ?'); values.push(Number(gst_amount)) }
    if (invoice_pdf !== undefined) { setClauses.push('invoice_pdf = ?'); values.push(invoice_pdf) }

    const invStatusVal = invoice_status !== undefined ? TP_INVOICE_REV[invoice_status] ?? Number(invoice_status) : undefined
    if (invStatusVal !== undefined) { setClauses.push('invoice_status = ?'); values.push(invStatusVal) }

    const payStatusVal = payment_status !== undefined ? TP_PAYMENT_REV[payment_status] ?? Number(payment_status) : undefined
    if (payStatusVal !== undefined) { setClauses.push('payment_status = ?'); values.push(payStatusVal) }

    if (payment_receipt !== undefined) { setClauses.push('payment_receipt = ?'); values.push(payment_receipt) }
    if (notes !== undefined) { setClauses.push('notes = ?'); values.push(notes) }

    setClauses.push('updated_at = NOW()')
    values.push(id)

    await prisma.$executeRawUnsafe(
      `UPDATE tp_invoices SET ${setClauses.join(', ')} WHERE id = ?`,
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
      SELECT id FROM tp_invoices WHERE id = ${id} LIMIT 1
    `

    if ((existing as any[]).length === 0) {
      return NextResponse.json({ status: 'Error', statusCode: 404, message: 'Invoice not found' }, { status: 404 })
    }

    await prisma.$executeRaw`
      DELETE FROM tp_invoices WHERE id = ${id}
    `

    return NextResponse.json({ status: 'Success', statusCode: 200, message: 'Invoice deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}
