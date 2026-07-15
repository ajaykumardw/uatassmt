import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)

    const data = await prisma.$queryRaw`
      SELECT
        imd.id,
        imd.ssc_id,
        ssc.ssc_name AS ssc_name,
        imd.scheme_id,
        s.scheme_name AS scheme_name,
        imd.scheme_name,
        imd.amount_per_candidate,
        imd.status
      FROM invoice_master_data imd
      LEFT JOIN sector_skill_councils ssc ON ssc.id = imd.ssc_id
      LEFT JOIN schemes s ON s.id = imd.scheme_id
      WHERE imd.id = ${id}
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
    const { ssc_id, scheme_id, scheme_name, amount_per_candidate, status } = body

    const existing = await prisma.$queryRaw`
      SELECT id FROM invoice_master_data WHERE id = ${id} LIMIT 1
    `

    if ((existing as any[]).length === 0) {
      return NextResponse.json({ status: 'Error', statusCode: 404, message: 'Record not found' }, { status: 404 })
    }

    const setClauses: string[] = []
    const values: any[] = []

    if (ssc_id !== undefined) { setClauses.push('ssc_id = ?'); values.push(Number(ssc_id)) }
    if (scheme_id !== undefined) { setClauses.push('scheme_id = ?'); values.push(Number(scheme_id)) }
    if (scheme_name !== undefined) { setClauses.push('scheme_name = ?'); values.push(scheme_name) }
    if (amount_per_candidate !== undefined) { setClauses.push('amount_per_candidate = ?'); values.push(Number(amount_per_candidate)) }
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
