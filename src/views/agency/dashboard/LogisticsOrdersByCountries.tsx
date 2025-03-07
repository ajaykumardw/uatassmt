'use client'

// React Imports
import { Fragment, useEffect, useState } from 'react'
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
import type { batches } from '@prisma/client'

import { isBefore, isToday, isTomorrow } from 'date-fns'

import OptionMenu from '@core/components/option-menu'

import type { QPType } from '@/types/qualification-pack/qpType'

// type TimelineItemData = {
//   name: string
//   address: string
// }

type TimelineItemData = {
  ssc_code: string
  batch_name: string
  batch_size: number
}

// type TimelineData = Record<'sender' | 'receiver', TimelineItemData>
// type TimelineData = Record<'batch', TimelineItemData[]>

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
// const data: Data = {
//   today: [
//     {
//       sender: {
//         name: 'Micheal Hughes',
//         address: '101 Boulder, California (CA), 933130'
//       },
//       receiver: {
//         name: 'Daisy Coleman',
//         address: '939 Orange, California (CA), 910614'
//       }
//     },
//     {
//       sender: {
//         name: 'Glenn Todd',
//         address: '1713 Garnet, California (CA), 939573'
//       },
//       receiver: {
//         name: 'Arthur West',
//         address: '156 Blaze, California (CA), 925878'
//       }
//     }
//   ],
//   tomorrow: [
//     {
//       sender: {
//         name: 'Rose Cole',
//         address: '61 Unions, California (CA), 922523'
//       },
//       receiver: {
//         name: 'Polly Spencer',
//         address: '865 Delta, California (CA), 932830'
//       }
//     },
//     {
//       sender: {
//         name: 'Jerry Wood',
//         address: '37 Marjory, California (CA), 951958'
//       },
//       receiver: {
//         name: 'Sam McCormick',
//         address: '926 Reynolds, California (CA), 910279'
//       }
//     }
//   ],
//   completed: [
//     {
//       sender: {
//         name: 'Alex Walton',
//         address: '78 Judson, California (CA), 956084'
//       },
//       receiver: {
//         name: 'Eula Griffin',
//         address: '56 Bernard, California (CA), 965133'
//       }
//     },
//     {
//       sender: {
//         name: 'Lula Barton',
//         address: '95 Gaylord, California (CA), 991955'
//       },
//       receiver: {
//         name: 'Craig Jacobs',
//         address: '73 Sandy, California (CA), 954566'
//       }
//     }
//   ]
// }

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

// Define the possible categories in the result object
type BatchCategory = 'today' | 'tomorrow' | 'completed';

type BatchesType = batches & {
  qualification_pack: QPType
}

// Define the structure of the result object
interface BatchResult {
  today: { batch_name: string; batch_size: number; ssc_code: string }[];
  tomorrow: { batch_name: string; batch_size: number; ssc_code: string }[];
  completed: { batch_name: string; batch_size: number; ssc_code: string }[];
}

const LogisticsOrdersByCountries = () => {
  // States
  const [value, setValue] = useState<string>('today')
  const [batches, setBatches] = useState<BatchesType[]>([]);
  const [resultData, setResultData] = useState<Data>();

  const handleChange = (event: SyntheticEvent, newValue: string) => {
    setValue(newValue)
  }

  const getBatches = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/batches`)
      if (!res.ok) {
        setBatches([]);
        console.error('Failed to fetch batches data');
      }

      const batchData = await res.json();

      setBatches(batchData);

    } catch (error) {
      console.error("Failed to fetch Batches data with error:", error);
      setBatches([]);
    }
  }

  useEffect(()=>{
    getBatches();
  }, [])

  useEffect(() => {

    if(batches.length > 0){

      // console.log("batches:", batches);

      const today = new Date();
      const tomorrow = new Date();

      tomorrow.setDate(today.getDate() + 1);

      const result: BatchResult = {
        today: [],
        tomorrow: [],
        completed: [],
      };

      batches.forEach((batch) => {
        const startDate = batch.assessment_start_datetime ? batch.assessment_start_datetime : '';
        const endDate = batch.assessment_end_datetime ? batch.assessment_end_datetime : '' ;

        let targetCategory: BatchCategory | null = null;

        // Classify batches based on the start date and end date
        if (isToday(startDate)) {
          targetCategory = "today";
        } else if (isTomorrow(startDate)) {
          targetCategory = "tomorrow";
        } else if (isBefore(endDate, today)) {
          targetCategory = "completed";
        }
        if (targetCategory) {
          result[targetCategory].push({
            batch_name: batch.batch_name ? batch.batch_name : '',
            batch_size: Number(batch.batch_size),
            ssc_code: batch.qualification_pack.ssc.ssc_code,
          });
        }
      });

      setResultData(result);
      // return result;
    }
  }, [batches])

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

        // subheader='62 batches in progress'
        action={<OptionMenu options={['Show all orders', 'Share', 'Refresh']} />}
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
            {resultData ? resultData[value as keyof Data].map((item: TimelineItemData, index: number) => {
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
                    {/* <TimelineItem>
                      <TimelineSeparator>
                        <TimelineDot variant='outlined' className='mlb-0'>
                          <i className='tabler-map-pin text-xl text-primary' />
                        </TimelineDot>
                      </TimelineSeparator>
                      <TimelineContent className='flex flex-col pbe-0 gap-0.5 pbs-0 pis-5'>
                        <Typography variant='body2' className='uppercase' color='primary.main'>
                          Receiver
                        </Typography>
                        <Typography color='text.primary' className='font-medium'>
                          {item.receiver.name}
                        </Typography>
                        <Typography className='line-clamp-1'>{item.receiver.address}</Typography>
                      </TimelineContent>
                    </TimelineItem> */}
                  </Timeline>
                  {index !== data[value as keyof Data].length - 1 && <Divider className='mlb-4 border-dashed' />}
                </Fragment>
              )
            }) : ''}
          </CardContent>
        </TabPanel>
      </TabContext>
    </Card>
  )
}

export default LogisticsOrdersByCountries
