import fs from 'fs';
import path from 'path';

// Next Imports
import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

// Data Imports
import { getServerSession } from 'next-auth';

import { hash } from 'bcrypt';

import { getTime } from 'date-fns';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function GET() {

  const session = await getServerSession(authOptions);
  const agency_id = Number(session?.user?.agency_id) || 412

  const sectorSkills = await prisma.sector_skill_councils.findMany({
    where: {
      agency_id: agency_id
    },
    include: {
      qualification_packs: {
        include: {
          nos: true,
          exam_sets: {
            select: {
              id: true,
              set_name: true
            }
          }
        }
      },
      nos: true
    },
    orderBy:{
      ssc_name: "asc"
    }
  });

  return NextResponse.json(sectorSkills);
}

export async function POST(req: NextRequest) {

  const formData = await req.formData();

  const body = Object.fromEntries(formData);
  const { sscName, sscCode, username, password, status, profileImage } = body;
  const hashPassword = await hash(password as string, 10);

  const session = await getServerSession(authOptions);
  const agencyId = Number(session?.user?.agency_id);
  const createdBy = Number(session?.user.id);

  const profileBlob = profileImage as Blob;
  const profileName = profileImage ? getTime(new Date()) + "_" + (profileImage as File).name : "";

  const result = await prisma.sector_skill_councils.create({
    data: {
      ssc_image: profileName,
      ssc_name: sscName.toString(),
      ssc_code: sscCode.toString(),
      ssc_username: username.toString(),
      ssc_pwd: hashPassword,
      status: Number(status),
      agency_id: agencyId,
      created_by: createdBy
    }
  });


  if(result){

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'ssc', result.id.toString());

    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
      } catch (err) {
        console.error('Error creating upload directory:', err);
        throw new Error('Failed to create upload directory');
      }
    }

    if (profileBlob) {
      const buffer = Buffer.from(await profileBlob.arrayBuffer());

      fs.writeFileSync(
        path.resolve(uploadDir, profileName),
        new Uint8Array(buffer)
      );
    }

    return NextResponse.json({message: 'SSC created successfully!'})
  }
  else{
    
    return NextResponse.json({message: 'SSC not created!'},{status: 500})
  }
}
