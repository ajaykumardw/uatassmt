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
  enrolled: number
  assessed: number
  passed: number
  failed: number
  pending: number
  serverMode: SystemMode
}

const colors = {
  enrolled: 'var(--mui-palette-primary-main)',
  assessed: 'var(--mui-palette-info-main)',
  pending: 'var(--mui-palette-warning-main)',
  passed: 'var(--mui-palette-success-main)',
  failed: 'var(--mui-palette-error-main)',
}

const ResultDistribution = ({ enrolled, assessed, passed, failed, serverMode }: Props) => {
  const theme = useTheme()
  const { mode } = useColorScheme()
  const _mode = (mode === 'system' ? serverMode : mode) || serverMode
  const textSecondary = rgbaToHex(`rgb(${theme.mainColorChannels[_mode]} / 0.7)`)

  const notAssessed = enrolled - assessed

  const options: ApexOptions = {
    stroke: { width: 0 },
    labels: ['Enrolled', 'Assessed', 'Not Assessed', 'Passed', 'Failed'],
    colors: [colors.enrolled, colors.assessed, colors.pending, colors.passed, colors.failed],
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
              formatter: () => `${enrolled}`,
              color: rgbaToHex(`rgb(${theme.mainColorChannels[_mode]} / 0.9)`),
            },
          },
        },
      },
    },
    responsive: [
      {
        breakpoint: 992,
        options: { chart: { height: 380 }, legend: { position: 'bottom' } },
      },
      {
        breakpoint: 576,
        options: {
          chart: { height: 320 },
          plotOptions: {
            pie: {
              donut: {
                labels: {
                  show: true,
                  name: { fontSize: '1rem' },
                  value: { fontSize: '1rem' },
                  total: { fontSize: '1rem' },
                },
              },
            },
          },
        },
      },
    ],
  }

  return (
    <Card>
      <CardHeader title='Student Results' subheader='Overall distribution' />
      <CardContent>
        <AppReactApexCharts
          type='donut'
          width='100%'
          height={380}
          options={options}
          series={[enrolled, assessed, Math.max(0, notAssessed), passed, failed]}
        />
      </CardContent>
    </Card>
  )
}

export default ResultDistribution
