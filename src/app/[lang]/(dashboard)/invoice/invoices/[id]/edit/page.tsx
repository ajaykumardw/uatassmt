'use client'

import { useParams } from 'next/navigation'

import InvoiceEdit from '@/views/agency/invoice/invoices/InvoiceEdit'

const InvoiceEditPage = () => {
  const { id } = useParams()

  return <InvoiceEdit invoiceId={Number(id)} />
}

export default InvoiceEditPage
