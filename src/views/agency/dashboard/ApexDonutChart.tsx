'use client'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Card from '@mui/material/Card'
import { useColorScheme, useTheme } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'

// Third-party Imports
import type { ApexOptions } from 'apexcharts'

// Type Imports
import type { SystemMode } from '@core/types'

// Util Imports
import { rgbaToHex } from '@/utils/rgbaToHex'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

// Vars
const donutColors = {

  // series1: '#fdd835',
  series1: 'var(--mui-palette-warning-main)',

  // series2: '#00d4bd',
  series2: 'var(--mui-palette-success-main)',
  series3: 'var(--mui-palette-primary-main)',

  // series3: '#826bf8',
  // series4: '#32baff',
  series4: 'var(--mui-palette-info-main)',
  
  // series5: '#ffa1a1'
  series5: 'var(--mui-palette-error-main)'
}

const ApexDonutChart = ({ serverMode }: { serverMode: SystemMode }) => {
  // Hooks
  const theme = useTheme()
  const { mode } = useColorScheme()

  // Vars
  const _mode = (mode === 'system' ? serverMode : mode) || serverMode
  const textSecondary = rgbaToHex(`rgb(${theme.mainColorChannels[_mode]} / 0.7)`)

  const options: ApexOptions = {
    stroke: { width: 0 },
    labels: ['Enrolled', 'Assessed', 'Not Assessed', 'Passed', 'Failed'],
    colors: [donutColors.series3, donutColors.series4, donutColors.series1, donutColors.series2, donutColors.series5],
    dataLabels: {
      enabled: true,
      formatter: (val: string) => `${parseInt(val, 10)}%`
    },
    legend: {
      fontSize: '13px',
      position: 'bottom',
      markers: {
        offsetX: theme.direction === 'rtl' ? 7 : -4
      },
      labels: { colors: textSecondary },
      itemMargin: {
        horizontal: 9
      }
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            name: {
              fontSize: '1.2rem'
            },
            value: {
              fontSize: '1.2rem',
              color: textSecondary,
              formatter: (val: string) => `${parseInt(val, 10)}`
            },
            total: {
              show: true,
              fontSize: '1.2rem',
              label: 'Enrolled',
              formatter: () => '37%',
              color: rgbaToHex(`rgb(${theme.mainColorChannels[_mode]} / 0.9)`)
            }
          }
        }
      }
    },
    responsive: [
      {
        breakpoint: 992,
        options: {
          chart: {
            height: 380
          },
          legend: {
            position: 'bottom'
          }
        }
      },
      {
        breakpoint: 576,
        options: {
          chart: {
            height: 320
          },
          plotOptions: {
            pie: {
              donut: {
                labels: {
                  show: true,
                  name: {
                    fontSize: '1rem'
                  },
                  value: {
                    fontSize: '1rem'
                  },
                  total: {
                    fontSize: '1rem'
                  }
                }
              }
            }
          }
        }
      }
    ]
  }

  return (
    <Card>
      <CardHeader title='Enrolled Students' subheader='Last six months' />
      <CardContent>
        <AppReactApexCharts type='donut' width='100%' height={380} options={options} series={[33345, 21736, 11609, 7344, 14392]} />
      </CardContent>
    </Card>
  )
}

export default ApexDonutChart
