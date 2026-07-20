import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream/promises'

import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import prisma from '@/libs/prisma'
import { authOptions } from '@/libs/auth'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const invoice_id = url.searchParams.get('invoice_id')

    if (!invoice_id) {
      return NextResponse.json({ status: 'Error', statusCode: 400, message: 'invoice_id is required' }, { status: 400 })
    }

    const data = await prisma.$queryRaw`
      SELECT
        id,
        invoice_id,
        amount,
        payment_date,
        payment_mode,
        transaction_no,
        cheque_date,
        bank_name,
        transaction_slip,
        remarks,
        created_by,
        created_at
      FROM payments
      WHERE invoice_id = ${Number(invoice_id)}
      ORDER BY created_at DESC
    `

    const formatted = (data as any[]).map(row => ({
      ...row,
      amount: Number(row.amount)
    }))

    return NextResponse.json({ status: 'Success', statusCode: 200, data: formatted })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}

async function checkAndUpdatePaymentComplete(invoiceId: number) {
  // Fetch invoice + sum of payments
  const rows = await prisma.$queryRaw<Array<{ total_amount: number; tds_amount: number; other_deduction: number; paid: number }>>`
    SELECT
      i.total_amount, i.tds_amount, i.other_deduction,
      COALESCE(SUM(p.amount), 0) AS paid
    FROM invoices i
    LEFT JOIN payments p ON p.invoice_id = i.id
    WHERE i.id = ${invoiceId}
    GROUP BY i.id
    LIMIT 1
  `

  const inv = (rows as any[])[0]
  if (!inv) return

  const netAmount = Number(inv.total_amount) - (Number(inv.tds_amount) || 0) - (Number(inv.other_deduction) || 0)
  const totalPaid = Number(inv.paid)

  if (totalPaid >= netAmount && netAmount > 0) {
    await prisma.$executeRaw`
      UPDATE invoices SET status = 4, updated_at = NOW() WHERE id = ${invoiceId}
    `
  } else {
    await prisma.$executeRaw`
      UPDATE invoices SET status = 1, updated_at = NOW() WHERE id = ${invoiceId}
    `
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const agency_id = Number((session?.user as any)?.agency_id || 1)
    const created_by = Number(session?.user?.id || 1)

    const contentType = req.headers.get('content-type') || ''

    let invoice_id: number, amount: number, payment_date: string
    let payment_mode = '', transaction_no = '', cheque_date = '', bank_name = '', transaction_slip: string | null = null, remarks = ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      invoice_id = Number(formData.get('invoice_id'))
      amount = Number(formData.get('amount'))
      payment_date = formData.get('payment_date') as string
      payment_mode = (formData.get('payment_mode') as string) || ''
      transaction_no = (formData.get('transaction_no') as string) || ''
      cheque_date = (formData.get('cheque_date') as string) || ''
      bank_name = (formData.get('bank_name') as string) || ''
      remarks = (formData.get('remarks') as string) || ''
      const file = formData.get('file') as File | null

      if (file && file.size > 0) {
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          return NextResponse.json({ status: 'Error', statusCode: 400, message: 'Invalid file format. Allowed: JPEG, PNG, WebP, PDF' }, { status: 400 })
        }
        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json({ status: 'Error', statusCode: 400, message: 'File size exceeds 5MB limit' }, { status: 400 })
        }

        const ext = file.name.split('.').pop() || 'jpg'
        const fileName = `slip-${Date.now()}.${ext}`
        const uploadDir = path.join(process.cwd(), 'storage', 'uploads', 'agency', String(agency_id), 'payments')

        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

        const filePath = path.join(uploadDir, fileName)
        await pipeline(file.stream() as any, fs.createWriteStream(filePath))

        transaction_slip = `storage/uploads/agency/${agency_id}/payments/${fileName}`
      }
    } else {
      const body = await req.json()
      invoice_id = body.invoice_id
      amount = body.amount
      payment_date = body.payment_date
      payment_mode = body.payment_mode || ''
      transaction_no = body.transaction_no || ''
      cheque_date = body.cheque_date || ''
      bank_name = body.bank_name || ''
      transaction_slip = body.transaction_slip || null
      remarks = body.remarks || ''
    }

    if (!invoice_id || !amount || !payment_date) {
      return NextResponse.json({ status: 'Error', statusCode: 400, message: 'Missing required fields: invoice_id, amount, payment_date' }, { status: 400 })
    }

    await prisma.$executeRaw`
      INSERT INTO payments (invoice_id, amount, payment_date, payment_mode, transaction_no, cheque_date, bank_name, transaction_slip, remarks, created_by, created_at)
      VALUES (${Number(invoice_id)}, ${Number(amount)}, ${new Date(payment_date)}, ${payment_mode || null}, ${transaction_no || null}, ${cheque_date ? new Date(cheque_date) : null}, ${bank_name || null}, ${transaction_slip}, ${remarks || null}, ${created_by}, NOW())
    `

    // Auto-check if payment complete
    await checkAndUpdatePaymentComplete(Number(invoice_id))

    return NextResponse.json({ status: 'Success', statusCode: 200, message: 'Payment created successfully' })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}
