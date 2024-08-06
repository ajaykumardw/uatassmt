// Next Imports
import { NextResponse } from 'next/server'

// Data Imports
import prisma from '@/libs/prisma';

export async function POST() {

  const data = await prisma.state.findMany({
    where: {
      country_id: 101,
      is_active: true
    },
    select: {
      state_id: true,
      state_name: true
    },
    orderBy: {
      state_name: "asc"
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
