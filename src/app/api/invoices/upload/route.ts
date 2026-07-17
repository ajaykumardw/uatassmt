import fs from 'fs'
import path from 'path'

import { pipeline } from 'stream/promises'

import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import prisma from '@/libs/prisma'
import { authOptions } from '@/libs/auth'

const ALLOWED_TYPES: Record<string, string[]> = {
  group_photo: ['image/jpeg', 'image/png', 'image/webp'],
  attendance_sheet: ['image/jpeg', 'image/png', 'application/pdf'],
  invoice_pdf: ['application/pdf'],
  signed_copy: ['application/pdf', 'image/jpeg', 'image/png'],
  payment_receipt: ['application/pdf', 'image/jpeg', 'image/png'],
  transaction_slip: ['image/jpeg', 'image/png', 'application/pdf']
}

const MAX_FILE_SIZE = 5 * 1024 * 1024

const FIELD_MAP: Record<string, string> = {
  group_photo: 'group_photo',
  attendance_sheet: 'attendance_sheet',
  invoice_pdf: 'invoice_pdf',
  signed_copy: 'signed_copy',
  payment_receipt: 'payment_receipt',
  transaction_slip: 'transaction_slip'
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const agency_id = Number((session?.user as any)?.agency_id || 1)

    const formData = await req.formData()
    const invoice_id = Number(formData.get('invoice_id'))
    const file_type = formData.get('file_type') as string
    const file = formData.get('file') as File | null

    if (!invoice_id || !file_type || !file) {
      return NextResponse.json({ status: 'Error', statusCode: 400, message: 'Missing required fields' }, { status: 400 })
    }

    if (!ALLOWED_TYPES[file_type]) {
      return NextResponse.json({ status: 'Error', statusCode: 400, message: 'Invalid file type' }, { status: 400 })
    }

    if (!ALLOWED_TYPES[file_type].includes(file.type)) {
      return NextResponse.json({ status: 'Error', statusCode: 400, message: `Invalid file format for ${file_type}. Allowed: ${ALLOWED_TYPES[file_type].join(', ')}` }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ status: 'Error', statusCode: 400, message: 'File size exceeds 5MB limit' }, { status: 400 })
    }

    const rows = await prisma.$queryRaw`
      SELECT id, invoice_number FROM invoices WHERE id = ${invoice_id} LIMIT 1
    `

    const invoice = (rows as any[])[0]

    if (!invoice) {
      return NextResponse.json({ status: 'Error', statusCode: 404, message: 'Invoice not found' }, { status: 404 })
    }

    const invoiceNo = invoice.invoice_number || `INV-${invoice.id}`
    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `${file_type}.${ext}`
    const uploadDir = path.join(process.cwd(), 'storage', 'uploads', 'agency', String(agency_id), 'invoices', invoiceNo)

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const filePath = path.join(uploadDir, fileName)

    await pipeline(file.stream() as any, fs.createWriteStream(filePath))

    const dbField = FIELD_MAP[file_type]
    const relativePath = `storage/uploads/agency/${agency_id}/invoices/${invoiceNo}/${fileName}`

    await prisma.$executeRawUnsafe(
      `UPDATE invoices SET \`${dbField}\` = ?, updated_at = NOW() WHERE id = ?`,
      relativePath,
      invoice_id
    )

    return NextResponse.json({
      status: 'Success',
      statusCode: 200,
      data: { path: relativePath, url: `/${relativePath}` },
      message: `${file_type} uploaded successfully`
    })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}
