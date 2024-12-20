// Next Imports
import { NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function GET(req: Request) {

  const url = new URL(await req.url);
  const id = url.searchParams.get('studentId');

  const session = await getServerSession(authOptions);

  // const id = session?.user.id;
  const sessionId = session?.user.sessionId;

  // const agencyId = Number(session?.user?.agency_id);

  // const imageExist = await prisma.students.findUnique({
  //   where: {
  //     id: Number(id),
  //     auth_image: {
  //       not: null
  //     }
  //   },
  //   select: {
  //     id: true,
  //     auth_image: true
  //   }
  // })

  console.log("id and sessionId", session, id, sessionId)

  const imageExist = await prisma.log_sessions.findUnique({
    where: {
      id: Number(id),
      unique_session_id: sessionId
    },
    select: {
      id: true,
      auth_image: true
    }
  })

  console.log("student image exist?: ", imageExist);

  if(imageExist?.auth_image){

    return NextResponse.json({isImageExist: !!imageExist.auth_image});
  }

  return NextResponse.json({isImageExist: !!imageExist?.auth_image});
}

export async function POST(req: Request){

  const {capturedImage} = await req.json();

  const session = await getServerSession(authOptions);
  const id = Number(session?.user?.id);
  const sessionId = session?.user.sessionId;

  const log = await prisma.log_sessions.findFirst({
    where: {
      user_id: id,
      unique_session_id: sessionId
    },
    select: {
      id: true
    }
  })

  const res = await prisma.log_sessions.update({
    where: {
      id: log?.id,
      user_id: id,
      unique_session_id: sessionId
    },
    data: {
      auth_image: capturedImage
    }
  })

  if(res){
    return NextResponse.json({message: 'Student Auth Image Added Successfully!'})
  }else{
    return NextResponse.json({message: 'Student Image not authenticated!'}, {status: 500})
  }

}
