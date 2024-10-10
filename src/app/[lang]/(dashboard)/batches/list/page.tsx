"use client"

// Component Imports
import { useEffect, useState } from 'react'

import BatchesList from '@/views/batches/list'
import SkeletonTable from '@/components/skeleton/SkeletonTable'

// import UserList from '@views/apps/user/list'


const UserListApp = () => {

  const [data, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const getData = async () => {
    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/batches`)

    if (!res.ok) {
      throw new Error('Failed to fetch userData')
    }

    const batchData = await res.json();

    setBatches(batchData);
    setLoading(false);
  }

  // Vars
  // const data = await getData()

  useEffect(() => {

    getData()
  }, []);

  const updateBatchList = () => {
    getData();
  };


  // const data: batches[] = [];

  if(!loading){
    return <BatchesList tableData={data} updateBatchList={updateBatchList}/>
  }else{
    return <SkeletonTable />
  }
}

export default UserListApp
