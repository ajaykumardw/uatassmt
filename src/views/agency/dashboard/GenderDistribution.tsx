'use client'

import dynamic from 'next/dynamic'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { useTheme, useColorScheme } from '@mui/material/styles'

import type { ApexOptions } from 'apexcharts'

import type { SystemMode } from '@core/types'

import { rgbaToHex } from '@/utils/rgbaToHex'

const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

interface Props {
  male: number
  female: number
  serverMode: SystemMode
}

const colors = {
  male: 'var(--mui-palette-info-main)',
  female: 'var(--mui-palette-primary-main)',
}

const GenderDistribution = ({ male, female, serverMode }: Props) => {
  const theme = useTheme()
  const { mode } = useColorScheme()
  const _mode = (mode === 'system' ? serverMode : mode) || serverMode
  const textSecondary = rgbaToHex(`rgb(${theme.mainColorChannels[_mode]} / 0.7)`)
  const total = male + female

  const options: ApexOptions = {
    stroke: { width: 0 },
    labels: ['Male', 'Female'],
    colors: [colors.male, colors.female],
    dataLabels: {
      enabled: true,
      formatter: (val: string) => `${parseInt(val, 10)}%`,
    },
    legend: {
      fontSize: '13px',
      position: 'bottom',
      markers: { offsetX: theme.direction === 'rtl' ? 7 : -4 },
      labels: { colors: textSecondary },
      itemMargin: { horizontal: 9 },
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            name: { fontSize: '1.2rem' },
            value: {
              fontSize: '1.2rem',
              color: textSecondary,
              formatter: (val: string) => `${parseInt(val, 10)}`,
            },
            total: {
              show: true,
              fontSize: '1.2rem',
              label: 'Total Students',
              formatter: () => `${total}`,
              color: rgbaToHex(`rgb(${theme.mainColorChannels[_mode]} / 0.9)`),
            },
          },
        },
      },
    },
    responsive: [
      {
        breakpoint: 992,
        options: { chart: { height: 300 }, legend: { position: 'bottom' } },
      },
    ],
  }

  return (
    <Card>
      <CardHeader title='Gender Distribution' subheader='Male vs Female' />
      <CardContent>
        <AppReactApexCharts type='donut' width='100%' height={300} options={options} series={[male, female]} />
      </CardContent>
    </Card>
  )
}

export default GenderDistribution
