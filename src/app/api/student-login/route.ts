// Next Imports
import { NextResponse } from 'next/server'

import {compare} from 'bcrypt'

import jwt from 'jsonwebtoken';

import prisma from '@/libs/prisma';

import type { StudentTable } from './student';


type ResponseUser = Omit<StudentTable & { accessToken: string; refreshToken: string }, 'password'>

export async function POST(req: Request) {

  try {
    let body;

    try {

      body = await req.json();

    } catch {

      return NextResponse.json(
        {
          status: 'Error',
          statusCode: 400,
          message: 'Invalid JSON'
        },
        { status: 400, statusText: 'Bad Request' }
      );
    }

    // Vars
    const { email, password } = body;

    // Simple checks
    if (!email && !password) {

      return NextResponse.json({
        status: 'Error',
        statusCode: 400,
        message: 'Candidate ID and Password are required'
      }, { status: 400 });
    }

    if (!email) {

      return NextResponse.json({
        status: 'Error',
        statusCode: 400,
        message: 'Candidate ID is required'
      }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({
        status: 'Error',
        statusCode: 400,
        message: 'Password is required'
      }, { status: 400 });
    }

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

        const accessToken = jwt.sign(
          { ...filteredUserData },
          process.env.NEXTAUTH_SECRET as string,
          { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION as jwt.SignOptions['expiresIn'] || '1h' }
        );

        const refreshToken = jwt.sign(
          { ...filteredUserData },
          process.env.NEXTAUTH_SECRET as string,
          { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION as jwt.SignOptions['expiresIn'] || '14d' }
        );

        response = {
          ...filteredUserData,
          accessToken,
          refreshToken
        }

        return NextResponse.json({
          status: 'Success',
          statusCode: 200,
          message: 'Login successful',
          data: response
        })

      } else {

        // We return 401 status code and error message if user is not found
        return NextResponse.json(
          {
            // We create object here to separate each error message for each field in case of multiple errors
            status: 'Error',
            statusCode: 401,
            message: 'Candidate ID or Password is invalid'
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
          status: 'Error',
          statusCode: 401,
          message: 'Candidate ID or Password is invalid'
        },
        {
          status: 401,
          statusText: 'Unauthorized Access'
        }
      )
    }
  } catch (e: any) {
    return NextResponse.json(
      {
        // We create object here to separate each error message for each field in case of multiple errors
        status: 'Error',
        statusCode: 500,
        message: e.message || 'Something went wrong while logging in',

      },
      {
        status: 500,
        statusText: 'Internal Server Error'
      }
    )
  }

}
