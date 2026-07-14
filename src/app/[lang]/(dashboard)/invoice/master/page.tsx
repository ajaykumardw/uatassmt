'use client'

import { useEffect, useState } from 'react'

import SkeletonTable from '@/components/skeleton/SkeletonTable'
import MasterDataPage from '@/views/agency/invoice/master'

const InvoiceMasterPage = () => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMasterData = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoice/master-data`)

      if (!res.ok) throw new Error('Failed to fetch master data')

      const result = await res.json()

      setData(result.data || [])
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMasterData()
  }, [])

  if (loading) return <SkeletonTable />

  return <MasterDataPage data={data} updateData={fetchMasterData} />
}

export default InvoiceMasterPage
