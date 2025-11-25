// Next Imports
import { NextResponse } from 'next/server'

import { compare } from 'bcrypt'

import jwt from 'jsonwebtoken';

import prisma from '@/libs/prisma';

import type { UserTable } from './users'

// import { agencyUsersFilePath, sscImagePath } from '@/utils/pathHelpers';

import { agencyUsersFilePath, sscImagePath } from '@/configs/customDataConfig';


type ResponseUser = Omit<UserTable & { agency_id: number; avatar: string | null; accessToken: string; refreshToken: string }, 'password'>

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
        message: 'Email and Password are required'
      }, { status: 400 });
    }

    if (!email) {

      return NextResponse.json({
        status: 'Error',
        statusCode: 400,
        message: 'Email is required'
      }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({
        status: 'Error',
        statusCode: 400,
        message: 'Password is required'
      }, { status: 400 });
    }


    const rows = await prisma.users.findFirst({
      where: {
        OR: [
          { email: email },
          { user_name: email }
        ]
      }
    })


    let response: null | ResponseUser = null

    if (!rows) {
      const sscRow = await prisma.sector_skill_councils.findFirst({
        where: {
          ssc_username: email
        }
      })


      if (sscRow) {
        let response: null | { id: number, ssc_username: string | null, avatar: string | null, accessToken: string, refreshToken: string } = null

        const isPasswordValid = await compare(password, sscRow.ssc_pwd || '');

        console.log(sscRow, email, password, isPasswordValid);

        if (isPasswordValid) {

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { ssc_pwd: _, ...filteredUserData } = sscRow

          const accessToken = jwt.sign(
            { ...filteredUserData },
            process.env.NEXTAUTH_SECRET as string,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION as jwt.SignOptions['expiresIn'] }
          );

          const refreshToken = jwt.sign(
            { ...filteredUserData },
            process.env.NEXTAUTH_SECRET as string,
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION as jwt.SignOptions['expiresIn'] }
          );

          response = {
            ...filteredUserData,
            avatar: filteredUserData.ssc_image ? sscImagePath(filteredUserData.ssc_image) : null,
            accessToken,
            refreshToken
          }

          console.log('response for ssc login:', response);

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
              message: 'Email or Password is invalid'
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
            message: 'Email or Password is invalid'
          },
          {
            status: 401,
            statusText: 'Unauthorized Access'
          }
        )
      }

    }


    if (rows) {

      const isPasswordValid = await compare(password, rows.password || '');


      if (isPasswordValid) {

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...filteredUserData } = rows

        const agency_id = rows.is_master ? rows.id : rows.master_id;

        const accessToken = jwt.sign(
          { ...filteredUserData, agency_id },
          process.env.NEXTAUTH_SECRET as string,
          { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION as jwt.SignOptions['expiresIn'] || '1h' }
        );

        const refreshToken = jwt.sign(
          { ...filteredUserData, agency_id },
          process.env.NEXTAUTH_SECRET as string,
          { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION as jwt.SignOptions['expiresIn'] || '14d' }
        );

        const avatar = filteredUserData.user_type === 'U' && filteredUserData.avatar ? agencyUsersFilePath(filteredUserData.id, filteredUserData.avatar) : null;

        response = {
          ...filteredUserData,
          agency_id,
          avatar: avatar,
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
            message: 'Email or Password is invalid'
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
          message: 'Email or Password is invalid'
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
