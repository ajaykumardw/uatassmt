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

// export async function POST(req: Request) {
//   const connection = await connect();
//   // const {data: session} = useSession();
//   // const createdBy = session?.user?.id
//   const result = await connection.execute(`SELECT id, name FROM state`)
//   if(result){
//     return NextResponse.json(result)
//   }
//   return NextResponse.json({data: 'not found'})
// }
