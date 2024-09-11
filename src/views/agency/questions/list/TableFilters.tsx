// React Imports
import { useState, useEffect } from 'react';

// MUI Imports
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';

// Type Imports
import type { NOSType } from '@/types/nos/nosType';
import type { SSCType } from '@/types/sectorskills/sscType';
import type { QPType } from '@/types/qualification-pack/qpType';
import type { QuestionsType } from '@/types/questions/questionsType';
import type { PCType } from '@/types/pc/pcType';

// Component Imports
import CustomTextField from '@core/components/mui/TextField';

// Utility function to remove duplicates based on a specific key
const removeDuplicates = <T, K extends keyof T>(data: T[], key: K): T[] => {
  const seen = new Set();

  return data.filter((item) => {

    const id = item[key];

    return seen.has(id) ? false : seen.add(id);

  });
};

const TableFilters = ({ setPCID, setAllPC, setData, tableData }: { setPCID?: any, setData: any, setAllPC: any, tableData?: SSCType[] }) => {
  // States
  const [ssc, setSSC] = useState<SSCType['id']>(-1);
  const [qp, setQP] = useState<QPType['id']>(-1);
  const [nos, setNOS] = useState<NOSType['id']>(-1);
  const [pc, setPC] = useState<PCType['id']>(-1);
  const [sscData, setSSCData] = useState<SSCType[]>([]);
  const [qpData, setQPData] = useState<QPType[]>([]);
  const [nosData, setNOSData] = useState<NOSType[]>([]);
  const [pcData, setPCData] = useState<PCType[]>([]);

  // Function to fetch data
  const fetchData = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions`);

      if (!res.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await res.json();

      // Remove duplicates from fetched data
      const uniqueData: SSCType[] = removeDuplicates(data, 'id');

      setSSCData(uniqueData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Function to handle SSC change
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
      setQPData(removeDuplicates(selectedSSC.qualification_packs || [], 'id'));
    } else {
      setQPData([]);
    }
  };

  // Function to handle QP change
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

      setNOSData(removeDuplicates(selectedQP.nos || [], 'id'));
    } else {

      setNOSData([]);
    }
  };

  // Function to handle NOS change
  const handleNOSChange = async (nos: string) => {
    setPC(-1);
    setPCID('');

    const nosId = Number(nos);
    
    setNOS(nosId);

    const selectedNOS = nosData.find(nos => nos.id === nosId);

    if (selectedNOS) {
      setPCData(removeDuplicates(selectedNOS.pc || [], 'id'));
    } else {
      setPCData([]);
    }
  };

  // Function to get all questions
  const getAllQuestions = (data?: SSCType[], qualificationPackId?: number, nosId?: number, pcId?: number): QuestionsType[] => {
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

    // Remove duplicates based on question ID
    return removeDuplicates(allQuestions, 'id');
  };

  // Function to get all PC
  const getAllPC = (data?: SSCType[], qualificationPackId?: number, nosId?: number): PCType[] => {
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

    // Remove duplicates based on PC ID
    return removeDuplicates(allPC, 'id');
  };

  // Effect to handle data fetching and setting
  useEffect(() => {
    const updateData = async () => {
      try {
        const questionsData = getAllQuestions(tableData, qp, nos, pc);
        const pcData = getAllPC(tableData, qp, nos);

        setData(questionsData);
        setAllPC(pcData);

        await fetchData(); // Ensure data is fetched and processed correctly
      } catch (error) {
        console.error('Error updating data:', error);
      }
    };

    updateData();
  }, [ssc, qp, nos, pc, tableData, setData, setAllPC]);

  return (
    <CardContent>
      <Grid container spacing={6}>
        <Grid item xs={12} sm={3}>
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
        <Grid item xs={12} sm={3}>
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
        <Grid item xs={12} sm={3}>
          <CustomTextField
            select
            fullWidth
            id='select-nos'
            value={nos}
            onChange={(e) => handleNOSChange(e.target.value)}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value='-1'>Select NOS</MenuItem>
            {nosData.length > 0 ? (
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
            onChange={(e) => {
              setPC(parseInt(e.target.value));
              setPCID(e.target.value !== '-1' ? e.target.value : '');
            }}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value='-1'>Select PC</MenuItem>
            {pcData.length > 0 ? (
              pcData.map((pc) => (
                <MenuItem key={pc.id.toString()} value={pc.id.toString()}>
                  {pc.pc_id}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>No pc found</MenuItem>
            )}
          </CustomTextField>
        </Grid>
      </Grid>
    </CardContent>
  );
};

export default TableFilters;
