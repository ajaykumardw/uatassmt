import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)

    const data = await prisma.$queryRaw`
      SELECT
        ai.id,
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

    await prisma.$executeRaw`
      UPDATE assessor_invoices
      SET
        batch_id = ${batch_id !== undefined ? Number(batch_id) : undefined},
        ssc_id = ${ssc_id !== undefined ? Number(ssc_id) : undefined},
        assessor_id = ${assessor_id !== undefined ? Number(assessor_id) : undefined},
        assessment_date = ${assessment_date !== undefined ? (assessment_date ? new Date(assessment_date) : null) : undefined},
        total_candidate = ${total_candidate !== undefined ? Number(total_candidate) : undefined},
        present_candidate = ${present_candidate !== undefined ? Number(present_candidate) : undefined},
        amount_per_candidate = ${amount_per_candidate !== undefined ? Number(amount_per_candidate) : undefined},
        total_amount = ${total_amount !== undefined ? Number(total_amount) : undefined},
        invoice_pdf = ${invoice_pdf !== undefined ? invoice_pdf : undefined},
        signed_copy = ${signed_copy !== undefined ? signed_copy : undefined},
        invoice_status = ${invoice_status !== undefined ? invoice_status : undefined},
        amount_status = ${amount_status !== undefined ? amount_status : undefined},
        advance_amount = ${advance_amount !== undefined ? Number(advance_amount) : undefined},
        tds_amount = ${tds_amount !== undefined ? Number(tds_amount) : undefined},
        other_deduction = ${other_deduction !== undefined ? Number(other_deduction) : undefined},
        net_amount = ${net_amount !== undefined ? Number(net_amount) : undefined},
        transaction_no = ${transaction_no !== undefined ? transaction_no : undefined},
        transaction_slip = ${transaction_slip !== undefined ? transaction_slip : undefined},
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
