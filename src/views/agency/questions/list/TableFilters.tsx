// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'

// Type Imports
import type { NOSType } from '@/types/nos/nosType'

import type { SSCType } from '@/types/sectorskills/sscType'

// Component Imports

import CustomTextField from '@core/components/mui/TextField'

import type { QPType } from '@/types/qualification-pack/qpType'

import type { QuestionsType } from '@/types/questions/questionsType'

import type { PCType } from '@/types/pc/pcType'


const TableFilters = ({ setPCID, setAllPC, setData, tableData }: { setPCID?: any, setData: any, setAllPC: any, tableData?: SSCType[] }) => {
  // States

  // const [role, setRole] = useState<UsersType['role']>('')
  // const [plan, setPlan] = useState<UsersType['currentPlan']>('')

  // const [status, setStatus] = useState<NOSType['status']>(-1)

  const [ssc, setSSC] = useState<SSCType['id']>(-1)
  const [qp, setQP] = useState<QPType['id']>(-1)
  const [nos, setNOS] = useState<NOSType['id']>(-1)
  const [pc, setPC] = useState<PCType['id']>(-1)
  const [sscData, setSSCData] = useState<SSCType[]>([])
  const [qpData, setQPData] = useState<QPType[]>([])
  const [nosData, setNOSData] = useState<NOSType[]>([])
  const [pcData, setPCData] = useState<PCType[]>([])



  const getQuestionsData = async () => {
    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions`)

    if (!res.ok) {
      throw new Error('Failed to fetch sector skills council')
    }

    const data = await res.json();

    setSSCData(data);

  }

  const handleSSCChange = async (ssc: string) => {
    setQP(-1);
    setNOS(-1);
    setPC(-1);

    setPCID('');

    setQPData([]);
    setNOSData([]);
    setPCData([]);

    const sscId = Number(ssc);

    setSSC(sscId);

    const selectedSSC = sscData.find(ssc => ssc.id === sscId);

    if (selectedSSC) {

      setQPData(selectedSSC.qualification_packs || []);

    } else {

      setQPData([]);

    }
  }

  const handleQPChange = async (qp: string) => {

    setNOS(-1);
    setPC(-1);

    setPCID('');

    setNOSData([]);
    setPCData([]);
    const qpId = Number(qp);

    setQP(qpId);

    const selectedQP = qpData.find(qp => qp.id === qpId);

    if (selectedQP) {

      setNOSData(selectedQP.nos || []);

    } else {

      setNOSData([]);

    }
  }

  const handleNOSChange = async (nos: string) => {
    setPC(-1);

    setPCID('');

    const nosId = Number(nos);

    setNOS(nosId);

    const selectedNOS = nosData.find(nos => nos.id === nosId);

    if (selectedNOS) {
      setPCData(selectedNOS?.pc || []);
    } else {
      setPCData([]);
    }
  }


  function getAllQuestions(data?: SSCType[], qualificationPackId?: number, nosId?: number, pcId?: number): QuestionsType[] {
    let allQuestions: QuestionsType[] = [];

    data?.forEach(entry => {
        if (entry.qualification_packs && entry.qualification_packs.length > 0) {
            entry.qualification_packs.forEach(pack => {
                if ((qualificationPackId && pack.id === qualificationPackId) && pack.nos && pack.nos.length > 0) {
                  pack.nos.forEach(nos => {
                      if ((!nosId || nosId === -1 || nos.id === nosId) &&
                          nos.pc && nos.pc.length > 0) {
                          nos.pc.forEach(pc => {
                              if ((!pcId || pcId === -1 || pc.id === pcId) &&
                                  pc.questions && pc.questions.length > 0) {
                                  allQuestions = allQuestions.concat(pc.questions);
                              }
                          });
                      }
                  });
                }
            });
        }
    });

    return allQuestions;
  }

  function getAllPC(data?: SSCType[], qualificationPackId?: number, nosId?: number): PCType[] {
    let allPC: PCType[] = [];

    data?.forEach(entry => {
        if (entry.qualification_packs && entry.qualification_packs.length > 0) {
            entry.qualification_packs.forEach(pack => {
                if ((qualificationPackId && pack.id === qualificationPackId) && pack.nos && pack.nos.length > 0) {
                  pack.nos.forEach(nos => {
                      if ((!nosId || nosId === -1 || nos.id === nosId) && nos.pc && nos.pc.length > 0) {
                        allPC = allPC.concat(nos.pc);
                      }
                  });
                }
            });
        }
    });

    return allPC;
  }

  useEffect(() => {
    // const filteredData = tableData?.filter(ssc => {
    //   // if (role && question.role !== role) return false
    //   // if (plan && question.currentPlan !== plan) return false
    //   if (status !== -1 && ssc.status !== status) return false;
    //   // if (ssc !== -1 && question.pc.find(1).id !== ssc) return false;
    //   if (qp !== -1 && ssc.qualification_packs && ssc.qualification_packs.find(item => item.id !== qp)) return false;

    //   return true
    // })


    const questionsData: QuestionsType[] = getAllQuestions(tableData, qp, nos, pc);
    const pcData: PCType[] = getAllPC(tableData, qp, nos);

    setData(questionsData)
    setAllPC(pcData)

    getQuestionsData();

  }, [ssc, qp, nos, pc, tableData, setData, setAllPC])

  return (
    <CardContent>
      <Grid container spacing={6}>
        <Grid item xs={12} sm={3}>
          <CustomTextField
            select
            fullWidth
            id='select-ssc'
            value={ssc}
            onChange={(e) => {
              handleSSCChange(e.target.value); // Call your custom onChange handler
            }}

            // onChange={e => setSSC(parseInt(e.target.value))}

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
        <Grid item xs={12} sm={3}>
          <CustomTextField
            select
            fullWidth
            id='select-qp'
            value={qp}
            onChange={(e) => {
              handleQPChange(e.target.value); // Call your custom onChange handler
            }}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value='-1'>Select Qualification Pack</MenuItem>
            {qpData && qpData.length > 0 ? (
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
            id='select-nos'
            value={nos}
            onChange={(e) => {
              handleNOSChange(e.target.value); // Call your custom onChange handler
            }}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value='-1'>Select NOS</MenuItem>
            {nosData && nosData.length > 0 ? (
              nosData.map((nos) => (
                <MenuItem key={nos.id.toString()} value={nos.id.toString()}>
                  {nos.nos_name}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>No nos found</MenuItem>
            )}
          </CustomTextField>
        </Grid>
        <Grid item xs={12} sm={3}>
          <CustomTextField
            select
            fullWidth
            id='select-pc'
            value={pc}
            onChange={e => {

                setPC(parseInt(e.target.value));

                if (e.target.value !== '-1') {
                  setPCID(e.target.value);
                }else{
                  setPCID('');
                }
              }
            }
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value='-1'>Select PC</MenuItem>
            {pcData && pcData.length > 0 ? (
              pcData.map((pc: PCType) => (
                <MenuItem key={pc.id.toString()} value={pc.id.toString()}>
                  {pc.pc_name}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>No pc found</MenuItem>
            )}
          </CustomTextField>
        </Grid>
        {/* <Grid item xs={12} sm={3}>
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
