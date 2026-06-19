'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import { format } from 'date-fns'

import type { Locale } from '@configs/i18n'
import { getLocalizedUrl } from '@/utils/i18n'

interface OverdueBatch {
  id: number
  batch_name: string
  scheme_name: string
  assessment_end: string | null
  totalStudents: number
  center_address: string
}

interface Props {
  batches: OverdueBatch[]
}

const OverdueBatchesCard = ({ batches }: Props) => {
  const { lang: locale } = useParams()

  if (batches.length === 0) return null

  return (
    <Card>
      <CardHeader
        title='Overdue Batches'
        subheader='Assessment ended but results not completed'
        avatar={<i className='tabler-alert-triangle text-2xl text-[var(--mui-palette-error-main)]' />}
      />
      <CardContent className='flex flex-col gap-3'>
        <Alert severity='warning'>
          {batches.length} batch{batches.length > 1 ? 'es' : ''} with overdue results — assessment end date has passed but batch is not marked complete.
        </Alert>
        <div className='flex flex-col gap-2' style={{ maxHeight: 320, overflowY: 'auto' }}>
          {batches.map(b => (
            <div key={b.id} className='flex items-center justify-between p-3 rounded bg-[var(--mui-palette-action-hover)]'>
              <div className='flex flex-col gap-1'>
                <Link
                  href={getLocalizedUrl(`batches/edit/${b.id}`, locale as Locale)}
                  className='text-[var(--mui-palette-primary-main)] no-underline hover:underline font-medium'
                >
                  {b.batch_name}
                </Link>
                <Typography variant='caption' color='text.secondary'>
                  {b.scheme_name} · {b.totalStudents} students
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Ended: {b.assessment_end ? format(new Date(b.assessment_end), 'dd MMM yyyy hh:mm a') : '—'}
                </Typography>
                {b.center_address && (
                  <Typography variant='caption' color='text.secondary' className='truncate max-w-[250px]' title={b.center_address}>
                    {b.center_address}
                  </Typography>
                )}
              </div>
              <Chip label='Overdue' color='error' variant='tonal' size='small' />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default OverdueBatchesCard
