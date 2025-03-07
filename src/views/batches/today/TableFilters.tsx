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

import { MenuProps } from '@/configs/customDataConfig'

import type { SSCType } from '@/types/sectorskills/sscType'

import type { QPType } from '@/types/qualification-pack/qpType'

type BatchesWithQP = batches & {qualification_pack: QPType};

const TableFilters = ({ setData, tableData }: { setData: any; tableData?: BatchesWithQP[] }) => {

  const [status, setStatus] = useState<users['status']>(-1)
  const [ssc, setSSC] = useState<number>(-1)
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
    const filteredData = tableData?.filter( (batch) => {

      if (status !== -1 && batch.batch_completed !== status) return false;
      if (ssc !== -1 && batch.qualification_pack.ssc.id !== ssc) return false;

      return true
    })

    setData(filteredData)
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
            label='Select SSC'
            onChange={e => setSSC(parseInt(e.target.value))}
            SelectProps={{ MenuProps, displayEmpty: true }}
          >
            <MenuItem value='-1'>All</MenuItem>
            {sscData.map((ssc, index) => (
              <MenuItem key={index} value={ssc.id.toString()}>
                {ssc.ssc_name}
              </MenuItem>
            ))}
          </CustomTextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <CustomTextField
            select
            fullWidth
            id='select-status'
            label='Select Status'
            value={status}
            onChange={e => setStatus(parseInt(e.target.value))}
            SelectProps={{ MenuProps, displayEmpty: true }}
          >
            <MenuItem value='-1'>All</MenuItem>
            <MenuItem value='0'>Pending</MenuItem>
            <MenuItem value='1'>Completed</MenuItem>
          </CustomTextField>
        </Grid>
      </Grid>
    </CardContent>
  )
}

export default TableFilters
