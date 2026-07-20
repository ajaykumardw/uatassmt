import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'

async function checkAndUpdatePaymentComplete(invoiceId: number) {
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
  } else if (totalPaid > 0) {
    await prisma.$executeRaw`
      UPDATE invoices SET status = 5, updated_at = NOW() WHERE id = ${invoiceId}
    `
  } else {
    await prisma.$executeRaw`
      UPDATE invoices SET status = 1, updated_at = NOW() WHERE id = ${invoiceId}
    `
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)

    const existing = await prisma.$queryRaw<Array<{ invoice_id: number }>>`
      SELECT invoice_id FROM payments WHERE id = ${id} LIMIT 1
    `

    if ((existing as any[]).length === 0) {
      return NextResponse.json({ status: 'Error', statusCode: 404, message: 'Payment not found' }, { status: 404 })
    }

    const invoiceId = Number((existing as any[])[0].invoice_id)

    await prisma.$executeRaw`
      DELETE FROM payments WHERE id = ${id}
    `

    // Re-check payment status after deletion
    await checkAndUpdatePaymentComplete(invoiceId)

    return NextResponse.json({ status: 'Success', statusCode: 200, message: 'Payment deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}
