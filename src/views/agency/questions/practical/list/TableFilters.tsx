// React Imports
import { useState, useEffect } from 'react';

// MUI Imports
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';

import type { questions } from '@prisma/client';

// Type Imports
import type { SSCType } from '@/types/sectorskills/sscType';

import type { QPType } from '@/types/qualification-pack/qpType';

// Component Imports
import CustomTextField from '@core/components/mui/TextField';

const TableFilters = ({ setData, tableData }: { setData: any, tableData?: questions[] }) => {
  // States
  const [ssc, setSSC] = useState<SSCType['id']>(-1);
  const [qp, setQP] = useState<QPType['id']>(-1);
  const [sscData, setSSCData] = useState<SSCType[]>([]);
  const [qpData, setQPData] = useState<QPType[]>([]);

  const getSSCData = async () => {

    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectorskills`)

    if (!res.ok) {

      throw new Error('Failed to fetch sector skills council')
    }

    const data = await res.json();

    setSSCData(data);

  }


  // Function to handle SSC change
  const handleSSCChange = async (ssc: string) => {
    setQP(-1);

    // setPCID('');

    setQPData([]);

    const sscId = Number(ssc);

    setSSC(sscId);

    const selectedSSC = sscData.find(ssc => ssc.id === sscId);

    if (selectedSSC) {
      setQPData(selectedSSC.qualification_packs || []);
    } else {
      setQPData([]);
    }
  };

  // Function to handle QP change
  const handleQPChange = async (qp: string) => {

    const qpId = Number(qp);

    setQP(qpId);

  };

  // Effect to handle data fetching and setting
  useEffect(() => {
    const filteredData = tableData?.filter(question => {
      if (ssc !== -1 && question.ssc_id !== ssc) return false;
      if (qp !== -1 && question.qp_id !== qp) return false;

      return ssc !== -1 && qp !== -1;
    })

    setData(filteredData)

  }, [ssc, qp, tableData, setData]);

  useEffect(() => {
    getSSCData();
  }, []);

  return (
    <CardContent>
      <Grid container spacing={6}>
        <Grid item xs={12} sm={4}>
          <CustomTextField
            select
            fullWidth
            id='select-ssc'
            value={ssc}
            onChange={(e) => handleSSCChange(e.target.value)}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value='-1'>Select SSC</MenuItem>
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
            id='select-qp'
            value={qp}
            onChange={(e) => handleQPChange(e.target.value)}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value='-1'>Select Qualification Pack</MenuItem>
            {qpData.length > 0 ? (
              qpData.map((qualificationPack) => (
                <MenuItem key={qualificationPack.id.toString()} value={qualificationPack.id.toString()}>
                  {qualificationPack.qualification_pack_name}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>No qualification pack found</MenuItem>
            )}
          </CustomTextField>
        </Grid>
      </Grid>
    </CardContent>
  );
};

export default TableFilters;
