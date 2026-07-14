'use client'

import { useEffect, useState } from 'react'

import SkeletonTable from '@/components/skeleton/SkeletonTable'
import SscInvoiceList from '@/views/agency/invoice/ssc/SscInvoiceList'

const SscInvoicePage = () => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInvoices = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoice/ssc`)

      if (!res.ok) throw new Error('Failed to fetch SSC invoices')

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

  return <SscInvoiceList data={data} updateData={fetchInvoices} />
}

export default SscInvoicePage
