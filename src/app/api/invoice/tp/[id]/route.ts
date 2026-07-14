import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)

    const data = await prisma.$queryRaw`
      SELECT
        ti.id,
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

    await prisma.$executeRaw`
      UPDATE tp_invoices
      SET
        batch_id = ${batch_id !== undefined ? Number(batch_id) : undefined},
        scheme_id = ${scheme_id !== undefined ? Number(scheme_id) : undefined},
        tp_id = ${tp_id !== undefined ? Number(tp_id) : undefined},
        total_candidate = ${total_candidate !== undefined ? Number(total_candidate) : undefined},
        amount_per_candidate = ${amount_per_candidate !== undefined ? Number(amount_per_candidate) : undefined},
        total_amount = ${total_amount !== undefined ? Number(total_amount) : undefined},
        gst_amount = ${gst_amount !== undefined ? Number(gst_amount) : undefined},
        invoice_pdf = ${invoice_pdf !== undefined ? invoice_pdf : undefined},
        invoice_status = ${invoice_status !== undefined ? invoice_status : undefined},
        payment_status = ${payment_status !== undefined ? payment_status : undefined},
        payment_receipt = ${payment_receipt !== undefined ? payment_receipt : undefined},
        notes = ${notes !== undefined ? notes : undefined},
        updated_at = NOW()
      WHERE id = ${id}
    `

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
