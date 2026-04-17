import fs from 'fs';
import path from 'path';

import { randomUUID } from 'crypto';

import { pipeline } from "stream/promises";

// Next Imports
import { NextResponse } from 'next/server'


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

export async function GET(
  req: Request,
  context: { params: { id: number } }
) {

  const session = await getServerSession(authOptions);
  const createdBy = Number(session?.user.id)
  const id = Number(context.params.id);

  const trainingResource = await prisma.training_resources.findFirst({
    where: {
      id: id,
      created_by: createdBy
    },
    include: {
      user_training_resources: true
    }
  })

  return NextResponse.json(trainingResource);
}

// export async function POST(req: Request, context: { params: { id: number } }) {

//   // const { username, email, password, firstName, lastName, phoneNumber, state, city, pinCode, address, panCardNumber, gstNumber } = await req.json()
//   const formData = await req.formData();
//   const body = Object.fromEntries(formData);
//   const { sscId, resourceName, file, description } = body;
//   const id = Number(context.params.id);

//   const session = await getServerSession(authOptions);
//   const createdBy = Number(session?.user.id)

//   const fileBlob = file as Blob;
//   const oldFileName = (file as File).name;
//   const fileName = file ? getTime(new Date()) + "." + (file as File).name.split('.').pop() : "";

//   // const assessorArray = JSON.parse(assessor as string);

//   console.log("file name on edit:", oldFileName)

//   const trainingResourceExist = await prisma.training_resources.findUnique({
//     where: {
//       id: id,
//       created_by: createdBy
//     },
//     include: {
//       user_training_resources: true
//     }
//   })

//   if (trainingResourceExist) {

//     // const newAssessorToConnect = assessorArray.filter((assessorId: any) => {
//     //   return !trainingResourceExist.user_training_resources.some(existingUser => existingUser.user_id === assessorId);
//     // });

//     // // Find nos to disconnect (those present in DB but not in selectedNos)
//     // const assessorToDisconnect = trainingResourceExist.user_training_resources.filter(existingUser => {
//     //   return !assessorArray.includes(existingUser.user_id);
//     // });

//     const result = await prisma.training_resources.update({
//       where: {
//         id: id,
//         created_by: createdBy
//       },
//       data: {
//         ssc_id: Number(sscId),
//         name: resourceName.toString(),
//         description: description.toString(),
//         file: fileName,
//         created_by: createdBy,
//         user_training_resources: {
//           create: {
//             user: {
//               connect: {
//                 id: 2
//               }
//             }
//           },
//           disconnect: {
//             user_id_training_resource_id: {
//               user_id: 2,
//               training_resource_id: 2
//             }
//           },
//         }

//       }
//     });

//     if (result) {

//       const uploadDir = path.join(process.cwd(), storageFolders.storage, storageFolders.uploads, storageFolders.agency, storageFolders.trainingResources, result.id.toString());

//       if (!fs.existsSync(uploadDir)) {
//         try {
//           fs.mkdirSync(uploadDir, { recursive: true });
//         } catch (err) {
//           console.error('Error creating upload directory:', err);
//           throw new Error('Failed to create upload directory');
//         }
//       }

//       if (fileBlob) {
//         const buffer = Buffer.from(await fileBlob.arrayBuffer());

//         fs.writeFileSync(
//           path.resolve(uploadDir, fileName),
//           buffer
//         )
//       }

//       return NextResponse.json({ success: true, message: "Training Resource created successfully." })
//     }

//   } else {
//     return NextResponse.json({ success: false, message: "Training Resource not found." }, { status: 404 })
//   }

//   // if(oldFileName){
//   //   if(trainingResource?.file == oldFileName){
//   //     console.log("same file name is database");
//   //   }
//   // }

//   // console.log("training resources data from api:", body)
//   // console.log("training resources assessor from api:", JSON.parse(assessor as string))

//   // const result = await prisma.training_resources.create({
//   //   data: {
//   //     ssc_id: Number(sscId),
//   //     name: resourceName.toString(),
//   //     description: description.toString(),
//   //     file: fileName,
//   //     created_by: createdBy,
//   //     user_training_resources: assessorArray.length > 0 ? {
//   //       create: assessorArray.map((assessorId: string) => ({
//   //         user: {
//   //           connect: {
//   //             id: assessorId,
//   //           },
//   //         },
//   //       })),
//   //     } : undefined,
//   //   }
//   // });

//   // if(result){

//   //   const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'agency', 'training-resources', result.id.toString());

//   //   if (!fs.existsSync(uploadDir)) {
//   //     try {
//   //       fs.mkdirSync(uploadDir, { recursive: true });
//   //     } catch (err) {
//   //       console.error('Error creating upload directory:', err);
//   //       throw new Error('Failed to create upload directory');
//   //     }
//   //   }

//   //   if(fileBlob){
//   //     const buffer = Buffer.from(await fileBlob.arrayBuffer());

//   //     fs.writeFileSync(
//   //       path.resolve(uploadDir, fileName),
//   //       buffer
//   //     )
//   //   }

//   //   return NextResponse.json({ success: true, message: "Training Resource created successfully." })
//   // }

//   return NextResponse.json({ success: false, message: "Training Resource not created." })
// }


export async function POST(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    const formData = await req.formData()

    const sscId = formData.get('sscId') as string
    const resourceName = formData.get('resourceName') as string
    const description = formData.get('description') as string
    const file = formData.get('file') as File | null
    const users = formData.get('users') as string

    const id = Number(context.params.id)

    const session = await getServerSession(authOptions)
    const createdBy = Number(session?.user?.id)

    if (!createdBy) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const existing = await prisma.training_resources.findFirst({
      where: {
        id,
        created_by: createdBy
      },
      include: {
        user_training_resources: true
      }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Training Resource not found' },
        { status: 404 }
      )
    }

    const usersArray = users ? JSON.parse(users) : []

    // const fileExt = file?.name.split('.').pop()
    // const fileName = file ? `${randomUUID()}.${fileExt}` : existing.file

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

    // ✅ UPDATE DB FIRST
    const result = await prisma.training_resources.update({
      where: { id },
      data: {
        ssc_id: Number(sscId),
        name: resourceName,
        description,
        file: fileName,

        // 🔥 FIXED RELATION HANDLING
        user_training_resources: {
          deleteMany: {}, // remove all old relations

          create: usersArray.map((userId: number) => ({
            user: {
              connect: { id: Number(userId) }
            }
          }))
        }
      }
    })

    // ✅ FILE UPLOAD (ONLY IF NEW FILE EXISTS)
    if (file && fileName && file instanceof File) {
      const uploadDir = path.join(
        process.cwd(),
        storageFolders.storage,
        storageFolders.uploads,
        storageFolders.agency,
        storageFolders.trainingResources,
        result.id.toString()
      )

      await fs.promises.mkdir(uploadDir, { recursive: true })

      const filePath = path.join(uploadDir, fileName)

      await pipeline(
        file.stream() as any,
        fs.createWriteStream(filePath)
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Training Resource updated successfully'
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        success: false,
        message: 'Something went wrong'
      },
      { status: 500 }
    )
  }
}
