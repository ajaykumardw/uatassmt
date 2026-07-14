import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'

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

    const existing = await prisma.$queryRaw`
      SELECT id FROM ssc_invoices WHERE id = ${id} LIMIT 1
    `

    if ((existing as any[]).length === 0) {
      return NextResponse.json({ status: 'Error', statusCode: 404, message: 'Invoice not found' }, { status: 404 })
    }

    const {
      batch_id, ssc_id, assessment_date, scheme, total_candidate, present_candidate,
      amount_per_candidate, total_amount, group_photo, attendance_sheet, notes,
      payment_status, received_amount, deduction_amount, actual_received_amount, difference_amount
    } = body

    await prisma.$executeRaw`
      UPDATE ssc_invoices
      SET
        batch_id = ${batch_id !== undefined ? Number(batch_id) : undefined},
        ssc_id = ${ssc_id !== undefined ? Number(ssc_id) : undefined},
        assessment_date = ${assessment_date !== undefined ? (assessment_date ? new Date(assessment_date) : null) : undefined},
        scheme = ${scheme !== undefined ? scheme : undefined},
        total_candidate = ${total_candidate !== undefined ? Number(total_candidate) : undefined},
        present_candidate = ${present_candidate !== undefined ? Number(present_candidate) : undefined},
        amount_per_candidate = ${amount_per_candidate !== undefined ? Number(amount_per_candidate) : undefined},
        total_amount = ${total_amount !== undefined ? Number(total_amount) : undefined},
        group_photo = ${group_photo !== undefined ? group_photo : undefined},
        attendance_sheet = ${attendance_sheet !== undefined ? attendance_sheet : undefined},
        notes = ${notes !== undefined ? notes : undefined},
        payment_status = ${payment_status !== undefined ? payment_status : undefined},
        received_amount = ${received_amount !== undefined ? Number(received_amount) : undefined},
        deduction_amount = ${deduction_amount !== undefined ? Number(deduction_amount) : undefined},
        actual_received_amount = ${actual_received_amount !== undefined ? Number(actual_received_amount) : undefined},
        difference_amount = ${difference_amount !== undefined ? Number(difference_amount) : undefined},
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
