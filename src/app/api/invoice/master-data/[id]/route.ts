import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/libs/prisma'
import { authOptions } from '@/libs/auth'

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

    await prisma.$executeRaw`
      UPDATE invoice_master_data
      SET
        ssc_id = ${ssc_id !== undefined ? Number(ssc_id) : undefined},
        scheme_id = ${scheme_id !== undefined ? Number(scheme_id) : undefined},
        scheme_name = ${scheme_name !== undefined ? scheme_name : undefined},
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
