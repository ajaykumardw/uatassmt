import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/libs/prisma'
import { authOptions } from '@/libs/auth'
import { generateInvoiceNumber } from '@/libs/invoiceHelper'

const INVOICE_STATUS_MAP: Record<number, string> = { 0: 'draft', 1: 'pending_approval', 2: 'approved', 3: 'rejected' }
const AMOUNT_STATUS_MAP: Record<number, string> = { 0: 'pending', 1: 'transferred' }
const INVOICE_STATUS_REV: Record<string, number> = { draft: 0, pending_approval: 1, approved: 2, rejected: 3 }
const AMOUNT_STATUS_REV: Record<string, number> = { pending: 0, transferred: 1 }

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const assessor_id = url.searchParams.get('assessor_id')
    const invoice_status = url.searchParams.get('invoice_status')
    const amount_status = url.searchParams.get('amount_status')

    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    if (assessor_id) {
      whereClause += ' AND ai.assessor_id = ?'
      params.push(Number(assessor_id))
    }
    if (invoice_status) {
      whereClause += ' AND ai.invoice_status = ?'
      params.push(INVOICE_STATUS_REV[invoice_status] ?? Number(invoice_status))
    }
    if (amount_status) {
      whereClause += ' AND ai.amount_status = ?'
      params.push(AMOUNT_STATUS_REV[amount_status] ?? Number(amount_status))
    }

    const data = await prisma.$queryRawUnsafe(`
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
        ai.created_at
      FROM assessor_invoices ai
      LEFT JOIN batches b ON b.id = ai.batch_id
      LEFT JOIN sector_skill_councils ssc ON ssc.id = ai.ssc_id
      LEFT JOIN users u ON u.id = ai.assessor_id
      ${whereClause}
      ORDER BY ai.id DESC
    `, ...params)

    const formatted = (data as any[]).map(row => ({
      ...row,
      invoice_status: INVOICE_STATUS_MAP[row.invoice_status as number] ?? row.invoice_status,
      amount_status: AMOUNT_STATUS_MAP[row.amount_status as number] ?? row.amount_status,
      amount_per_candidate: Number(row.amount_per_candidate),
      total_amount: Number(row.total_amount),
      advance_amount: row.advance_amount ? Number(row.advance_amount) : null,
      tds_amount: row.tds_amount ? Number(row.tds_amount) : null,
      other_deduction: row.other_deduction ? Number(row.other_deduction) : null,
      net_amount: row.net_amount ? Number(row.net_amount) : null
    }))

    return NextResponse.json({ status: 'Success', statusCode: 200, data: formatted })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { batch_id, ssc_id, assessor_id, assessment_date, total_candidate, present_candidate, amount_per_candidate, total_amount, invoice_pdf } = body

    if (!batch_id || !ssc_id || !assessor_id || !total_candidate || !present_candidate || !amount_per_candidate || !total_amount) {
      return NextResponse.json({ status: 'Error', statusCode: 400, message: 'Missing required fields' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    const created_by = Number(session?.user?.id || 1)
    const agency_id = Number((session?.user as any)?.agency_id || 1)

    const invoice_number = await generateInvoiceNumber('ASSESSOR', 'assessor_invoices')

    await prisma.$executeRaw`
      INSERT INTO assessor_invoices (invoice_number, batch_id, ssc_id, assessor_id, assessment_date, total_candidate, present_candidate, amount_per_candidate, total_amount, invoice_pdf, agency_id, created_by, created_at, updated_at)
      VALUES (${invoice_number}, ${Number(batch_id)}, ${Number(ssc_id)}, ${Number(assessor_id)}, ${assessment_date ? new Date(assessment_date) : null}, ${Number(total_candidate)}, ${Number(present_candidate)}, ${Number(amount_per_candidate)}, ${Number(total_amount)}, ${invoice_pdf || null}, ${agency_id}, ${created_by}, NOW(), NOW())
    `

    return NextResponse.json({ status: 'Success', statusCode: 200, message: 'Assessor invoice created successfully' })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}
