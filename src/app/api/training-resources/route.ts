import fs from 'fs';
import path from 'path';

import { randomUUID } from "crypto";

import { pipeline } from "stream/promises";

// Next Imports
import { NextResponse } from 'next/server'

// import {hash} from 'bcrypt'

// Data Imports
import { getServerSession } from 'next-auth';

import prisma from '@/libs/prisma';

import { authOptions } from '@/libs/auth';

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
    orderBy: {
      created_at: "desc"
    },
    include: {
      user_training_resources: {
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              role_id: true,
              role: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }
    }
  })

  return NextResponse.json(trainingResources);
}


export async function POST(req: Request) {

  try {

    const formData = await req.formData()

    const resourceName = formData.get('resourceName') as string
    const description = formData.get('description') as string
    const users = formData.get('users') as string
    const file = formData.get('file') as File | null

    const session = await getServerSession(authOptions)

    const createdBy = Number(session?.user?.id)

    const usersArray = users ? JSON.parse(users) : []

    let fileName: string | null = null

    if (file) {

      const fileExt = file?.name.split('.').pop() || ''

      const allowedExt = [
        "jpg",
        "jpeg",
        "png",
        "pdf",
        "doc",
        "docx",
        "xls",
        "xlsx"
      ]

      if (!fileExt || !allowedExt.includes(fileExt)) {

        return NextResponse.json({
          message: "Invalid file type."
        }, {status: 400});

      }

      fileName = file
        ? `${randomUUID()}.${fileExt}`
        : null
    }


    const result = await prisma.training_resources.create({
      data: {
        name: resourceName,
        description,
        file: fileName,
        created_by: createdBy,

        user_training_resources:
          usersArray.length > 0
            ? {
                create: usersArray.map((userId: string) => ({
                  user: {
                    connect: {
                      id: Number(userId)
                    }
                  }
                }))
              }
            : undefined
      }
    })

    if (!result) {
      return NextResponse.json({
        success: false,
        message: 'Training Resource not created.'
      })
    }

    // Folder path
    const uploadDir = path.join(process.cwd(), storageFolders.storage, storageFolders.uploads, storageFolders.agency, storageFolders.trainingResources, result.id.toString());

    await fs.promises.mkdir(uploadDir, { recursive: true })

    // Upload file using pipeline
    if (file && fileName) {
      const filePath = path.join(uploadDir, fileName)

      await pipeline(
        file.stream() as any,
        fs.createWriteStream(filePath)
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Training Resource created successfully.'
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        success: false,
        message: 'Something went wrong.'
      },
      { status: 500 }
    )
  }
}
