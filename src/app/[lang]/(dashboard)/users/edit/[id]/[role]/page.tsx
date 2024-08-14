"use client"

import { useEffect, useState } from 'react'

import SkeletonForm from '@/components/skeleton/SkeletonForm';

import type { UsersType } from '@/types/users/usersType';

import AssessorForm from '@/views/agency/users/forms/AssessorForm';

import TPForm from '@/views/agency/users/forms/TPForm';

// Component Imports


const UserEdit = ({ params }: { params: { id: string, role: string } }) => {

  const [data, setData] = useState<UsersType | null>(null);

  // Vars
  const getData = async () => {
    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${params.id}`)

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

  if(data){

    if(data?.role.id === 1){
      return <AssessorForm />
    }else if(data?.role.id === 2){
      return <TPForm id={Number(params.id)} />
    }
  }else{
    return <SkeletonForm />
  }

}

export default UserEdit
