"use client"

// Component Imports
import { useEffect, useState } from 'react'

import UnassignedBatchesList from '@/views/batches/unassigned'

import SkeletonTable from '@/components/skeleton/SkeletonTable'

import type { UsersType } from '@/types/users/usersType'

// import UserList from '@views/apps/user/list'


const UserListApp = () => {

  const [data, setUnassignedBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assessorData, setAssessorsData] = useState<UsersType[]>([]);

  const getData = async () => {
    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/batches`)

    if (!res.ok) {
      throw new Error('Failed to fetch userData')
    }

    const batchData = await res.json();

    const unassignedBatches = batchData.filter((batch: any) => batch.assessor_id === null);

    setUnassignedBatches(unassignedBatches);
    setLoading(false);
  }

  const getAssessors = async () => {
    const allAssessors = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assessor`).then(function (response) { return response.json() });

    setAssessorsData(allAssessors);

  }


  // Vars
  // const data = await getData()

  useEffect(() => {

    getAssessors()
    getData()
  }, []);

  const updateBatchList = () => {
    getData();
  };


  // const data: batches[] = [];

  if(!loading){
    return <UnassignedBatchesList tableData={data} assessorData={assessorData} updateBatchList={updateBatchList}/>
  }else{
    return <SkeletonTable />
  }
}

export default UserListApp
