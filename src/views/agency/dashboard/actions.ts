'use server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/libs/auth'
import prisma from '@/libs/prisma'
import { STUDENT_RESULT } from '@/configs/customDataConfig'

export async function getBatchesByMonth(year: number, month: number, page: number, pageSize: number) {
  const session = await getServerSession(authOptions)
  const agencyId = Number(session?.user?.agency_id)

  if (!agencyId) return { rows: [], total: 0, page, pageSize }

  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 1)

  const where = {
    agency_id: agencyId,
    deleted_at: null,
    assessment_start_datetime: { gte: start, lt: end },
  }

  const [total, batches] = await Promise.all([
    prisma.batches.count({ where }),
    prisma.batches.findMany({
      where,
      include: {
        scheme: true,
        students: { select: { result: true } },
        training_center: { include: { city: true, state: true } },
      },
      orderBy: { assessment_start_datetime: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  const rows = batches.map(b => {
    const total = b.students.length
    const passed = b.students.filter(s => s.result === STUDENT_RESULT.PASS).length
    const failed = b.students.filter(s => s.result === STUDENT_RESULT.FAIL).length
    const pending = total - passed - failed
    const tc = b.training_center
    const parts = [tc?.address, tc?.city?.city_name, tc?.state?.state_name].filter(Boolean)
    const center_address = parts.length ? parts.join(', ') : (tc?.company_name ?? '')

    return {
      id: b.id,
      batch_name: b.batch_name ?? '',
      scheme_name: b.scheme.scheme_name,
      assessment_date: b.assessment_start_datetime?.toISOString() ?? null,
      totalStudents: total,
      passedStudents: passed,
      failedStudents: failed,
      pendingStudents: pending,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      isCompleted: b.batch_completed === 1,
      center_address,
    }
  })

  return { rows, total, page, pageSize }
}
