import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import prisma from '@/libs/prisma'
import { authOptions } from '@/libs/auth'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const type = url.searchParams.get('type')
    const ssc_id = url.searchParams.get('ssc_id')
    const scheme_id = url.searchParams.get('scheme_id')
    const status = url.searchParams.get('status')

    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    if (type) {
      whereClause += ' AND imd.type = ?'
      params.push(Number(type))
    }

    if (ssc_id) {
      whereClause += ' AND imd.ssc_id = ?'
      params.push(Number(ssc_id))
    }

    if (scheme_id) {
      whereClause += ' AND imd.scheme_id = ?'
      params.push(Number(scheme_id))
    }

    if (status) {
      whereClause += ' AND imd.status = ?'
      params.push(Number(status))
    }

    const data = await prisma.$queryRawUnsafe(`
      SELECT
        imd.id,
        imd.type,
        imd.ssc_id,
        ssc.ssc_name AS ssc_name,
        imd.scheme_id,
        s.scheme_name AS scheme_name,
        imd.scheme_name,
        imd.amount_per_candidate,
        imd.effective_from,
        imd.assessor_id,
        CONCAT(u.first_name, ' ', u.last_name) AS assessor_name,
        imd.status
      FROM invoice_master_data imd
      LEFT JOIN sector_skill_councils ssc ON ssc.id = imd.ssc_id
      LEFT JOIN schemes s ON s.id = imd.scheme_id
      LEFT JOIN users u ON u.id = imd.assessor_id
      ${whereClause}
      ORDER BY imd.id DESC
    `, ...params)

    const formatted = (data as any[]).map(row => ({
      ...row,
      amount_per_candidate: row.amount_per_candidate ? Number(row.amount_per_candidate) : null
    }))

    return NextResponse.json({ status: 'Success', statusCode: 200, data: formatted })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { type, ssc_id, scheme_id, scheme_name, amount_per_candidate, assessor_id, effective_from } = body

    if (!type) {
      return NextResponse.json({ status: 'Error', statusCode: 400, message: 'Type is required' }, { status: 400 })
    }

    if (Number(type) === 1) {
      if (!ssc_id || !scheme_id || !amount_per_candidate) {
        return NextResponse.json({ status: 'Error', statusCode: 400, message: 'SSC, Scheme and Amount required' }, { status: 400 })
      }
    } else if (Number(type) === 2) {
      if (!assessor_id || !amount_per_candidate) {
        return NextResponse.json({ status: 'Error', statusCode: 400, message: 'Assessor and Amount required' }, { status: 400 })
      }
    } else if (Number(type) === 3) {
      if (!scheme_id || !amount_per_candidate) {
        return NextResponse.json({ status: 'Error', statusCode: 400, message: 'Scheme and Amount required' }, { status: 400 })
      }
    } else {
      return NextResponse.json({ status: 'Error', statusCode: 400, message: 'Invalid type' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    const created_by = Number(session?.user?.id || 1)

    let resolvedSchemeName = scheme_name

    if (!resolvedSchemeName && scheme_id) {
      const schemeRow = await prisma.$queryRaw<Array<{ scheme_name: string }>>`
        SELECT scheme_name FROM schemes WHERE id = ${Number(scheme_id)} LIMIT 1
      `

      resolvedSchemeName = (schemeRow as any[])[0]?.scheme_name || ''
    }

    await prisma.$executeRaw`
      INSERT INTO invoice_master_data (type, ssc_id, scheme_id, scheme_name, amount_per_candidate, assessor_id, effective_from, status, created_by, created_at, updated_at)
      VALUES (
        ${Number(type)},
        ${ssc_id ? Number(ssc_id) : null},
        ${scheme_id ? Number(scheme_id) : null},
        ${resolvedSchemeName || null},
        ${amount_per_candidate ? Number(amount_per_candidate) : null},
        ${assessor_id ? Number(assessor_id) : null},
        ${effective_from ? new Date(effective_from) : null},
        1, ${created_by}, NOW(), NOW()
      )
    `

    return NextResponse.json({ status: 'Success', statusCode: 200, message: 'Master data created successfully' })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}
