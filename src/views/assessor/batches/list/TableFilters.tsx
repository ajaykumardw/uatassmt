// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'

// Type Imports
import type { batches } from '@prisma/client'

// import type { UsersType } from '@/types/apps/userTypes'

// Component Imports
import { format } from 'date-fns'

import CustomTextField from '@core/components/mui/TextField'

import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

import type { QPType } from '@/types/qualification-pack/qpType'

type BatchesWithQP = batches & {qualification_pack: QPType};

const TableFilters = ({ setData, tableData }: { setData: any; tableData?: BatchesWithQP[] }) => {
  // States

  const [month, setMonth] = useState<Date | null>(null)


  useEffect(() => {
    const filteredData = tableData?.filter( (batch) => {

      if(month && batch.assessment_start_datetime && format(batch.assessment_start_datetime, 'MM-yyyy') !== format(month, 'MM-yyyy')) return false

      return true
    })

    setData(filteredData);
  }, [month, tableData, setData])

  return (
    <CardContent>
      <Grid container spacing={6}>
        <Grid item xs={12} sm={4}>
          <AppReactDatepicker
            selected={month}
            id='month-picker'
            showMonthYearPicker
            dateFormat='MM-yyyy'
            onChange={(date: Date) => setMonth(date)}
            customInput={<CustomTextField label='Select Month' fullWidth />}
          />
        </Grid>
      </Grid>
    </CardContent>
  )
}

export default TableFilters
