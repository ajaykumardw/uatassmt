'use client'

import dynamic from 'next/dynamic'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { useTheme } from '@mui/material/styles'

import type { ApexOptions } from 'apexcharts'

import type { SystemMode } from '@core/types'

const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

interface Props {
  data: { month: string; enrolled: number; assessed: number }[]
  serverMode: SystemMode
}

const MonthlyTrendChart = ({ data }: Props) => {
  const theme = useTheme()

  const options: ApexOptions = {
    chart: {
      type: 'line',
      stacked: false,
      parentHeightOffset: 0,
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    markers: {
      size: 5,
      colors: '#fff',
      strokeColors: 'var(--mui-palette-primary-main)',
      hover: { size: 6 },
      radius: 4,
    },
    stroke: {
      curve: 'smooth',
      width: [0, 3],
      lineCap: 'round',
    },
    legend: {
      show: true,
      position: 'bottom',
      markers: { width: 8, height: 8, offsetY: 1, offsetX: theme.direction === 'rtl' ? 8 : -4 },
      height: 40,
      itemMargin: { horizontal: 10, vertical: 0 },
      fontSize: '15px',
      fontWeight: 400,
      labels: { colors: 'var(--mui-palette-text-primary)' },
      offsetY: 10,
    },
    grid: {
      strokeDashArray: 8,
      borderColor: 'var(--mui-palette-divider)',
    },
    colors: ['var(--mui-palette-warning-main)', 'var(--mui-palette-primary-main)'],
    fill: { opacity: [1, 1] },
    plotOptions: {
      bar: {
        columnWidth: '30%',
        borderRadius: 4,
        borderRadiusApplication: 'end',
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: data.map(d => d.month),
      labels: {
        style: {
          colors: 'var(--mui-palette-text-disabled)',
          fontSize: '13px',
          fontWeight: 400,
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      tickAmount: 5,
      labels: {
        style: {
          colors: 'var(--mui-palette-text-disabled)',
          fontSize: '13px',
          fontWeight: 400,
        },
      },
    },
  }

  const series = [
    { name: 'Enrolled', type: 'column', data: data.map(d => d.enrolled) },
    { name: 'Assessed', type: 'line', data: data.map(d => d.assessed) },
  ]

  return (
    <Card>
      <CardHeader title='Monthly Enrollment & Assessment' subheader='Last 12 months' />
      <CardContent>
        <AppReactApexCharts type='line' height={310} width='100%' series={series} options={options} />
      </CardContent>
    </Card>
  )
}

export default MonthlyTrendChart
