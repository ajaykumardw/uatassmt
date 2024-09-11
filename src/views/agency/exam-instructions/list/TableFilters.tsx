// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'

// Type Imports
// import type { UsersType } from '@/types/apps/userTypes'

// Component Imports
import type { exam_instructions } from '@prisma/client'

import CustomTextField from '@core/components/mui/TextField'

import type { SSCType } from '@/types/sectorskills/sscType'

const TableFilters = ({ setData, tableData }: { setData: any; tableData?: exam_instructions[] }) => {
  // States
  const [status, setStatus] = useState<exam_instructions['status']>(-1)
  const [ssc, setSSC] = useState<exam_instructions['ssc_id']>(-1)
  const [sscData, setSSCData] = useState<SSCType[]>([])

  const getSSCData = async () => {

    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectorskills`)

    if (!res.ok) {
      throw new Error('Failed to fetch sector skills council')
    }

    const data = await res.json();

    setSSCData(data);

  }

  useEffect(() => {
    const filteredData = tableData?.filter(instruction => {

      if (ssc !== -1 && instruction.ssc_id !== ssc) return false
      if (status !== -1 && instruction.status !== status) return false;

      return true
    })

    setData(filteredData);
    getSSCData();
  }, [status, ssc, tableData, setData])

  return (
    <CardContent>
      <Grid container spacing={6}>
        <Grid item xs={12} sm={4}>
          <CustomTextField
            select
            fullWidth
            id='select-ssc'
            value={ssc}
            onChange={e => setSSC(parseInt(e.target.value))}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value='-1'>Select SSC</MenuItem>
            {sscData.map((ssc, index) => (
              <MenuItem key={index} value={ssc.id.toString()}>{ssc.ssc_name}</MenuItem>
            ))}
          </CustomTextField>
        </Grid>
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
