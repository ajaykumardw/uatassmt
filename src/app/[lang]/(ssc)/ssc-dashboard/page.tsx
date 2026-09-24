import { getServerSession } from 'next-auth'

import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

import { authOptions } from '@/libs/auth'
import prisma from '@/libs/prisma'
import { STUDENT_RESULT } from '@/configs/customDataConfig'

import SscStatsCards from '@/views/ssc/dashboard/SscStatsCards'
import SscBatchesTable from '@/views/ssc/dashboard/SscBatchesTable'
import SscInvoicesCard from '@/views/ssc/dashboard/SscInvoicesCard'

interface Props {
  searchParams: Record<string, string | undefined>
}

const formatBatchRows = (list: any[]) =>
  list.map(b => {
    const total = b.students?.length ?? 0
    const passed = (b.students ?? []).filter((s: any) => s.result === STUDENT_RESULT.PASS).length
    const failed = (b.students ?? []).filter((s: any) => s.result === STUDENT_RESULT.FAIL).length
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

const SscDashboard = async ({}: Props) => {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  const sscId = Number(user?.id)

  if (!session?.user || !user?.is_ssc || !sscId) {
    return <div className='p-6 text-center text-red-500'>Unauthorized: No SSC access</div>
  }

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

  const baseBatchFilter = {
    qualification_pack: { is: { ssc_id: sscId } },
    deleted_at: null,
  }

  const [
    totalQPs,
    totalBatches,
    activeBatches,
    completedBatches,
    resultStats,
    trainingPartners,
    certificateCount,
    todayBatchesDetail,
    thisMonthBatchesDetail,
  ] = await Promise.all([
    prisma.qualification_packs.count({
      where: { ssc_id: sscId, deleted_at: null },
    }),
    prisma.batches.count({ where: baseBatchFilter }),
    prisma.batches.count({ where: { ...baseBatchFilter, batch_completed: 0 } }),
    prisma.batches.count({ where: { ...baseBatchFilter, batch_completed: 1 } }),
    prisma.students.groupBy({
      by: ['result'],
      where: {
        batch: { is: { qualification_pack: { is: { ssc_id: sscId } } } },
      },
      _count: { id: true },
    }),
    prisma.batches.groupBy({
      by: ['training_partner_id'],
      where: baseBatchFilter,
      _count: { id: true },
    }),
    prisma.students.count({
      where: {
        batch: { is: { qualification_pack: { is: { ssc_id: sscId } } } },
        certificate_no: { not: null },
      },
    }),
    prisma.batches.findMany({
      where: { ...baseBatchFilter, assessment_start_datetime: { gte: startOfToday, lt: endOfToday } },
      include: {
        scheme: true,
        training_center: { include: { city: true, state: true } },
        students: { select: { result: true } },
      },
      orderBy: { assessment_start_datetime: 'asc' },
    }),
    prisma.batches.findMany({
      where: {
        ...baseBatchFilter,
        assessment_start_datetime: { gte: new Date(now.getFullYear(), now.getMonth(), 1), lt: new Date(now.getFullYear(), now.getMonth() + 1, 1) },
      },
      include: {
        scheme: true,
        training_center: { include: { city: true, state: true } },
        students: { select: { result: true } },
      },
      orderBy: { assessment_start_datetime: 'asc' },
    }),
  ])

  const resultMap = new Map(resultStats.map(r => [r.result, r._count.id]))
  const totalStudents = resultStats.reduce((sum, r) => sum + r._count.id, 0)
  const passedStudents = resultMap.get(STUDENT_RESULT.PASS) ?? 0
  const failedStudents = resultMap.get(STUDENT_RESULT.FAIL) ?? 0
  const pendingStudents = resultMap.get(STUDENT_RESULT.PENDING) ?? 0
  const assessedStudents = passedStudents + failedStudents
  const passRate = assessedStudents > 0 ? Math.round((passedStudents / assessedStudents) * 100) : 0

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant='h4' className='font-bold'>
          SSC Dashboard
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <SscStatsCards
          totalQPs={totalQPs}
          totalBatches={totalBatches}
          activeBatches={activeBatches}
          completedBatches={completedBatches}
          totalStudents={totalStudents}
          assessedStudents={assessedStudents}
          pendingStudents={pendingStudents}
          passedStudents={passedStudents}
          failedStudents={failedStudents}
          passRate={passRate}
          trainingPartners={trainingPartners.length}
          certificateCount={certificateCount}
        />
      </Grid>
      <Grid item xs={12}>
        <SscBatchesTable
          sscId={sscId}
          todayBatches={formatBatchRows(todayBatchesDetail)}
          thisMonthBatches={formatBatchRows(thisMonthBatchesDetail)}
          initialMonth={now.getMonth() + 1}
          initialYear={now.getFullYear()}
        />
      </Grid>
      <Grid item xs={12}>
        <SscInvoicesCard sscId={sscId} />
      </Grid>
    </Grid>
  )
}

export default SscDashboard