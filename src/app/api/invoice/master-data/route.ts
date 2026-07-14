import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/libs/prisma'
import { authOptions } from '@/libs/auth'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const ssc_id = url.searchParams.get('ssc_id')
    const status = url.searchParams.get('status')

    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    if (ssc_id) {
      whereClause += ' AND imd.ssc_id = ?'
      params.push(Number(ssc_id))
    }
    if (status) {
      whereClause += ' AND imd.status = ?'
      params.push(Number(status))
    }

    const data = await prisma.$queryRawUnsafe(`
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
      ${whereClause}
      ORDER BY imd.id DESC
    `, ...params)

    const formatted = (data as any[]).map(row => ({
      ...row,
      amount_per_candidate: Number(row.amount_per_candidate)
    }))

    return NextResponse.json({ status: 'Success', statusCode: 200, data: formatted })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { ssc_id, scheme_id, scheme_name, amount_per_candidate } = body

    if (!ssc_id || !scheme_id || !amount_per_candidate) {
      return NextResponse.json({ status: 'Error', statusCode: 400, message: 'Missing required fields' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    const created_by = Number(session?.user?.id || 1)

    // Auto-fetch scheme name if not provided
    let resolvedSchemeName = scheme_name
    if (!resolvedSchemeName) {
      const schemeRow = await prisma.$queryRaw<Array<{ scheme_name: string }>>`
        SELECT scheme_name FROM schemes WHERE id = ${Number(scheme_id)} LIMIT 1
      `
      resolvedSchemeName = (schemeRow as any[])[0]?.scheme_name || ''
    }

    const existing = await prisma.$queryRaw`
      SELECT id FROM invoice_master_data WHERE ssc_id = ${Number(ssc_id)} AND scheme_id = ${Number(scheme_id)} LIMIT 1
    `

    if ((existing as any[]).length > 0) {
      return NextResponse.json({ status: 'Error', statusCode: 409, message: 'Record already exists for this SSC and Scheme' }, { status: 409 })
    }

    await prisma.$executeRaw`
      INSERT INTO invoice_master_data (ssc_id, scheme_id, scheme_name, amount_per_candidate, status, created_by, created_at, updated_at)
      VALUES (${Number(ssc_id)}, ${Number(scheme_id)}, ${resolvedSchemeName}, ${Number(amount_per_candidate)}, 1, ${created_by}, NOW(), NOW())
    `

    return NextResponse.json({ status: 'Success', statusCode: 200, message: 'Master data created successfully' })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}
