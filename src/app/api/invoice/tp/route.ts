import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/libs/prisma'
import { authOptions } from '@/libs/auth'
import { generateInvoiceNumber } from '@/libs/invoiceHelper'

const TP_INVOICE_MAP: Record<number, string> = { 0: 'draft', 1: 'shared' }
const TP_PAYMENT_MAP: Record<number, string> = { 0: 'pending', 1: 'received' }
const TP_INVOICE_REV: Record<string, number> = { draft: 0, shared: 1 }
const TP_PAYMENT_REV: Record<string, number> = { pending: 0, received: 1 }

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const tp_id = url.searchParams.get('tp_id')
    const invoice_status = url.searchParams.get('invoice_status')
    const payment_status = url.searchParams.get('payment_status')

    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    if (tp_id) {
      whereClause += ' AND ti.tp_id = ?'
      params.push(Number(tp_id))
    }
    if (invoice_status) {
      whereClause += ' AND ti.invoice_status = ?'
      params.push(TP_INVOICE_REV[invoice_status] ?? Number(invoice_status))
    }
    if (payment_status) {
      whereClause += ' AND ti.payment_status = ?'
      params.push(TP_PAYMENT_REV[payment_status] ?? Number(payment_status))
    }

    const data = await prisma.$queryRawUnsafe(`
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
        ti.created_at
      FROM tp_invoices ti
      LEFT JOIN batches b ON b.id = ti.batch_id
      LEFT JOIN schemes s ON s.id = ti.scheme_id
      LEFT JOIN users u ON u.id = ti.tp_id
      ${whereClause}
      ORDER BY ti.id DESC
    `, ...params)

    const formatted = (data as any[]).map(row => ({
      ...row,
      invoice_status: TP_INVOICE_MAP[row.invoice_status as number] ?? row.invoice_status,
      payment_status: TP_PAYMENT_MAP[row.payment_status as number] ?? row.payment_status,
      amount_per_candidate: Number(row.amount_per_candidate),
      total_amount: Number(row.total_amount),
      gst_amount: Number(row.gst_amount)
    }))

    return NextResponse.json({ status: 'Success', statusCode: 200, data: formatted })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { batch_id, scheme_id, tp_id, total_candidate, amount_per_candidate, total_amount, gst_amount, invoice_pdf } = body

    if (!batch_id || !scheme_id || !tp_id || !total_candidate || !amount_per_candidate || !total_amount) {
      return NextResponse.json({ status: 'Error', statusCode: 400, message: 'Missing required fields' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    const created_by = Number(session?.user?.id || 1)
    const agency_id = Number((session?.user as any)?.agency_id || 1)

    const invoice_number = await generateInvoiceNumber('TP', 'tp_invoices')

    await prisma.$executeRaw`
      INSERT INTO tp_invoices (invoice_number, batch_id, scheme_id, tp_id, total_candidate, amount_per_candidate, total_amount, gst_amount, invoice_pdf, agency_id, created_by, created_at, updated_at)
      VALUES (${invoice_number}, ${Number(batch_id)}, ${Number(scheme_id)}, ${Number(tp_id)}, ${Number(total_candidate)}, ${Number(amount_per_candidate)}, ${Number(total_amount)}, ${gst_amount ? Number(gst_amount) : 0}, ${invoice_pdf || null}, ${agency_id}, ${created_by}, NOW(), NOW())
    `

    return NextResponse.json({ status: 'Success', statusCode: 200, message: 'TP invoice created successfully' })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}
