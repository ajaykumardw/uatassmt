import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    const body = await req.json()
    const { type, ssc_id, scheme_id, scheme_name, amount_per_candidate, assessor_id, effective_from, status } = body

    const existing = await prisma.$queryRaw`
      SELECT id, type FROM invoice_master_data WHERE id = ${id} LIMIT 1
    `

    if ((existing as any[]).length === 0) {
      return NextResponse.json({ status: 'Error', statusCode: 404, message: 'Record not found' }, { status: 404 })
    }

    const setClauses: string[] = []
    const values: any[] = []

    if (type !== undefined) { setClauses.push('type = ?'); values.push(Number(type)) }
    if (ssc_id !== undefined) { setClauses.push('ssc_id = ?'); values.push(Number(ssc_id)) }
    if (scheme_id !== undefined) { setClauses.push('scheme_id = ?'); values.push(scheme_id ? Number(scheme_id) : null) }
    if (scheme_name !== undefined) { setClauses.push('scheme_name = ?'); values.push(scheme_name) }
    if (amount_per_candidate !== undefined) { setClauses.push('amount_per_candidate = ?'); values.push(amount_per_candidate ? Number(amount_per_candidate) : null) }
    if (assessor_id !== undefined) { setClauses.push('assessor_id = ?'); values.push(assessor_id ? Number(assessor_id) : null) }
    if (effective_from !== undefined) { setClauses.push('effective_from = ?'); values.push(effective_from ? new Date(effective_from) : null) }
    if (status !== undefined) { setClauses.push('status = ?'); values.push(Number(status)) }

    if (setClauses.length === 0) {
      return NextResponse.json({ status: 'Error', statusCode: 400, message: 'No fields to update' }, { status: 400 })
    }

    setClauses.push('updated_at = NOW()')
    values.push(id)

    await prisma.$executeRawUnsafe(
      `UPDATE invoice_master_data SET ${setClauses.join(', ')} WHERE id = ?`,
      ...values
    )

    return NextResponse.json({ status: 'Success', statusCode: 200, message: 'Record updated successfully' })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)

    const existing = await prisma.$queryRaw`
      SELECT id FROM invoice_master_data WHERE id = ${id} LIMIT 1
    `

    if ((existing as any[]).length === 0) {
      return NextResponse.json({ status: 'Error', statusCode: 404, message: 'Record not found' }, { status: 404 })
    }

    await prisma.$executeRaw`
      DELETE FROM invoice_master_data WHERE id = ${id}
    `

    return NextResponse.json({ status: 'Success', statusCode: 200, message: 'Record deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}
