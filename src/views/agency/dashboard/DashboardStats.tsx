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
  totalBatches: number
  activeBatches: number
  completedBatches: number
  todayBatches: number
  thisMonthBatches: number
  upcomingBatches: number
  totalStudents: number
  passedStudents: number
  failedStudents: number
  pendingStudents: number
  passRate: number
  assessedStudents: number
  attendanceRate: number
  certificateRate: number
}

const DashboardStats = (p: Props) => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12} sm={6} md={2}>
        <StatCard title='Total Batches' stats={p.totalBatches} subtitle={`${p.activeBatches} Active · ${p.completedBatches} Completed`} avatarIcon='tabler-book' avatarColor='primary' />
      </Grid>
      <Grid item xs={12} sm={6} md={2}>
        <StatCard title='Total Students' stats={p.totalStudents} subtitle={`${p.assessedStudents} Assessed · ${p.pendingStudents} Pending`} avatarIcon='tabler-users' avatarColor='info' />
      </Grid>
      <Grid item xs={12} sm={6} md={2}>
        <StatCard title='Pass Rate' stats={`${p.passRate}%`} subtitle={`${p.passedStudents} Passed · ${p.failedStudents} Failed`} avatarIcon='tabler-certificate' avatarColor='success' />
      </Grid>
      <Grid item xs={12} sm={6} md={2}>
        <StatCard title='Pending Results' stats={p.pendingStudents} subtitle='Students waiting for assessment' avatarIcon='tabler-hourglass' avatarColor='warning' />
      </Grid>
      <Grid item xs={12} sm={6} md={2}>
        <StatCard title='Attendance' stats={`${p.attendanceRate}%`} subtitle='Overall student attendance' avatarIcon='tabler-user-check' avatarColor='success' />
      </Grid>
      <Grid item xs={12} sm={6} md={2}>
        <StatCard title='Certificates' stats={`${p.certificateRate}%`} subtitle='Students with certificates' avatarIcon='tabler-certificate-2' avatarColor='info' />
      </Grid>
      <Grid item xs={12} sm={4}>
        <StatCard title="Today's Assessments" stats={p.todayBatches} subtitle='Batches scheduled for today' avatarIcon='tabler-calendar' avatarColor='primary' />
      </Grid>
      <Grid item xs={12} sm={4}>
        <StatCard title="This Month" stats={p.thisMonthBatches} subtitle='Batches this month' avatarIcon='tabler-calendar-time' avatarColor='info' />
      </Grid>
      <Grid item xs={12} sm={4}>
        <StatCard title='Upcoming' stats={p.upcomingBatches} subtitle='Future assessments' avatarIcon='tabler-calendar-up' avatarColor='success' />
      </Grid>
    </Grid>
  )
}

export default DashboardStats
