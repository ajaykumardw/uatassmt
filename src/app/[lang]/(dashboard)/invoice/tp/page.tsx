'use client'

import { useEffect, useState } from 'react'

import SkeletonTable from '@/components/skeleton/SkeletonTable'
import TpInvoiceList from '@/views/agency/invoice/tp/TpInvoiceList'

const TpInvoicePage = () => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInvoices = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoice/tp`)

      if (!res.ok) throw new Error('Failed to fetch TP invoices')

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

  return <TpInvoiceList data={data} updateData={fetchInvoices} />
}

export default TpInvoicePage
