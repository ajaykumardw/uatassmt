import fs from 'fs';
import path from 'path';

// Next Imports
import { NextResponse } from 'next/server'

// Data Imports
import { getServerSession } from 'next-auth';

import { getTime } from 'date-fns';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function GET(
  req: Request,
  context: { params: { id: number } }
) {

  const session = await getServerSession(authOptions);
  const agency_id = Number(session?.user?.agency_id)
  const id = Number(context.params.id);

  const sectorSkills = await prisma.sector_skill_councils.findFirst({
    where: {
      id: id,
      agency_id: agency_id
    },
    include: {
      qualification_packs: {
        include: {
          exam_sets: {
            select: {
              id: true,
              set_name: true
            }
          }
        }
      },
      nos: true
    }
  })

  return NextResponse.json(sectorSkills);
}

export async function POST(
  req: Request,
  context: { params: { id: number } }
) {
  const id = Number(context.params.id);

  const formData = await req.formData();

  const body = Object.fromEntries(formData);
  const {sscName, sscCode, username, status, profileImage} = body;

  const profileBlob = profileImage as Blob;
  const profileName = profileImage ? getTime(new Date()) + "_" + (profileImage as File).name : "";

  const sscExist = await prisma.sector_skill_councils.findUnique({
    where: {
      id: id
    }
  })

  if (sscExist) {

    const result = await prisma.sector_skill_councils.update({
      where:{
        id: id
      },
      data: {
        ssc_name: sscName.toString(),
        ssc_code: sscCode.toString(),
        ssc_username: username.toString(),
        status: Number(status),
        ssc_image: profileName ? profileName : sscExist.ssc_image
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

      return NextResponse.json({ message: 'SSC updated successfully!' });
    }else{
      return NextResponse.json({ message: 'SSC not updated' }, { status: 500 });
    }
  } else {
    return NextResponse.json({ message: 'SSC not found' }, { status: 404 });
  }
}
