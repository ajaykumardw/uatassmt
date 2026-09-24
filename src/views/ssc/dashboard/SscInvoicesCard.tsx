'use client'

import { useEffect, useState } from 'react'

import { useRouter, useParams } from 'next/navigation'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { format } from 'date-fns'

import { getSscRecentInvoices } from './actions'
import type { SscInvoiceRow } from './actions'

const statusLabels: Record<number, string> = {
  0: 'Draft',
  1: 'Pending',
  2: 'Approved',
  3: 'Rejected',
  4: 'Paid',
  5: 'Partial Paid',
}

const statusColors: Record<number, 'default' | 'warning' | 'info' | 'error' | 'success'> = {
  0: 'default',
  1: 'warning',
  2: 'info',
  3: 'error',
  4: 'success',
  5: 'info',
}

interface Props {
  sscId: number
  initialRows?: SscInvoiceRow[]
}

const SscInvoicesCard = ({ sscId, initialRows }: Props) => {
  const router = useRouter()
  const { lang: locale } = useParams()
  const [rows, setRows] = useState<SscInvoiceRow[]>(initialRows ?? [])

  useEffect(() => {
    getSscRecentInvoices(sscId, 5).then(setRows)
  }, [sscId])

  return (
    <Card className='be-full'>
      <CardHeader
        title='Recent Invoices'
        subheader='Latest invoice activity'
        action={
          <Button
            size='small'
            variant='tonal'
            endIcon={<i className='tabler-arrow-right' />}
            onClick={() => router.push(`/${locale}/ssc-dashboard/invoices`)}
          >
            View All
          </Button>
        }
      />
      <CardContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice #</TableCell>
                <TableCell>Batch</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align='right'>Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align='center'>
                    <Typography color='text.secondary' variant='body2'>
                      No invoices found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(row => (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/${locale}/ssc-dashboard/invoices/${row.id}`)}
                  >
                    <TableCell>
                      <Typography variant='body2' className='font-medium'>
                        {row.invoice_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' className='max-w-[180px] truncate' title={row.batch_name ?? ''}>
                        {row.batch_name || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        {row.assessment_date
                          ? format(new Date(row.assessment_date), 'dd MMM yyyy')
                          : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography variant='body2'>{Number(row.total_amount).toFixed(2)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        variant='tonal'
                        size='small'
                        label={statusLabels[row.status] ?? 'Unknown'}
                        color={statusColors[row.status] ?? 'default'}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  )
}

export default SscInvoicesCard