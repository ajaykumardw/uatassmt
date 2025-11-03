// Next Imports
import { NextResponse } from 'next/server'

// Data Imports
import prisma from '@/libs/prisma';

export async function GET() {

  const state = await prisma.state.findMany({
    where: {
      country_id: 101
    },
    select: {
      state_id: true,
    },
    orderBy: {
      state_id: "asc"
    }
  })

  const stateIds: number[] = state.map(item => item.state_id);

  const data = await prisma.city.findMany({
    where: {
      is_active: true,
      state_id: {
        in: stateIds
      }
    },
    select: {
      city_id: true,
      city_name: true
    },
    orderBy: {
      city_name: "asc"
    }
  })


  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const {stateId, cityName} = await req.json();

  if(!stateId || !cityName) {
    return NextResponse.json({
      status: 'Error',
      message: 'State ID and City Name are required'
    })
  }

  const result = await prisma.city.create({
    data: {
      state_id: Number(stateId),
      city_name: cityName,
      is_active: true
    }
  })

  if(result){
    return NextResponse.json({
      status: 'Success',
      message: 'City created successfully',
      data: result
    })
  }

  return NextResponse.json({
    status: 'Error',
    message: 'City not created'
  })
}
