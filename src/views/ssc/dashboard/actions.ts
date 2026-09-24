'use server'

import prisma from '@/libs/prisma'

export type SscBatchRow = {
  id: number
  batch_name: string
  scheme_name: string
  totalStudents: number
  passedStudents: number
  failedStudents: number
  pendingStudents: number
  passRate: number
  isCompleted: boolean
  center_address: string
  assessment_date: string | null
}

const PAGE_SIZE = 10

export async function getSscBatchesByMonth(
  sscId: number,
  year: number,
  month: number,
  page: number,
  pageSize: number = PAGE_SIZE
) {
  if (!sscId) return { rows: [], total: 0, page: 1, pageSize }

  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 1)

  const where = {
    qualification_pack: { is: { ssc_id: sscId } },
    deleted_at: null,
    assessment_start_datetime: { gte: start, lt: end },
  }

  const [total, batches] = await Promise.all([
    prisma.batches.count({ where }),
    prisma.batches.findMany({
      where,
      include: {
        scheme: true,
        training_center: { include: { city: true, state: true } },
        students: { select: { result: true } },
      },
      orderBy: { assessment_start_datetime: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  const rows: SscBatchRow[] = batches.map(b => {
    const totalStudents = b.students.length
    const passedStudents = b.students.filter(s => s.result === 1).length
    const failedStudents = b.students.filter(s => s.result === 2).length
    const pendingStudents = totalStudents - passedStudents - failedStudents
    const passRate = totalStudents > 0 ? Math.round((passedStudents / totalStudents) * 100) : 0
    const tc = b.training_center
    const parts = [tc?.address, tc?.city?.city_name, tc?.state?.state_name].filter(Boolean)
    const center_address = parts.length ? parts.join(', ') : (tc?.company_name ?? '')

    return {
      id: b.id,
      batch_name: b.batch_name ?? '',
      scheme_name: b.scheme.scheme_name,
      totalStudents,
      passedStudents,
      failedStudents,
      pendingStudents,
      passRate,
      isCompleted: b.batch_completed === 1,
      center_address,
      assessment_date: b.assessment_start_datetime?.toISOString() ?? null,
    }
  })

  return { rows, total, page, pageSize }
}

export type SscInvoiceRow = {
  id: number
  invoice_number: string
  batch_name: string | null
  scheme: string | null
  assessment_date: string | null
  total_candidate: number
  present_candidate: number
  total_amount: number
  status: number
}

export async function getSscRecentInvoices(sscId: number, take: number = 5) {
  if (!sscId) return []

  const data = await prisma.$queryRaw<Record<string, any>[]>`
    SELECT
      i.id,
      i.invoice_number,
      b.batch_name,
      i.scheme,
      i.assessment_date,
      i.total_candidate,
      i.present_candidate,
      i.total_amount,
      i.status
    FROM invoices i
    LEFT JOIN batches b ON b.id = i.batch_id
    WHERE i.ssc_id = ${sscId}
    ORDER BY i.id DESC
    LIMIT ${take}
  `

  const rows: SscInvoiceRow[] = data.map(row => ({
    id: Number(row.id),
    invoice_number: row.invoice_number ?? `INV-${row.id}`,
    batch_name: row.batch_name ?? null,
    scheme: row.scheme ?? null,
    assessment_date: row.assessment_date ? new Date(row.assessment_date).toISOString() : null,
    total_candidate: Number(row.total_candidate),
    present_candidate: Number(row.present_candidate),
    total_amount: Number(row.total_amount),
    status: Number(row.status),
  }))

  return rows
}
