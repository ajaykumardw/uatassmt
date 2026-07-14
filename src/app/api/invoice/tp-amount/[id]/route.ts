import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)

    const data = await prisma.$queryRaw`
      SELECT
        tia.id,
        tia.scheme_id,
        s.scheme_name AS scheme_name,
        tia.amount_per_candidate,
        tia.status
      FROM tp_invoice_amounts tia
      LEFT JOIN schemes s ON s.id = tia.scheme_id
      WHERE tia.id = ${id}
      LIMIT 1
    `

    const rows = data as any[]
    if (rows.length === 0) {
      return NextResponse.json({ status: 'Error', statusCode: 404, message: 'Record not found' }, { status: 404 })
    }

    const row = rows[0]
    row.amount_per_candidate = Number(row.amount_per_candidate)

    return NextResponse.json({ status: 'Success', statusCode: 200, data: row })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    const body = await req.json()
    const { scheme_id, amount_per_candidate, status } = body

    const existing = await prisma.$queryRaw`
      SELECT id FROM tp_invoice_amounts WHERE id = ${id} LIMIT 1
    `

    if ((existing as any[]).length === 0) {
      return NextResponse.json({ status: 'Error', statusCode: 404, message: 'Record not found' }, { status: 404 })
    }

    await prisma.$executeRaw`
      UPDATE tp_invoice_amounts
      SET
        scheme_id = ${scheme_id !== undefined ? Number(scheme_id) : undefined},
        amount_per_candidate = ${amount_per_candidate !== undefined ? Number(amount_per_candidate) : undefined},
        status = ${status !== undefined ? Number(status) : undefined},
        updated_at = NOW()
      WHERE id = ${id}
    `

    return NextResponse.json({ status: 'Success', statusCode: 200, message: 'Record updated successfully' })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)

    const existing = await prisma.$queryRaw`
      SELECT id FROM tp_invoice_amounts WHERE id = ${id} LIMIT 1
    `

    if ((existing as any[]).length === 0) {
      return NextResponse.json({ status: 'Error', statusCode: 404, message: 'Record not found' }, { status: 404 })
    }

    await prisma.$executeRaw`
      DELETE FROM tp_invoice_amounts WHERE id = ${id}
    `

    return NextResponse.json({ status: 'Success', statusCode: 200, message: 'Record deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}
