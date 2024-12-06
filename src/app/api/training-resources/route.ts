import fs from 'fs';
import path from 'path';

// Next Imports
import { NextResponse } from 'next/server'

// import {hash} from 'bcrypt'

// Data Imports
import { getServerSession } from 'next-auth';

import { getTime } from 'date-fns';

import prisma from '@/libs/prisma';

import { authOptions } from '@/libs/auth';

export async function GET() {
  const session = await getServerSession(authOptions);

  // const agency_id = Number(session?.user?.agency_id);

  const createdBy = Number(session?.user.id)

  // const trainingPartners = await prisma.users.findMany({
  //   where: {
  //     master_id: agency_id,
  //     user_type: 'U',
  //     role_id: 2
  //   },
  //   orderBy:{
  //     company_name: "asc"
  //   }
  // });

  const trainingResources = await prisma.training_resources.findMany({
    where: {
      created_by: createdBy
    },
    include: {
      user_training_resources: {
        include: {
          user: true
        }
      }
    }
  })

  return NextResponse.json(trainingResources);
}


export async function POST(req: Request) {

  // return NextResponse.json({success: false, message: "User not created"}, {status: 500})

  // const { username, email, password, firstName, lastName, phoneNumber, state, city, pinCode, address, panCardNumber, gstNumber } = await req.json()
  const formData = await req.formData();
  const body = Object.fromEntries(formData);
  const {sscId, resourceName, file, description, assessor} = body;

  const session = await getServerSession(authOptions);
  const createdBy = Number(session?.user.id)

  const fileBlob = file as Blob;
  const fileName = file ? getTime(new Date())+"."+(file as File).name.split('.').pop() : "";

  const assessorArray = JSON.parse(assessor as string);

  // console.log("training resources data from api:", body)
  // console.log("training resources assessor from api:", JSON.parse(assessor as string))

  const result = await prisma.training_resources.create({
    data: {
      ssc_id: Number(sscId),
      name: resourceName.toString(),
      description: description.toString(),
      file: fileName,
      created_by: createdBy,
      user_training_resources: assessorArray.length > 0 ? {
        create: assessorArray.map((assessorId: string) => ({
          user: {
            connect: {
              id: assessorId,
            },
          },
        })),
      } : undefined,
    }
  });

  if(result){

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'agency', 'training-resources', result.id.toString());

    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
      } catch (err) {
        console.error('Error creating upload directory:', err);
        throw new Error('Failed to create upload directory');
      }
    }

    if(fileBlob){
      const buffer = Buffer.from(await fileBlob.arrayBuffer());

      fs.writeFileSync(
        path.resolve(uploadDir, fileName),
        buffer
      )
    }

    return NextResponse.json({ success: true, message: "Training Resource created successfully." })
  }

  return NextResponse.json({ success: false, message: "Training Resource not created." })
}
