"use client"

// Component Imports
import { useEffect, useState } from 'react'

// import UserList from '@views/agency/users/list'

import TCList from '@/views/training-partner/training-centers/list';


const TCListApp = () => {

  const [data, setData] = useState([]);

  // Vars
  const getData = async () => {
    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tc`)

    if (!res.ok) {
      throw new Error('Failed to fetch userData')
    }

    const usersData = await res.json();

    setData(usersData);
  }

  useEffect(() => {

    getData()
  }, []);

  const updateTCList = () => {
    getData();
  };

  return <TCList userData={data} updateTCList={updateTCList} />
}

export default TCListApp
