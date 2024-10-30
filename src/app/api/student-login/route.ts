// Next Imports
import { NextResponse } from 'next/server'

import {compare} from 'bcrypt'

import prisma from '@/libs/prisma';

import type { StudentTable } from './student';


type ResponseUser = Omit<StudentTable, 'password'>

export async function POST(req: Request) {

  // Vars
  const { email, password } = await req.json()

  const rows = await prisma.students.findUnique({
    where: {
      candidate_id : email
      
    }
  })

  let response: null | ResponseUser = null

  if( rows ){

    const isPasswordValid = await compare(password, rows.password || '');


    if (isPasswordValid) {

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...filteredUserData } = rows

      response = {
        ...filteredUserData
      }

      return NextResponse.json(response)

    } else {

      // We return 401 status code and error message if user is not found
      return NextResponse.json(
        {
          // We create object here to separate each error message for each field in case of multiple errors
          message: ['Candidate ID or Password is invalid']
        },
        {
          status: 401,
          statusText: 'Unauthorized Access'
        }
      )
    }
  } else {

    // We return 401 status code and error message if user is not found
    return NextResponse.json(
      {

        // We create object here to separate each error message for each field in case of multiple errors
        message: ['Candidate ID or Password is invalid']
      },
      {
        status: 401,
        statusText: 'Unauthorized Access'
      }
    )
  }

}
