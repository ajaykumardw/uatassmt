'use client'

// React Imports
import { Fragment, useState } from 'react'
import type { SyntheticEvent } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import { styled } from '@mui/material/styles'
import Tab from '@mui/material/Tab'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import Typography from '@mui/material/Typography'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineSeparator from '@mui/lab/TimelineSeparator'

// import TimelineConnector from '@mui/lab/TimelineConnector'
import MuiTimeline from '@mui/lab/Timeline'
import type { TimelineProps } from '@mui/lab/Timeline'

// Components Imports
import OptionMenu from '@core/components/option-menu'

type TimelineItemData = {
  ssc_code: string
  batch_name: string
  batch_size: number
}

type Data = Record<'today' | 'tomorrow' | 'completed', TimelineItemData[]>

// Styled Timeline component
const Timeline = styled(MuiTimeline)<TimelineProps>({
  paddingLeft: 0,
  paddingRight: 0,
  '& .MuiTimelineItem-root': {
    width: '100%',
    '&:before': {
      display: 'none'
    }
  },
  '& .MuiTimelineDot-root': {
    border: 0,
    padding: 0
  }
})

// Vars
const data: Data = {
  today: [
    {
      batch_name: "Advanced Java Programming",
      batch_size: 35,
      ssc_code: "ASCI",
    },
    {
      batch_name: "Graphic Design Essentials",
      batch_size: 28,
      ssc_code: "ESSCI",
    },
    {
      batch_name: "Machine Learning Basics",
      batch_size: 20,
      ssc_code: "ASCI",
    },
    {
      batch_name: "Project Management",
      batch_size: 25,
      ssc_code: "AMUHFSSC",
    },
    {
      batch_name: "Data Analysis with Python",
      batch_size: 30,
      ssc_code: "ESSCI",
    },
  ],
  tomorrow: [
    {
      batch_name: "Introduction to Data Science",
      batch_size: 32,
      ssc_code: "ASCI",
    },
    {
      batch_name: "Frontend Development Bootcamp",
      batch_size: 27,
      ssc_code: "ESSCI",
    },
    {
      batch_name: "Backend Development Basics",
      batch_size: 22,
      ssc_code: "ASCI",
    },
    {
      batch_name: "Cloud Technologies Workshop",
      batch_size: 18,
      ssc_code: "AMUHFSSC",
    },
    {
      batch_name: "AI and Machine Learning",
      batch_size: 26,
      ssc_code: "ESSCI",
    },
  ],
  completed: [
    {
      batch_name: "Introduction to Programming",
      batch_size: 25,
      ssc_code: "ASCI",
    },
    {
      batch_name: "Data Science Fundamentals",
      batch_size: 30,
      ssc_code: "ESSCI",
    },
    {
      batch_name: "Web Development Bootcamp",
      batch_size: 20,
      ssc_code: "ASCI",
    },
    {
      batch_name: "Digital Marketing Basics",
      batch_size: 15,
      ssc_code: "AMUHFSSC",
    },
    {
      batch_name: "Cybersecurity Essentials",
      batch_size: 18,
      ssc_code: "ESSCI",
    },
  ]
}

const BatchesChart = () => {
  // States
  const [value, setValue] = useState<string>('today')

  const handleChange = (event: SyntheticEvent, newValue: string) => {
    setValue(newValue)
  }

  // Define icons and colors based on the tab
  const getIconAndColor = (tab: string) => {
    switch (tab) {
      case 'today':
        return {
          icon: <i className='tabler-alarm text-xl text-primary' />,
          color: 'primary.main',
        };
      case 'tomorrow':
        return {
          icon: <i className='tabler-hourglass-high text-xl text-warning' />, // Change icon for tomorrow
          color: 'warning.main',
        };
      default:
        return {
          icon: <i className='tabler-circle-check text-xl text-success' />,
          color: 'success.main',
        };
    }
  };

  return (
    <Card>
      <CardHeader
        title='Batches'
        action={<OptionMenu options={['Refresh']} />}
        className='pbe-4'
      />
      <TabContext value={value}>
        <TabList variant='fullWidth' onChange={handleChange} aria-label='full width tabs example'>
          <Tab value='today' label='Today' />
          <Tab value='tomorrow' label='Tomorrow' />
          <Tab value='completed' label='Completed' />
        </TabList>
        <TabPanel value={value} className='pbs-0'>
          <CardContent>
            {data[value as keyof Data].map((item: TimelineItemData, index: number) => {
              const { icon, color } = getIconAndColor(value); // Get icon and color based on the current tab

              return (
                <Fragment key={index}>
                  <Timeline>
                    <TimelineItem>
                      <TimelineSeparator>
                        <TimelineDot variant='outlined' className='mlb-0'>
                          {/* <i className='tabler-circle-check text-xl text-success' /> */}
                          {icon}
                        </TimelineDot>
                        {/* <TimelineConnector /> */}
                      </TimelineSeparator>
                      <TimelineContent className='flex flex-col gap-0.5 pbs-0 pis-5 pbe-0'>
                        <Typography variant='body2' className='uppercase' color={color}>
                          Batch Name: {item.batch_name}
                        </Typography>
                        <Typography color='text.primary' className='font-medium'>
                          Batch Size: {item.batch_size}
                        </Typography>
                        <Typography className='line-clamp-1'>SSC Code: {item.ssc_code}</Typography>
                      </TimelineContent>
                    </TimelineItem>
                  </Timeline>
                  {index !== data[value as keyof Data].length - 1 && <Divider className='mlb-4 border-dashed' />}
                </Fragment>
              )
            })}
          </CardContent>
        </TabPanel>
      </TabContext>
    </Card>
  )
}

export default BatchesChart
