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

const TableFilters = ({ setData, tableData }: { setData: any; tableData?: batches[] }) => {
  // States
  // const [role, setRole] = useState<users['role_id']>(-1)

  // const [plan, setPlan] = useState<UsersType['currentPlan']>('')

  // const [status, setStatus] = useState<users['status']>(-1)

  const [month, setMonth] = useState<Date>(new Date())

  useEffect(() => {
    const filteredData = tableData?.filter( (batch) => {

      // if (role !== -1 && user.role_id !== role) return false

      // if (plan && user.currentPlan !== plan) return false
      // if (status && user.status !== status) return false

      // if (status !== -1 && user.status !== status) return false;

      if(month && batch.assessment_start_datetime && format(batch.assessment_start_datetime, 'MM-yyyy') !== format(month, 'MM-yyyy')) return false

      return true
    })

    setData(filteredData)
  }, [month, tableData, setData])

  return (
    <CardContent>
      <Grid container spacing={6}>
        {/* <Grid item xs={12} sm={4}>
          <CustomTextField
            select
            fullWidth
            id='select-role'
            value={role}
            onChange={e => setRole(parseInt(e.target.value))}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value='-1'>Select Role</MenuItem>
            <MenuItem value='1'>Assessor</MenuItem>
            <MenuItem value='2'>TP</MenuItem>
          </CustomTextField>
        </Grid> */}
        {/* <Grid item xs={12} sm={4}>
          <CustomTextField
            select
            fullWidth
            id='select-plan'
            value={plan}
            onChange={e => setPlan(e.target.value)}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value=''>Select Plan</MenuItem>
            <MenuItem value='basic'>Basic</MenuItem>
            <MenuItem value='company'>Company</MenuItem>
            <MenuItem value='enterprise'>Enterprise</MenuItem>
            <MenuItem value='team'>Team</MenuItem>
          </CustomTextField>
        </Grid> */}
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
        {/* <Grid item xs={12} sm={4}>
          <CustomTextField
            select
            fullWidth
            id='select-status'
            value={status}
            onChange={e => setStatus(parseInt(e.target.value))}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value='-1'>Select Status</MenuItem>
            <MenuItem value='1'>Active</MenuItem>
            <MenuItem value='0'>Inactive</MenuItem>
          </CustomTextField>
        </Grid> */}
      </Grid>
    </CardContent>
  )
}

export default TableFilters
