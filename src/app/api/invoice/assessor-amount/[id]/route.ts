import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/libs/prisma'
import { authOptions } from '@/libs/auth'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)

    const data = await prisma.$queryRaw`
      SELECT
        aia.id,
        aia.assessor_id,
        CONCAT(u.first_name, ' ', u.last_name) AS assessor_name,
        aia.per_candidate_amount,
        aia.effective_from,
        aia.status
      FROM assessor_invoice_amounts aia
      LEFT JOIN users u ON u.id = aia.assessor_id
      WHERE aia.id = ${id}
      LIMIT 1
    `

    const rows = data as any[]
    if (rows.length === 0) {
      return NextResponse.json({ status: 'Error', statusCode: 404, message: 'Record not found' }, { status: 404 })
    }

    const row = rows[0]
    row.per_candidate_amount = Number(row.per_candidate_amount)

    return NextResponse.json({ status: 'Success', statusCode: 200, data: row })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    const body = await req.json()
    const { assessor_id, per_candidate_amount, effective_from, status } = body

    const existing = await prisma.$queryRaw`
      SELECT id FROM assessor_invoice_amounts WHERE id = ${id} LIMIT 1
    `

    if ((existing as any[]).length === 0) {
      return NextResponse.json({ status: 'Error', statusCode: 404, message: 'Record not found' }, { status: 404 })
    }

    const setClauses: string[] = []
    const values: any[] = []

    if (assessor_id !== undefined) { setClauses.push('assessor_id = ?'); values.push(Number(assessor_id)) }
    if (per_candidate_amount !== undefined) { setClauses.push('per_candidate_amount = ?'); values.push(Number(per_candidate_amount)) }
    if (effective_from !== undefined) { setClauses.push('effective_from = ?'); values.push(effective_from ? new Date(effective_from) : null) }
    if (status !== undefined) { setClauses.push('status = ?'); values.push(Number(status)) }

    if (setClauses.length === 0) {
      return NextResponse.json({ status: 'Error', statusCode: 400, message: 'No fields to update' }, { status: 400 })
    }

    setClauses.push('updated_at = NOW()')
    values.push(id)

    await prisma.$executeRawUnsafe(`
      UPDATE assessor_invoice_amounts
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
      SELECT id FROM assessor_invoice_amounts WHERE id = ${id} LIMIT 1
    `

    if ((existing as any[]).length === 0) {
      return NextResponse.json({ status: 'Error', statusCode: 404, message: 'Record not found' }, { status: 404 })
    }

    await prisma.$executeRaw`
      DELETE FROM assessor_invoice_amounts WHERE id = ${id}
    `

    return NextResponse.json({ status: 'Success', statusCode: 200, message: 'Record deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}
