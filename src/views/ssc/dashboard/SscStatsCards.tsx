'use client'

import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'

import CustomAvatar from '@core/components/mui/Avatar'

interface StatCardProps {
  title: string
  stats: string | number
  subtitle: string
  avatarIcon: string
  avatarColor: 'primary' | 'success' | 'warning' | 'info' | 'error'
}

const StatCard = ({ title, stats, subtitle, avatarIcon, avatarColor }: StatCardProps) => (
  <Card>
    <CardContent className='flex items-center gap-4'>
      <CustomAvatar variant='rounded' color={avatarColor} skin='light' size={50}>
        <i className={avatarIcon} style={{ fontSize: 26 }} />
      </CustomAvatar>
      <div>
        <Typography variant='h4'>{stats}</Typography>
        <Typography variant='body2' color='text.secondary'>{title}</Typography>
        <Typography variant='caption' color='text.disabled'>{subtitle}</Typography>
      </div>
    </CardContent>
  </Card>
)

interface Props {
  totalQPs: number
  totalBatches: number
  activeBatches: number
  completedBatches: number
  totalStudents: number
  assessedStudents: number
  pendingStudents: number
  passedStudents: number
  failedStudents: number
  passRate: number
  trainingPartners: number
  certificateCount: number
}

const SscStatsCards = (p: Props) => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard title='Total Batches' stats={p.totalBatches} subtitle={`${p.activeBatches} active · ${p.completedBatches} completed`} avatarIcon='tabler-book' avatarColor='info' />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard title='Total Students' stats={p.totalStudents} subtitle={`${p.assessedStudents} assessed · ${p.pendingStudents} pending`} avatarIcon='tabler-users' avatarColor='success' />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard title='Pass Rate' stats={`${p.passRate}%`} subtitle={`${p.passedStudents} passed · ${p.failedStudents} failed`} avatarIcon='tabler-certificate' avatarColor='primary' />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard title='Total QPs' stats={p.totalQPs} subtitle='Qualification packs' avatarIcon='tabler-tool' avatarColor='warning' />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard title='Training Partners' stats={p.trainingPartners} subtitle='Associated with QPs' avatarIcon='tabler-building' avatarColor='warning' />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard title='Certificates' stats={p.certificateCount} subtitle='Students certified' avatarIcon='tabler-certificate-2' avatarColor='info' />
      </Grid>
    </Grid>
  )
}

export default SscStatsCards