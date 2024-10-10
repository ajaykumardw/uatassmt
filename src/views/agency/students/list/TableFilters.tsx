// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'

// Type Imports
import type { batches, students } from '@prisma/client'

// import type { UsersType } from '@/types/apps/userTypes'

// Component Imports
import { Button, CircularProgress } from '@mui/material'

import CustomTextField from '@core/components/mui/TextField'

import type { SSCType } from '@/types/sectorskills/sscType'

import type { QPType } from '@/types/qualification-pack/qpType'

import { removeDuplicates } from '@/utils/removeDuplicates'

const TableFilters = ({ setData, onUpdateStudent }: { setData: any, onUpdateStudent: any }) => {
  // States
  // const [role, setRole] = useState<users['role_id']>(-1)

  const [sscId, setSSCId] = useState<number>(-1);
  const [qpId, setQPId] = useState<number>(-1);
  const [batchId, setBatchId] = useState<number>(-1);
  const [sscData, setSSCData] = useState<SSCType[]>([])
  const [qpData, setQPData] = useState<QPType[]>([]);
  const [batchData, setBatchData] = useState<batches[]>([]);
  const [tableData, setTableData] = useState<students[]>([]);
  const [searchBy, setSearchBy] = useState<string>('');
  const [searchValue, setSearchValue] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);


  // const [plan, setPlan] = useState<UsersType['currentPlan']>('')

  // const [status, setStatus] = useState<users['status']>(-1)



  const getSSCData = async () => {

    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectorskills`)

    if (!res.ok) {
      // setSSCData([])
      // return
      throw new Error('Failed to fetch sector skills council')
    }

    const data = await res.json();

    setSSCData(data);

    // const ssc_id = '1';

    // const gettedSSC = localStorage.getItem("ssc_id");

    // if(gettedSSC != null){
    //   if(sscData.length > 0 && sscId === -1) {

    //     console.log("ssssccccc");
    //     handleSSCChange(gettedSSC);
    //   }
    // }

  }


  const handleSSCChange = async (sscId: string) => {

    setQPId(-1)
    setBatchId(-1);
    setQPData([]);
    setBatchData([]);
    setTableData([]);

    const ssc_id = Number(sscId);

    setSSCId(ssc_id);

    const selectedSSC = sscData.find(ssc => ssc.id === ssc_id);

    if(selectedSSC){
      setQPData(removeDuplicates(selectedSSC.qualification_packs || [], 'id'))
    }else{
      setQPData([]);
    }

    localStorage.removeItem("ssc_id");

    // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/batches`).then(function (response) { return response.json() })



    // setBatches(nosData);

  }

  useEffect(() => {

    const gettedSSC = localStorage.getItem("ssc_id");
    const gettedQP = localStorage.getItem("qp_id");
    const gettedBatch = localStorage.getItem("batch_id");

    if(gettedSSC != null){
      if(sscData.length > 0 && sscId === -1){
        handleSSCChange(gettedSSC);
      }
    }

    if(gettedQP != null){
      if(qpData.length > 0 && qpId === -1){
        handleQPChange('1');
      }
    }

    if(gettedBatch != null){
      if(batchData.length > 0 && batchId === -1){
        handleBatchChange('1');
      }
    }
  }, [sscData, qpData, batchData])

  // useEffect(() => {
  // }, [qpData])

  // useEffect(() => {
  // }, [batchData])

  const handleQPChange = async (qpId: string) => {

    setBatchId(-1)
    setBatchData([]);
    setTableData([]);

    const qp_id = Number(qpId);

    setQPId(qp_id);

    // const selectedSSC = sscData.find(ssc => ssc.id === ssc_id);

    if(qpId) {

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/batches?qpId=${qp_id}`).then(function (response) { return response.json() })

      setBatchData(res);
    }else{

      setBatchData([]);
    }

    localStorage.removeItem("qp_id");

    // setBatches(nosData);

  }

  const updateStudentList = async () => {
    // alert("hi from update student table filter component");
    if(batchId !== -1){
      handleBatchChange(batchId.toString());
    }else if(searchValue !== ''){
      handleSearchFilter();
    }
  }

  useEffect(() => {

    if(onUpdateStudent === true){
      updateStudentList()
    }

  },[onUpdateStudent])

  const handleBatchChange = async (batch: string) => {

    // setBatchId(-1)
    // setBatchData([]);
    setTableData([]);

    setSearchBy('');
    setSearchValue('');

    const batch_id = Number(batch);

    setBatchId(batch_id);

    // const selectedSSC = sscData.find(ssc => ssc.id === ssc_id);

    if(batch && batch_id !== -1) {

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/batches/${batch_id}`)

      if(res.ok){

        const data = await res.json();

        setTableData(data.students);

      }else{

        setTableData([]);
      }
    }else{
      setTableData([]);
    }

    localStorage.removeItem("batch_id");

  }

  const handleSearchFilter = async () => {

    if(searchBy && searchValue){

      setLoading(true);

      setBatchId(-1);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students?searchBy=${searchBy}&searchValue=${searchValue}`);

      if(!res.ok){

        setTableData([])

      }else{

        const resData = await res.json();

        setTableData(resData);
      }

      setLoading(false);
    }

  }

  useEffect(() => {
    // const filteredData = tableData?.filter(user => {
    //   // if (role !== -1 && user.role_id !== role) return false

    //   // if (plan && user.currentPlan !== plan) return false
    //   // if (status && user.status !== status) return false

    //   // if (status !== -1 && user.status !== status) return false;

    //   return true
    // })

    setData(tableData)
    getSSCData();
  }, [ tableData, setData])

  return (
    <CardContent>
      <Grid container spacing={6}>
        <Grid item xs={12} sm={4}>
          <CustomTextField
            select
            fullWidth
            id='select-ssc'
            value={sscId}
            onChange={e => handleSSCChange(e.target.value)}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value='-1'>Select SSC</MenuItem>
            {sscData.map((ssc, index) => (
              <MenuItem key={index} value={ssc.id.toString()}>{ssc.ssc_name}</MenuItem>
            ))}
            {/* <MenuItem value='1'>Assessor</MenuItem>
            <MenuItem value='2'>TP</MenuItem> */}
          </CustomTextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <CustomTextField
            select
            fullWidth
            id='select-qp'
            value={qpId}
            onChange={e => handleQPChange(e.target.value)}
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
        <Grid item xs={12} sm={4}>
          <CustomTextField
            select
            fullWidth
            id='select-batch'
            value={batchId}
            onChange={e => handleBatchChange(e.target.value)}
            SelectProps={{ displayEmpty: true }}
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
        <Grid item xs={12} xl={2} sm={4}>
          <CustomTextField
            select
            fullWidth
            id='select-search'
            value={searchBy}
            onChange={e => {setSearchBy(e.target.value); setSearchValue(''); setError('')}}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value=''>Select Search By</MenuItem>
            <MenuItem value='candidate_id'>Candidate ID</MenuItem>
            <MenuItem value='phone_number'>Phone Number</MenuItem>
          </CustomTextField>
        </Grid>
        <Grid item xs={12} xl={2} sm={4}>
          <div className="flex items-start gap-4">
            <CustomTextField
              fullWidth
              id='select-search'
              value={searchValue}
              disabled={searchBy === ''}
              error={!!error}
              placeholder={searchBy === 'candidate_id' ? 'Candidate ID' : (searchBy === 'phone_number' ? 'Phone Number' : '')}
              onChange={e => {e.target.value.trim().length > 60 ? setError('Max length is 60 characters.') : (setSearchValue(e.target.value.trim()), setError('')) }}
              helperText={error}
            />
            <Button
              variant={searchBy === '' || searchValue === '' ? 'tonal' : 'contained'}
              disabled={searchBy === '' || searchValue === '' || loading}
              color={searchBy === '' || searchValue === '' ? 'secondary' : 'primary'}
              onClick={handleSearchFilter}
              className='is-full sm:is-auto'
              size='small'
            >
              {loading ? <CircularProgress size={24} color='inherit' /> : <i className={searchBy === '' || searchValue === '' ? 'tabler-search-off' : 'tabler-search'} /> }
            </Button>
          </div>
        </Grid>
      </Grid>
    </CardContent>
  )
}

export default TableFilters
