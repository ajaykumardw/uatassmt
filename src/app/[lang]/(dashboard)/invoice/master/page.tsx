'use client'

import { useEffect, useState } from 'react'

import SkeletonTable from '@/components/skeleton/SkeletonTable'
import MasterDataPage from '@/views/agency/invoice/master'

const InvoiceMasterPage = () => {
  const [sscData, setSscData] = useState<any[]>([])
  const [assessorData, setAssessorData] = useState<any[]>([])
  const [tpData, setTpData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    setLoading(true)

    try {
      const [sscRes, assessorRes, tpRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoice/master-data`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoice/assessor-amount`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoice/tp-amount`)
      ])

      const sscResult = await sscRes.json()
      const assessorResult = await assessorRes.json()
      const tpResult = await tpRes.json()

      setSscData(sscResult.data || [])
      setAssessorData(assessorResult.data || [])
      setTpData(tpResult.data || [])
    } catch {
      setSscData([])
      setAssessorData([])
      setTpData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  if (loading) return <SkeletonTable />

  return (
    <MasterDataPage
      sscData={sscData}
      assessorData={assessorData}
      tpData={tpData}
      updateData={fetchAll}
    />
  )
}

export default InvoiceMasterPage
