// Component Imports
// import UserList from '@views/apps/user/list'

"use client"

import { useEffect, useState } from "react"

import UserList from "@/views/super-admin/agency/list"

const UserListApp = () => {

  const[user, setUser] = useState([])

  useEffect(() => {
    const getData = async () => {
      // Vars
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agency`)

      if (!res.ok) {
        throw new Error('Failed to fetch userData')
      }

      const userData = await res.json();

      setUser(userData);

      // return res.json()
    }

    getData()
  }, []);

  // Vars

  // const data = await getData()

  return (<UserList userData={user} />)
}

export default UserListApp
