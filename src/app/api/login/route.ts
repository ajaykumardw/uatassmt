// Next Imports
import { NextResponse } from 'next/server'

import {compare} from 'bcrypt'

import jwt from 'jsonwebtoken';

import prisma from '@/libs/prisma';

import type { UserTable } from './users'


type ResponseUser = Omit<UserTable & { agency_id: number; accessToken: string; refreshToken: string }, 'password'>

export async function POST(req: Request) {

  try {

    // Vars
    const { email, password } = await req.json()

    const rows = await prisma.users.findFirst({
      where: {
        OR: [
          { email: email },
          { user_name : email }
        ]
      }
    })


    let response: null | ResponseUser = null

    if(!rows){
      const sscRow = await prisma.sector_skill_councils.findFirst({
        where: {
          ssc_username: email
        }
      })


      if( sscRow ){
        let response: null | {id: number, ssc_username: string | null, accessToken: string, refreshToken: string} = null

        const isPasswordValid = await compare(password, sscRow.ssc_pwd || '');

        console.log(sscRow, email, password, isPasswordValid);

        if (isPasswordValid) {

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { ssc_pwd: _, ...filteredUserData } = sscRow

          const accessToken = jwt.sign(
            { userId: 1, email },
            process.env.NEXTAUTH_SECRET as string,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION as jwt.SignOptions['expiresIn'] }
          );

          const refreshToken = jwt.sign(
            { userId: 1 },
            process.env.NEXTAUTH_SECRET as string,
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION as jwt.SignOptions['expiresIn'] }
          );

          response = {
            ...filteredUserData,
            accessToken,
            refreshToken
          }

          return NextResponse.json(response)

        } else {

          // We return 401 status code and error message if user is not found
          return NextResponse.json(
            {
              // We create object here to separate each error message for each field in case of multiple errors
              message: ['Email or Password is invalid']
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
            message: ['Email or Password is invalid']
          },
          {
            status: 401,
            statusText: 'Unauthorized Access'
          }
        )
      }

    }


    if( rows ){

      const isPasswordValid = await compare(password, rows.password || '');


      if (isPasswordValid) {

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...filteredUserData } = rows

        const agency_id = rows.is_master ? rows.id : rows.master_id;

        const accessToken = jwt.sign(
          { ...filteredUserData, agency_id },
          process.env.NEXTAUTH_SECRET as string,
          { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION as jwt.SignOptions['expiresIn'] }
        );

        const refreshToken = jwt.sign(
          { userId: 1 },
          process.env.NEXTAUTH_SECRET as string,
          { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION as jwt.SignOptions['expiresIn'] }
        );

        response = {
          ...filteredUserData,
          agency_id,
          accessToken,
          refreshToken
        }

        return NextResponse.json(response)

      } else {

        // We return 401 status code and error message if user is not found
        return NextResponse.json(
          {
            // We create object here to separate each error message for each field in case of multiple errors
            message: ['Email or Password is invalid']
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
          message: ['Email or Password is invalid']
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
        message: [e.message || 'Something went wrong while logging in'],

      },
      {
        status: 500,
        statusText: 'Internal Server Error'
      }
    )
  }

}
