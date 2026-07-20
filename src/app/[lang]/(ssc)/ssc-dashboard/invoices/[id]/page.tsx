'use client'

import { useEffect, useState, useCallback } from 'react'

import { useParams } from 'next/navigation'

import SkeletonTable from '@/components/skeleton/SkeletonTable'
import InvoiceDetail from '@/views/agency/invoice/invoices/InvoiceDetail'

const Page = () => {
  const { id } = useParams()
  const [data, setData] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInvoice = useCallback(async () => {
    setLoading(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${id}`)

      if (!res.ok) throw new Error('Failed to fetch invoice')
      const result = await res.json()

      setData(result.data || null)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchPayments = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments?invoice_id=${id}`)

      if (!res.ok) throw new Error('Failed to fetch payments')
      const result = await res.json()

      setPayments(result.data || [])
    } catch {
      setPayments([])
    }
  }, [id])

  useEffect(() => {
    fetchInvoice()
    fetchPayments()
  }, [fetchInvoice, fetchPayments])

  if (loading) return <SkeletonTable />

  return (
    <InvoiceDetail
      data={data}
      updateData={fetchInvoice}
      payments={payments}
      onRefreshPayments={fetchPayments}
      userRole='ssc'
    />
  )
}

export default Page
