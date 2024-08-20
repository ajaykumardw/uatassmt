// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'

// Type Imports
import type { batches, users } from '@prisma/client'

// import type { UsersType } from '@/types/apps/userTypes'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

const TableFilters = ({ setData, tableData }: { setData: any; tableData?: batches[] }) => {
  // States
  // const [role, setRole] = useState<users['role_id']>(-1)

  // const [plan, setPlan] = useState<UsersType['currentPlan']>('')

  const [status, setStatus] = useState<users['status']>(-1)

  useEffect(() => {
    const filteredData = tableData?.filter( () => {

      // if (role !== -1 && user.role_id !== role) return false

      // if (plan && user.currentPlan !== plan) return false
      // if (status && user.status !== status) return false

      // if (status !== -1 && user.status !== status) return false;

      return true
    })

    setData(filteredData)
  }, [status, tableData, setData])

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
        </Grid>
      </Grid>
    </CardContent>
  )
}

export default TableFilters
