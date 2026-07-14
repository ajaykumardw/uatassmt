'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

import SkeletonForm from '@/components/skeleton/SkeletonForm'
import TpInvoiceDetail from '@/views/agency/invoice/tp/TpInvoiceDetail'

const TpInvoiceDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoice/tp/${id}`)

      if (!res.ok) throw new Error('Failed to fetch invoice')

      const result = await res.json()

      setData(result.data || result)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchInvoice()
  }, [id])

  if (loading) return <SkeletonForm />

  return <TpInvoiceDetail data={data} updateData={fetchInvoice} />
}

export default TpInvoiceDetailPage
