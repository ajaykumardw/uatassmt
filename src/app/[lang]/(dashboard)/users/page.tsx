"use client"

// Component Imports
import { useEffect, useState } from 'react'

import UserList from '@views/agency/users/list'


const UserListApp = () => {

  const [data, setData] = useState([]);

  // Vars
  const getData = async () => {
    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`)

    if (!res.ok) {
      throw new Error('Failed to fetch userData')
    }

    const usersData = await res.json();

    setData(usersData);
  }

  useEffect(() => {

    getData()
  }, []);

  // const updateUsersList = () => {
  //   getData();
  // };

  return <UserList userData={data} />
}

export default UserListApp
