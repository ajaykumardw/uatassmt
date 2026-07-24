'use client'

import { useEffect, useState, useCallback } from 'react'

import SkeletonTable from '@/components/skeleton/SkeletonTable'
import InvoicesList from '@/views/agency/invoice/invoices/InvoicesList'

const Page = () => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 10

  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchInvoices = useCallback(async (targetPage: number) => {
    setLoading(true)

    try {
      const params = new URLSearchParams()

      params.set('page', String(targetPage))
      params.set('limit', String(limit))
      if (search) params.set('search', search)
      if (type) params.set('type', type)
      if (status) params.set('status', status)
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices?${params}`)

      if (!res.ok) throw new Error('Failed to fetch invoices')

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
  }, [search, type, status, dateFrom, dateTo])

  const handleFilterChange = () => fetchInvoices(1)

  useEffect(() => { fetchInvoices(1) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePageChange = (newPage: number) => fetchInvoices(newPage)

  if (loading) return <SkeletonTable />

  return (
    <InvoicesList
      data={data}
      updateData={() => fetchInvoices(page)}
      total={total}
      page={page}
      limit={limit}
      onPageChange={handlePageChange}
      search={search}
      onSearchChange={setSearch}
      type={type}
      onTypeChange={setType}
      status={status}
      onStatusChange={setStatus}
      dateFrom={dateFrom}
      onDateFromChange={setDateFrom}
      dateTo={dateTo}
      onDateToChange={setDateTo}
      onFilter={handleFilterChange}
      hideCreate
      detailPath='/training-partner/invoices/'
    />
  )
}

export default Page
