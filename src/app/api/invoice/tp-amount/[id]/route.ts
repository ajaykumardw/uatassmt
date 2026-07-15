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

    const setClauses: string[] = []
    const values: any[] = []

    if (scheme_id !== undefined) { setClauses.push('scheme_id = ?'); values.push(Number(scheme_id)) }
    if (amount_per_candidate !== undefined) { setClauses.push('amount_per_candidate = ?'); values.push(Number(amount_per_candidate)) }
    if (status !== undefined) { setClauses.push('status = ?'); values.push(Number(status)) }

    if (setClauses.length === 0) {
      return NextResponse.json({ status: 'Error', statusCode: 400, message: 'No fields to update' }, { status: 400 })
    }

    setClauses.push('updated_at = NOW()')
    values.push(id)

    await prisma.$executeRawUnsafe(`
      UPDATE tp_invoice_amounts
      SET ${setClauses.join(', ')}
      WHERE id = ?
    `, ...values)

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
