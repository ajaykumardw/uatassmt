// Next Imports

import { NextResponse } from 'next/server'

// Data Imports

import prisma from '@/libs/prisma';


export async function GET(
  req: Request,
  { params }: { params: { id: number } }
) {
  const {id} = params;

  const data = await prisma.city.findMany({
    where: {
      is_active: true,
      state_id: Number(id)
    },
    select: {
      city_id: true,
      city_name: true
    },
    orderBy: {
      city_name: 'asc'
    }
  })

  // if(Number(id) === 32 && data.length == 2 ){
  //   console.log("data length", data.length)
  //   return NextResponse.json(data[0])
  // }

  // const resData = data.map(city => ({
  //   city_id: city.city_id,
  //   city_name: city.city_name
  // }))

  return NextResponse.json(data)
}

