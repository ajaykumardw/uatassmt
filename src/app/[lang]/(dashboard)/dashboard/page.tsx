import { getServerSession } from 'next-auth'

import Grid from '@mui/material/Grid'

import { authOptions } from '@/libs/auth'
import prisma from '@/libs/prisma'
import { getServerMode } from '@core/utils/serverHelpers'
import { STUDENT_RESULT } from '@/configs/customDataConfig'
import DashboardStats from '@/views/agency/dashboard/DashboardStats'
import MonthlyTrendChart from '@/views/agency/dashboard/MonthlyTrendChart'
import ResultDistribution from '@/views/agency/dashboard/ResultDistribution'
import GenderDistribution from '@/views/agency/dashboard/GenderDistribution'
import OverdueBatchesCard from '@/views/agency/dashboard/OverdueBatchesCard'
import BatchesTable from '@/views/agency/dashboard/BatchesTable'

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const Dashboard = async () => {
  const session = await getServerSession(authOptions)
  const agencyId = Number(session?.user?.agency_id)

  if (!agencyId) {
    return <div className='p-6 text-center text-red-500'>Unauthorized: No agency access</div>
  }

  const serverMode = getServerMode()

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const batchFilter = { agency_id: agencyId, deleted_at: null }

  const [
    totalBatches,
    activeBatches,
    completedBatches,
    todayBatches,
    thisMonthBatches,
    upcomingBatches,
    resultStats,
    recentStudents,
    todayBatchesDetail,
    thisMonthBatchesDetail,
    attendanceCount,
    certificateCount,
    genderStats,
    overdueBatches,
  ] = await Promise.all([
    prisma.batches.count({ where: batchFilter }),
    prisma.batches.count({ where: { ...batchFilter, batch_completed: 0 } }),
    prisma.batches.count({ where: { ...batchFilter, batch_completed: 1 } }),
    prisma.batches.count({
      where: { ...batchFilter, assessment_start_datetime: { gte: startOfToday, lt: endOfToday } }
    }),
    prisma.batches.count({
      where: { ...batchFilter, assessment_start_datetime: { gte: startOfMonth, lt: startOfNextMonth } }
    }),
    prisma.batches.count({
      where: { ...batchFilter, assessment_start_datetime: { gt: endOfToday } }
    }),
    prisma.students.groupBy({
      by: ['result'],
      where: { agency_id: agencyId },
      _count: { id: true },
    }),
    prisma.students.findMany({
      where: {
        agency_id: agencyId,
        created_at: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
      },
      select: { created_at: true, result: true },
    }),
    prisma.batches.findMany({
      where: { ...batchFilter, assessment_start_datetime: { gte: startOfToday, lt: endOfToday } },
      include: { scheme: true, students: { select: { result: true } }, training_center: { include: { city: true, state: true } } },
      orderBy: { assessment_start_datetime: 'asc' },
    }),
    prisma.batches.findMany({
      where: { ...batchFilter, assessment_start_datetime: { gte: startOfMonth, lt: startOfNextMonth } },
      include: { scheme: true, students: { select: { result: true } }, training_center: { include: { city: true, state: true } } },
      orderBy: { assessment_start_datetime: 'asc' },
    }),
    prisma.students.count({ where: { agency_id: agencyId, attendance: 1 } }),
    prisma.students.count({ where: { agency_id: agencyId, certificate_no: { not: null } } }),
    prisma.students.groupBy({
      by: ['gender'],
      where: { agency_id: agencyId },
      _count: { id: true },
    }),
    prisma.batches.findMany({
      where: {
        ...batchFilter,
        batch_completed: 0,
        assessment_end_datetime: { lt: now },
      },
      include: { scheme: true, _count: { select: { students: true } }, training_center: { include: { city: true, state: true } } },
      orderBy: { assessment_end_datetime: 'asc' },
    }),
  ])

  // Result distribution
  const resultMap = new Map(resultStats.map(r => [r.result, r._count.id]))
  const totalStudents = resultStats.reduce((sum, r) => sum + r._count.id, 0)
  const passedStudents = resultMap.get(STUDENT_RESULT.PASS) ?? 0
  const failedStudents = resultMap.get(STUDENT_RESULT.FAIL) ?? 0
  const pendingStudents = resultMap.get(STUDENT_RESULT.PENDING) ?? 0
  const assessedStudents = passedStudents + failedStudents
  const passRate = assessedStudents > 0 ? Math.round((passedStudents / assessedStudents) * 100) : 0

  // Monthly trend
  const monthlyMap = new Map<string, { enrolled: number; assessed: number }>()

  for (const s of recentStudents) {
    const key = `${s.created_at.getFullYear()}-${String(s.created_at.getMonth() + 1).padStart(2, '0')}`

    if (!monthlyMap.has(key)) monthlyMap.set(key, { enrolled: 0, assessed: 0 })
    const entry = monthlyMap.get(key)!

    entry.enrolled++
    if (s.result !== STUDENT_RESULT.PENDING) entry.assessed++
  }

  const monthlyTrend = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => {
      const [, m] = key.split('-')

      return { month: `${monthNames[parseInt(m) - 1]}`, enrolled: val.enrolled, assessed: val.assessed }
    })

  // Batch table helper
  const formatBatches = (list: typeof todayBatchesDetail) =>
    list.map(b => {
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

  const todayBatchesTable = formatBatches(todayBatchesDetail)
  const thisMonthBatchesTable = formatBatches(thisMonthBatchesDetail)

  // Attendance & certificates
  const attendanceRate = totalStudents > 0 ? Math.round((attendanceCount / totalStudents) * 100) : 0
  const certificateRate = totalStudents > 0 ? Math.round((certificateCount / totalStudents) * 100) : 0

  // Gender distribution
  const genderMap = new Map(genderStats.map(r => [r.gender, r._count.id]))
  const maleCount = genderMap.get('m') ?? 0
  const femaleCount = (genderMap.get('f') ?? 0) + (genderMap.get('t') ?? 0)

  // Overdue batches
  const overdueList = overdueBatches.map(b => {
    const tc = b.training_center
    const parts = [tc?.address, tc?.city?.city_name, tc?.state?.state_name].filter(Boolean)
    const center_address = parts.length ? parts.join(', ') : (tc?.company_name ?? '')

    return {
      id: b.id,
      batch_name: b.batch_name ?? '',
      scheme_name: b.scheme.scheme_name,
      assessment_end: b.assessment_end_datetime?.toISOString() ?? null,
      totalStudents: b._count.students,
      center_address,
    }
  })

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <DashboardStats
          totalBatches={totalBatches}
          activeBatches={activeBatches}
          completedBatches={completedBatches}
          todayBatches={todayBatches}
          thisMonthBatches={thisMonthBatches}
          upcomingBatches={upcomingBatches}
          totalStudents={totalStudents}
          passedStudents={passedStudents}
          failedStudents={failedStudents}
          pendingStudents={pendingStudents}
          passRate={passRate}
          assessedStudents={assessedStudents}
          attendanceRate={attendanceRate}
          certificateRate={certificateRate}
        />
      </Grid>
      <Grid item xs={12} md={8}>
        <MonthlyTrendChart data={monthlyTrend} serverMode={serverMode} />
      </Grid>
      <Grid item xs={12} md={4}>
        <ResultDistribution
          enrolled={totalStudents}
          assessed={assessedStudents}
          passed={passedStudents}
          failed={failedStudents}
          pending={pendingStudents}
          serverMode={serverMode}
        />
      </Grid>
      <Grid item xs={12} md={5}>
        <GenderDistribution male={maleCount} female={femaleCount} serverMode={serverMode} />
      </Grid>
      <Grid item xs={12} md={7}>
        <OverdueBatchesCard batches={overdueList} />
      </Grid>
      <Grid item xs={12}>
        <BatchesTable todayBatches={todayBatchesTable} thisMonthBatches={thisMonthBatchesTable} />
      </Grid>
    </Grid>
  )
}

export default Dashboard
