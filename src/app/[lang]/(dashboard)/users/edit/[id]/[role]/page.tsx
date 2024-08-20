"use client"

import { useEffect, useState } from 'react'

import type { city, state } from '@prisma/client';

import SkeletonForm from '@/components/skeleton/SkeletonForm';

import type { UsersType } from '@/types/users/usersType';

import AssessorForm from '@/views/agency/users/forms/AssessorForm';

import TPForm from '@/views/agency/users/forms/TPForm';

// Component Imports


const UserEdit = ({ params }: { params: { id: string, role: string } }) => {

  const [data, setData] = useState<UsersType | null>(null);
  const [stateData, setStateData] = useState<state[]>([]);
  const [cityData, setCityData] = useState<city[]>([]);

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

  const getStateData = async () => {

    // Vars
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/state`, {method: 'POST', headers: {'Content-Type': 'application/json', }})

    if (!res.ok) {
      throw new Error('Failed to fetch stateData')
    }

    const allStates = await res.json()

    setStateData(allStates)

  }

  const getCityData = async (state: string) => {

    if (state) {
      try {

        const cities = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/city/${state}`).then(function (response) { return response.json() });

        if (cities.length > 0) {

          setCityData(cities)

        } else {

          setCityData([])

        }


      } catch (error) {

        console.error('Error fetching city data:', error);
      }
    } else {
      setCityData([])
    }

  }

  useEffect(() => {

    getData()
    getStateData()
  }, []);

  useEffect(() => {
    if (data?.state_id) {
      getCityData(data.state_id.toString());
    }
  }, [data]);

  // const updateUsersList = () => {
  //   getData();
  // };

  if(data){

    if(data?.role.id === 1){
      return <AssessorForm />
    }else if(data?.role.id === 2){
      if(cityData.length > 0){
        return <TPForm id={Number(params.id)} data={data} stateData={stateData} citiesData={cityData} />
      }else{
        return <SkeletonForm />
      }
    }
  }else{
    return <SkeletonForm />
  }

}

export default UserEdit
