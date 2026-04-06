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

const storageFolders = {
  storage: "storage",
  uploads: "uploads",
  ssc: "ssc",
  agency: "agency",
  users: "users",
  student: "student",
  captured: "captured",
  batches: "batches",
  centerPhoto: "center-photo",
  buildingPhoto: "building-photo",
  trainingResources: "training-resources",
  centerInspection: "center-inspection",
  images: "images",
}

export async function GET() {

  const session = await getServerSession(authOptions);

  const agency_id = Number(session?.user?.agency_id)

  const sectorSkills = await prisma.sector_skill_councils.findMany({
    where: {
      // agency_id: agency_id
      status: 1
    },
    include: {
      qualification_packs: {
        include: {
          ssc: {
            select: {
              id: true,
              ssc_code: true,
              ssc_name: true,
            }
          },
          nos: {
            orderBy: {
              nos_id: 'asc'
            },
            include: {
              pc: {
                orderBy: {
                  pc_id: 'asc'
                },
              }
            }
          },
          exam_sets: {
            where: {
              agency_id: agency_id
            },
            select: {
              id: true,
              set_name: true,
              set_type: true,
              agency_id: true
            }
          }
        }
      },
      nos: true
    },
    orderBy: {
      ssc_name: "asc"
    }
  });

  sectorSkills.forEach(ssc => {
    ssc.qualification_packs.forEach(qp => {
      qp.nos.forEach(nos => {
        nos.pc.sort((a, b) => {
          const numA = parseInt(a.pc_id.replace(/^\D+/g, ''), 10);
          const numB = parseInt(b.pc_id.replace(/^\D+/g, ''), 10);

          return numA - numB;
        });
      })
    })
  });

  return NextResponse.json(sectorSkills);
}

export async function POST(req: NextRequest) {

  const formData = await req.formData();

  const body = Object.fromEntries(formData);
  const { sscName, sscCode, username, password, status, profileImage } = body;

  const duplicates = await prisma.sector_skill_councils.findMany({
    where: {
      OR: [
        { ssc_code: sscCode.toString() },
        { ssc_username: username.toString() }
      ]
    }
  })

  const errors: Record<string, string[]> = {}

  duplicates.forEach((d) => {
    if (d.ssc_code === sscCode) errors.sscCode = ['This SSC Code already exists']
    if (d.ssc_username === username) errors.username = ['This SSC Username already exists']
  })

  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      {
        status: 'Error',
        message: 'Validation failed',
        errors,
      },
      { status: 422 }
    )
  }

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


  if (result) {

    const uploadDir = path.join(process.cwd(), storageFolders.storage, storageFolders.uploads, storageFolders.ssc, result.id.toString());

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

    return NextResponse.json({ message: 'SSC created successfully!' })
  }
  else {

    return NextResponse.json({ message: 'SSC not created!' }, { status: 500 })
  }
}
