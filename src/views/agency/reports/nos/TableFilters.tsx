// React Imports
import { useState, useEffect } from 'react';

// MUI Imports
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

import type { batches, exam_sets, users } from '@prisma/client';

// Type Imports
import type { SSCType } from '@/types/sectorskills/sscType';

import type { QPType } from '@/types/qualification-pack/qpType';

// Component Imports
import CustomTextField from '@core/components/mui/TextField';
import { MenuProps } from '@/configs/customDataConfig';


const TableFilters = ({ setData, setBatch, tableData }: { setData: any, setBatch: any, tableData?: exam_sets[] }) => {
  // States
  const [searchBy, setSearchBy] = useState<string>('');
  const [searchValue, setSearchValue] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [ssc, setSSC] = useState<SSCType['id']>(-1);
  const [qp, setQP] = useState<QPType['id']>(-1);
  const [tp, setTP] = useState<number>(-1);
  const [sscData, setSSCData] = useState<SSCType[]>([]);
  const [qpData, setQPData] = useState<QPType[]>([]);
  const [tpData, setTPData] = useState<users[]>([]);
  const [batchId, setBatchId] = useState<number>(-1);
  const [batchData, setBatchData] = useState<batches[]>([]);

  const getSSCData = async () => {

    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectorskills`)

    if (!res.ok) {

      throw new Error('Failed to fetch sector skills council')
    }

    const data = await res.json();

    setSSCData(data);

  }

  const getTPData = async () => {

    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/training-partner`)

    if (!res.ok) {

      throw new Error('Failed to fetch training partners')
    }

    const data = await res.json();

    setTPData(data);

  }

  const fetchBatches = async (qpId: number, tpId: number, sscIdParam?: number) => {

    setBatchData([]);

    if (qpId > 0 || tpId > 0) {

      const params = new URLSearchParams();

      if (qpId > 0) params.append('qpId', String(qpId));

      if (tpId > 0) params.append('tpId', String(tpId));

      if (sscIdParam && sscIdParam > 0 && searchBy !== '') params.append('sscId', String(sscIdParam));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/batches?${params.toString()}`);

      const data = await res.json();

      setBatchData(Array.isArray(data) ? data : []);

    } else {

      setBatchData([]);

    }

  }

  const fetchBatchByName = async (batchName: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/batches?batchName=${encodeURIComponent(batchName)}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data ? [data] : [];
      const exactMatches = list.filter((b: any) => b.batch_name?.toLowerCase() === batchName.toLowerCase());
      const results = exactMatches;

        if (results.length > 0) {
          setBatchData(results);
          setBatchId(results[0].id);
          setBatch(results[0].id);
        } else {
          setBatchData([]);
          setBatchId(-1);
          setBatch(null);
        }
    } catch (e) {
      setBatchData([]);
      setBatchId(-1);
      setBatch(null);
    }
  }


  // Function to handle SSC change
  const handleSSCChange = async (ssc: string) => {
    setQP(-1);

    setQPData([]);

    setBatchId(-1)
    setBatchData([]);

    const sscId = Number(ssc);

    setSSC(sscId);

    const selectedSSC = sscData.find(ssc => ssc.id === sscId);

    if (selectedSSC) {
      setQPData(selectedSSC.qualification_packs || []);

      // console.log("qp data:", selectedSSC.qualification_packs);

    } else {
      setQPData([]);
    }

    if (searchBy === '') {
      // keep old behavior
    }

    if (searchBy === 'ssc') {
      // keep old behavior - batches loaded via qp/tp changes if needed
    }
  };

  // Function to handle QP change
  const handleQPChange = async (qp: string) => {


    setBatchId(-1)
    setBatchData([]);

    const qpId = Number(qp);

    setQP(qpId);

    if (searchBy === '') {
      fetchBatches(qpId, tp);
      
return;
    }

    if (searchBy === 'tp' || searchBy === 'ssc') {
      fetchBatches(qpId, tp);
      
return;
    }

    fetchBatches(qpId, tp);

  };

  const handleTPChange = async (tp: string) => {

    const tpId = Number(tp);

    setTP(tpId);

    setBatchId(-1);
    setBatchData([]);

    if (searchBy === '') {
      fetchBatches(qp, tpId);
      
return;
    }

    if (searchBy === 'tp') {
      fetchBatches(qp, tpId);
      
return;
    }

    fetchBatches(qp, tpId);

  };

  const handleBatchChange = async (batch: string) => {

    const batch_id = Number(batch);

    setBatchId(batch_id);

    // console.log("batch:", batch);

  }

  const handleSearchByChange = (value: string) => {
    setSearchBy(value);
    setSearchValue('');
    setError('');
    setBatchId(-1);
    setBatchData([]);
    setBatch(null);
    setSSC(-1);
    setQP(-1);
    setQPData([]);
    setTP(-1);
  };

  const handleSearchValueChange = (value: string) => {
    if (value.trim().length > 60) {
      setError('Max length is 60 characters.');
      
return;
    }

    setSearchValue(value.trim());
    setError('');
  };

  const handleSearchClick = async () => {
    if (!searchBy) return;

    if (searchBy === 'batch_id') {
      if (!searchValue) return;
      setLoading(true);
      setBatchId(-1);
      setBatchData([]);
      setBatch(null);
      await fetchBatchByName(searchValue);
      setLoading(false);
      
return;
    }
  };

  // Effect to handle data fetching and setting
  useEffect(() => {

    // const filteredData = tableData?.filter(question => {
    //   if (ssc !== -1 && question.ssc_id !== ssc) return false;
    //   if (qp !== -1 && question.qp_id !== qp) return false;

    //   return ssc !== -1 && qp !== -1;
    // })

    if (searchBy === 'batch_id') {
      if (batchId > 0) {
        setBatch(batchId);
      } else {
        setBatch(null);
      }

      
return;
    }

    if (searchBy === 'ssc' || searchBy === 'tp') {
      if(batchId > 0){
        setBatch(batchId);
      } else {
        setBatch(null);
      }

      
return;
    }

    if(batchId > 0){
      setBatch(batchId);
    } else {
      setBatch(null);
    }

    // setData(filteredData)

  }, [ssc, qp, batchId, setBatch, tableData, setData, searchBy]);

  useEffect(() => {
    getSSCData();
    getTPData();
  }, []);

  return (
    <CardContent>
      <Grid container spacing={6}>
        {/* <Grid item xs={12} sm={4}>
          <CustomTextField
            select
            fullWidth
            id='select-search'
            value={searchBy}
            onChange={(e) => handleSearchByChange(e.target.value)}
            SelectProps={{ MenuProps, displayEmpty: true }}
          >
            <MenuItem value=''>Select Search By</MenuItem>
            <MenuItem value='ssc'>SSC</MenuItem>
            <MenuItem value='tp'>TP</MenuItem>
            <MenuItem value='batch_id'>Batch Name</MenuItem>
          </CustomTextField>
        </Grid> */}

        {searchBy === '' && (
          <>
            <Grid item xs={12} sm={4}>
              <CustomTextField
                select
                fullWidth
                id='select-tp'
                value={tp}
                onChange={(e) => handleTPChange(e.target.value)}
                SelectProps={{ MenuProps, displayEmpty: true }}
              >
                <MenuItem value='-1'>Select Training Partner</MenuItem>
                {tpData.length > 0 ? (
                  tpData.map((tp) => (
                    <MenuItem key={tp.id.toString()} value={tp.id.toString()}>
                      {tp.company_name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No training partner found</MenuItem>
                )}
              </CustomTextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <CustomTextField
                select
                fullWidth
                id='select-ssc'
                value={ssc}
                onChange={(e) => handleSSCChange(e.target.value)}
                SelectProps={{ MenuProps, displayEmpty: true }}
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
                SelectProps={{ MenuProps, displayEmpty: true }}
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
            <Grid item xs={12} sm={4}>
              <CustomTextField
                select
                fullWidth
                id='select-batch'
                value={batchId}
                onChange={e => handleBatchChange(e.target.value)}
                SelectProps={{ MenuProps, displayEmpty: true }}
              >
                <MenuItem value='-1'>Select Batch</MenuItem>
                {batchData.length > 0 ? (
                  batchData.map((batch) => (
                    <MenuItem key={batch.id.toString()} value={batch.id.toString()}>
                      {batch.batch_name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No batch found</MenuItem>
                )}
              </CustomTextField>
            </Grid>
          </>
        )}

        {searchBy === 'ssc' && (
          <>
            <Grid item xs={12} sm={3}>
              <CustomTextField
                select
                fullWidth
                id='search-ssc-select'
                value={ssc}
                onChange={(e) => handleSSCChange(e.target.value)}
                SelectProps={{ MenuProps, displayEmpty: true }}
              >
                <MenuItem value='-1'>Select SSC</MenuItem>
                {sscData.map((ssc, index) => (
                  <MenuItem key={index} value={ssc.id.toString()}>
                    {ssc.ssc_name}
                  </MenuItem>
                ))}
              </CustomTextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <CustomTextField
                select
                fullWidth
                id='select-qp'
                value={qp}
                onChange={(e) => handleQPChange(e.target.value)}
                SelectProps={{ MenuProps, displayEmpty: true }}
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
            <Grid item xs={12} sm={3}>
              <CustomTextField
                select
                fullWidth
                id='select-batch'
                value={batchId}
                onChange={e => handleBatchChange(e.target.value)}
                SelectProps={{ MenuProps, displayEmpty: true }}
              >
                <MenuItem value='-1'>Select Batch</MenuItem>
                {batchData.length > 0 ? (
                  batchData.map((batch) => (
                    <MenuItem key={batch.id.toString()} value={batch.id.toString()}>
                      {batch.batch_name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No batch found</MenuItem>
                )}
              </CustomTextField>
            </Grid>
          </>
        )}

        {searchBy === 'tp' && (
          <>
            <Grid item xs={12} sm={3}>
              <CustomTextField
                select
                fullWidth
                id='search-tp-select'
                value={tp}
                onChange={(e) => handleTPChange(e.target.value)}
                SelectProps={{ MenuProps, displayEmpty: true }}
              >
                <MenuItem value='-1'>Select Training Partner</MenuItem>
                {tpData.length > 0 ? (
                  tpData.map((tp) => (
                    <MenuItem key={tp.id.toString()} value={tp.id.toString()}>
                      {tp.company_name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No training partner found</MenuItem>
                )}
              </CustomTextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <CustomTextField
                select
                fullWidth
                id='select-qp'
                value={qp}
                onChange={(e) => handleQPChange(e.target.value)}
                SelectProps={{ MenuProps, displayEmpty: true }}
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
            <Grid item xs={12} sm={3}>
              <CustomTextField
                select
                fullWidth
                id='select-batch'
                value={batchId}
                onChange={e => handleBatchChange(e.target.value)}
                SelectProps={{ MenuProps, displayEmpty: true }}
              >
                <MenuItem value='-1'>Select Batch</MenuItem>
                {batchData.length > 0 ? (
                  batchData.map((batch) => (
                    <MenuItem key={batch.id.toString()} value={batch.id.toString()}>
                      {batch.batch_name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No batch found</MenuItem>
                )}
              </CustomTextField>
            </Grid>
          </>
        )}

        <Grid item xs={12} sm={4}>
          <CustomTextField
            select
            fullWidth
            id='select-search'
            value={searchBy}
            onChange={(e) => handleSearchByChange(e.target.value)}
            SelectProps={{ MenuProps, displayEmpty: true }}
          >
            <MenuItem value=''>Select Search By</MenuItem>
            <MenuItem value='ssc'>SSC</MenuItem>
            <MenuItem value='tp'>TP</MenuItem>
            <MenuItem value='batch_id'>Batch Name</MenuItem>
          </CustomTextField>
        </Grid>
        {searchBy === 'batch_id' && (
          <>
            <Grid item xs={12} xl={2} sm={4}>
              <CustomTextField
                fullWidth
                id='select-search'
                value={searchValue}
                error={!!error}
                placeholder='Batch Name'
                onChange={(e) => handleSearchValueChange(e.target.value)}
                helperText={error}
              />
            </Grid>
            <Grid item xs={12} xl={2} sm={4}>
              <div className="flex items-start gap-4">
                <Button
                  variant={searchValue === '' ? 'tonal' : 'contained'}
                  disabled={searchValue === '' || loading}
                  color={searchValue === '' ? 'secondary' : 'primary'}
                  onClick={handleSearchClick}
                  className='is-full sm:is-auto'
                  size='small'
                >
                  {loading ? <CircularProgress size={24} color='inherit' /> : <i className={searchValue === '' ? 'tabler-search-off' : 'tabler-search'} /> }
                </Button>
              </div>
            </Grid>
          </>
        )}
      </Grid>
    </CardContent>
  );
};

export default TableFilters
