'use client'

import { useEffect, useState, useCallback } from 'react'

import SkeletonTable from '@/components/skeleton/SkeletonTable'
import SscInvoiceList from '@/views/agency/invoice/ssc/SscInvoiceList'

type SscOption = { id: number; ssc_name: string }

const SscInvoicePage = () => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 10

  const [search, setSearch] = useState('')
  const [sscId, setSscId] = useState('')
  const [sscOptions, setSscOptions] = useState<SscOption[]>([])
  const [paymentStatus, setPaymentStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectorskills`)
      .then(res => res.json())
      .then(list => {
        if (Array.isArray(list)) {
          setSscOptions(list.map((s: any) => ({ id: s.id, ssc_name: s.ssc_name })))
        }
      })
      .catch(() => {})
  }, [])

  const fetchInvoices = useCallback(async (targetPage: number) => {
    setLoading(true)

    try {
      const params = new URLSearchParams()

      params.set('page', String(targetPage))
      params.set('limit', String(limit))
      if (search) params.set('search', search)
      if (sscId) params.set('ssc_id', sscId)
      if (paymentStatus) params.set('payment_status', paymentStatus)
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoice/ssc?${params}`)

      if (!res.ok) throw new Error('Failed to fetch SSC invoices')

      const result = await res.json()

      setData(result.data || [])
      setTotal(result.pagination?.total || 0)
      setPage(targetPage)
    } catch {
      setData([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [limit, search, sscId, paymentStatus, dateFrom, dateTo])

  const handleFilterChange = () => {
    fetchInvoices(1)
  }

  useEffect(() => {
    fetchInvoices(1)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePageChange = (newPage: number) => {
    fetchInvoices(newPage)
  }

  if (loading) return <SkeletonTable />

  return (
    <SscInvoiceList
      data={data}
      updateData={() => fetchInvoices(page)}
      total={total}
      page={page}
      limit={limit}
      onPageChange={handlePageChange}
      search={search}
      onSearchChange={setSearch}
      sscId={sscId}
      onSscIdChange={setSscId}
      sscOptions={sscOptions}
      paymentStatus={paymentStatus}
      onPaymentStatusChange={setPaymentStatus}
      dateFrom={dateFrom}
      onDateFromChange={setDateFrom}
      dateTo={dateTo}
      onDateToChange={setDateTo}
      onFilter={handleFilterChange}
    />
  )
}

export default SscInvoicePage