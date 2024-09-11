"use client"

// Component Imports
import { useEffect, useState } from 'react'

import { Grid } from '@mui/material';

import UserList from '@views/agency/users/list'

import SkeletonTable from '@/components/skeleton/SkeletonTable';
import SkeletonListCards from '@/components/skeleton/SkeletonListCards';


const UserListApp = () => {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Vars
  const getData = async () => {
    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`)

    if (!res.ok) {
      throw new Error('Failed to fetch userData')
    }

    const usersData = await res.json();

    setData(usersData);
    setLoading(false);
  }

  useEffect(() => {

    getData()
  }, []);

  // const updateUsersList = () => {
  //   getData();
  // };

  if(!loading){
    return <UserList userData={data} />
  }else{
    return (
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <SkeletonListCards />
        </Grid>
        <Grid item xs={12}>
          <SkeletonTable />
        </Grid>
      </Grid>
    );
  }
}

export default UserListApp
