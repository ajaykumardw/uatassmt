'use client'

import { useEffect, useState } from 'react'

import SkeletonTable from '@/components/skeleton/SkeletonTable'
import AssessorInvoiceList from '@/views/agency/invoice/assessor/AssessorInvoiceList'

const AssessorInvoicePage = () => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInvoices = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoice/assessor`)

      if (!res.ok) throw new Error('Failed to fetch assessor invoices')

      const result = await res.json()

      setData(result.data || [])
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  if (loading) return <SkeletonTable />

  return <AssessorInvoiceList data={data} updateData={fetchInvoices} />
}

export default AssessorInvoicePage
