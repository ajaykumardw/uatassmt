'use client'

import { useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'

type TpInvoice = {
  id: number
  invoice_number: string
  batch_name: string
  scheme_name: string
  tp_name: string
  total_candidates: number
  amount_per_candidate: number
  total_amount: number
  gst_amount: number
  invoice_status: string
  payment_status: string
}

type Props = {
  data: TpInvoice[]
  updateData: () => void
}

const invoiceStatusColors: Record<string, 'default' | 'info'> = {
  draft: 'default',
  shared: 'info'
}

const paymentStatusColors: Record<string, 'warning' | 'success' | 'info'> = {
  pending: 'warning',
  received: 'success',
  partial: 'info'
}

const TpInvoiceList = ({ data, updateData }: Props) => {
  const router = useRouter()

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title='TP Invoices'
            subheader='Manage training partner invoices'
            action={
              <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={() => router.push('/invoice/tp/create')}>
                New Invoice
              </Button>
            }
          />
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Batch</TableCell>
                    <TableCell>Scheme</TableCell>
                    <TableCell>TP</TableCell>
                    <TableCell>Total Candidates</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>GST</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Payment Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align='center'>No invoices found</TableCell>
                    </TableRow>
                  ) : (
                    data.map(row => (
                      <TableRow
                        key={row.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => router.push(`/invoice/tp/${row.id}`)}
                      >
                        <TableCell>
                          <Typography variant='body2' className='font-medium'>{row.invoice_number}</Typography>
                        </TableCell>
                        <TableCell>{row.batch_name}</TableCell>
                        <TableCell>{row.scheme_name}</TableCell>
                        <TableCell>{row.tp_name}</TableCell>
                        <TableCell>{row.total_candidates}</TableCell>
                        <TableCell>{Number(row.amount_per_candidate ?? row.total_amount).toFixed(2)}</TableCell>
                        <TableCell>{Number(row.total_amount).toFixed(2)}</TableCell>
                        <TableCell>{Number(row.gst_amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <Chip
                            variant='tonal'
                            size='small'
                            label={row.invoice_status ? row.invoice_status.charAt(0).toUpperCase() + row.invoice_status.slice(1) : 'Draft'}
                            color={invoiceStatusColors[row.invoice_status] || 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            variant='tonal'
                            size='small'
                            label={row.payment_status ? row.payment_status.charAt(0).toUpperCase() + row.payment_status.slice(1) : 'Pending'}
                            color={paymentStatusColors[row.payment_status] || 'warning'}
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
      </Grid>
    </Grid>
  )
}

export default TpInvoiceList
