"use client"

// MUI Imports
import { type SyntheticEvent, useState } from 'react'

import Grid from '@mui/material/Grid'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'

import { Card, CardContent, Tab, Typography } from '@mui/material'

import TabPanel from '@mui/lab/TabPanel'

// Component Imports
// import DistributedBarChartOrder from '@views/dashboards/crm/DistributedBarChartOrder'
// import LineAreaYearlySalesChart from '@views/dashboards/crm/LineAreaYearlySalesChart'
// import CardStatVertical from '@/components/card-statistics/Vertical'
// import BarChartRevenueGrowth from '@views/dashboards/crm/BarChartRevenueGrowth'

// import { getServerSession } from 'next-auth'

// import AssessorReports from '@/views/dashboards/assessor/AssessorReports'

// import EarningReportsWithTabs from '@views/dashboards/crm/EarningReportsWithTabs'
// import RadarSalesChart from '@views/dashboards/crm/RadarSalesChart'
// import SalesByCountries from '@views/dashboards/crm/SalesByCountries'
// import ProjectStatus from '@views/dashboards/crm/ProjectStatus'
// import ActiveProjects from '@views/dashboards/crm/ActiveProjects'
// import LastTransaction from '@views/dashboards/crm/LastTransaction'
// import ActivityTimeline from '@views/dashboards/crm/ActivityTimeline'

// Server Action Imports
// import { getServerMode } from '@core/utils/serverHelpers'

// import prisma from '@/libs/prisma'


// // import { authOptions } from '@/libs/auth'



const AssessorBatches = () => {

  // const session = await getServerSession(authOptions);

  const [value, setValue] = useState<string>('1')

  const handleChange = (event: SyntheticEvent, newValue: string) => {
    setValue(newValue)
  }

  // const batches = await prisma.batches.findMany({
  //   where: {
  //     assessor_id: Number(session?.user.id)
  //   }
  // });

  // Vars
  // const serverMode = getServerMode()

  return (
    <Grid container spacing={6}>
      {/* <Grid item xs={12} sm={6} md={4} lg={2}>
        <DistributedBarChartOrder />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <LineAreaYearlySalesChart />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <CardStatVertical
          title='Total Profit'
          subtitle='Last Week'
          stats='1.28k'
          avatarColor='error'
          avatarIcon='tabler-credit-card'
          avatarSkin='light'
          avatarSize={44}
          avatarIconSize={28}
          chipText='-12.2%'
          chipColor='error'
          chipVariant='tonal'
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <CardStatVertical
          title='Total Sales'
          subtitle='Last Week'
          stats='24.67k'
          avatarColor='success'
          avatarIcon='tabler-currency-dollar'
          avatarSkin='light'
          avatarSize={44}
          avatarIconSize={28}
          chipText='+24.67%'
          chipColor='success'
          chipVariant='tonal'
        />
      </Grid>
      <Grid item xs={12} md={8} lg={4}>
        <BarChartRevenueGrowth serverMode={serverMode} />
      </Grid> */}
      <Grid item xs={12}>
        <TabContext value={value}>
          <TabList onChange={handleChange} aria-label='icon tabs example'>
            <Tab value='1' label='Upcoming' />
            <Tab value='2' label='Completed' />
            <Tab value='3' label='Not Completed' />
          </TabList>
          <TabPanel value='1'>
            <Card>
              <CardContent>
                <Typography>
                  Upcoming Batches content goes here.
                </Typography>
              </CardContent>
            </Card>
          </TabPanel>
          <TabPanel value='2'>
            <Card>
              <CardContent>
                <Typography>
                  Completed Batches content goes here.
                </Typography>
              </CardContent>
            </Card>
          </TabPanel>
          <TabPanel value='3'>
            <Card>
              <CardContent>
                <Typography>
                  Not Completed Batches content goes here.
                </Typography>
              </CardContent>
            </Card>
          </TabPanel>
        </TabContext>
      </Grid>
      {/* <Grid item xs={12} lg={8}>
        <EarningReportsWithTabs serverMode={serverMode} />
      </Grid>
      <Grid item xs={12} md={6} lg={4}>
        <RadarSalesChart serverMode={serverMode} />
      </Grid>
      <Grid item xs={12} md={6} lg={4}>
        <SalesByCountries />
      </Grid>
      <Grid item xs={12} md={6} lg={4}>
        <ProjectStatus />
      </Grid>
      <Grid item xs={12} md={6} lg={4}>
        <ActiveProjects />
      </Grid>
      <Grid item xs={12} md={6}>
        <LastTransaction serverMode={serverMode} />
      </Grid>
      <Grid item xs={12} md={6}>
        <ActivityTimeline />
      </Grid> */}
    </Grid>
  )
}

export default AssessorBatches
