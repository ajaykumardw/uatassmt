import fs from 'fs';
import path from 'path';

// Next Imports
import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server';

import jwt, { type JwtPayload } from 'jsonwebtoken';

// Data Imports
// import { getServerSession } from 'next-auth';

import { getTime } from 'date-fns';

import { Prisma } from '@prisma/client';

import prisma from '@/libs/prisma';

// import { authOptions } from '@/libs/auth';

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
}

export async function GET(req: Request, context: { params: { id: number } }) {

  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json({
      status: 'Error',
      statusCode: 401,
      message: "Missing token"
    }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  try {

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET as string) as JwtPayload;

    // const agency_id = Number(decoded?.id);

    if (decoded.user_type !== 'U' && decoded.role_id !== 1) {
      return NextResponse.json({
        status: 'Error',
        statusCode: 403,
        message: 'Forbidden: Insufficient permissions'
      }, { status: 403 });
    }

    const batchId = Number(context.params.id);

    const batch = await prisma.batches.findUnique({
      where: {
        id: batchId,
        assessor: {
          id: Number(decoded.id)
        }
      },
    })

    if (!batch) {
      return NextResponse.json({
        status: 'Error',
        statusCode: 404,
        message: 'Batch not found'
      }, { status: 404 });
    }

    const centerAndBuildingPhoto = await prisma.inspection_media.findMany({
      where: {
        batch: {
          assessor_id: Number(decoded.id)
        },
        category: {
          category_name: {
            in: ['center_photo', 'building_photo']
          }
        }
      },
      include: {
        category: true
      }
    });

    if(centerAndBuildingPhoto.length === 0) {
      return NextResponse.json({
        status: "Error",
        statusCode: 404,
        message: "Center and building photos not found"
      }, { status: 404 });
    }

    const groupedData: Record<string, string> = {};

    const relativePath = `${storageFolders.storage}/${storageFolders.uploads}/${storageFolders.agency}/${storageFolders.batches}`;

    centerAndBuildingPhoto.forEach(item => {
      const categoryName = item.category.category_name;

      groupedData[categoryName] = `${process.env.NEXT_PUBLIC_APP_URL}/${path.posix.join(
        relativePath,
        item.batch_id.toString(),
        categoryName === "center_photo" ? "center-photo" : "building-photo",
        item.file_name
      )}`;
    });

    // const mappedData = centerAndBuildingPhoto.map(item => ({
    //   id: item.id,
    //   category: item.category.category_name,
    //   url: `${process.env.NEXT_PUBLIC_APP_URL}/storage/uploads/agency/batches/${item.batch_id}/${item.category.category_name === 'center_photo' ? 'center-photo' : 'building-photo'}/${item.file_name}`
    // }));

    return NextResponse.json({
      status: "Success",
      statusCode: 200,
      message: "Center and building photos fetched successfully",
      data: groupedData
    });

  } catch (error: any) {

    if (error.name === 'TokenExpiredError') {
      return NextResponse.json({
        status: 'Error',
        statusCode: 401,
        message: 'Token expired',
        error: error
      }, { status: 401 });
    }

    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({
        status: 'Error',
        statusCode: 401,
        message: 'Invalid token',
        error: error
      }, { status: 401 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({
        status: 'Error',
        statusCode: 400,
        message: error.message,
        error: error
      }, { status: 400 });
    }

    // Fallback for any other server-side errors

    console.error('Server Error:', error);

    return NextResponse.json({
      status: 'Error',
      statusCode: 500,
      message: 'Internal server error',
      error: error
    }, { status: 500 });
  }

}

const centerAndBuildingPhotoSchema = {
  center_photo: {
    type: 'file',
    required: true,
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'],
  },
  building_photo: {
    type: 'file',
    required: true,
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'],
  },
};


export async function POST(req: NextRequest, context: { params: { id: number } }) {

  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json({
      status: 'Error',
      statusCode: 401,
      message: "Missing token"
    }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  try {

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET as string) as JwtPayload;

    // const agency_id = Number(decoded?.id);

    if (decoded.user_type !== 'U' && decoded.role_id !== 1) {
      return NextResponse.json({
        status: 'Error',
        statusCode: 403,
        message: 'Forbidden: Insufficient permissions'
      }, { status: 403 });
    }

    const formData = await req.formData();

    const validator = (data: FormData, schema: any) => {
      const errors: string[] = [];

      for (const field in schema) {
        const rules = schema[field];
        const value = data.get(field);

        if (rules.required && (value === null || value === undefined || value === '')) {
          errors.push(`${field} is required.`);
          continue;
        }

        if (rules.type === 'file' && value instanceof File) {
          if (rules.mimeTypes && !rules.mimeTypes.includes(value.type)) {
            errors.push(`${field} must be of type: ${rules.mimeTypes.join(', ')}.`);
          }
        }
      }

      return errors;
    };

    const validationErrors = validator(formData, centerAndBuildingPhotoSchema);

    if (validationErrors.length > 0) {
      return NextResponse.json({
        status: 'Error',
        statusCode: 400,
        message: 'Validation failed',
        errors: validationErrors
      }, { status: 400 });
    }

    const body = Object.fromEntries(formData);

    const id = Number(context.params.id);

    const batch = await prisma.batches.findUnique({
      where: {
        id: id,
        assessor: {
          id: Number(decoded.id)
        }
      },
    })

    if (!batch) {
      return NextResponse.json({
        status: 'Error',
        statusCode: 404,
        message: 'Batch not found'
      }, { status: 404 });
    }

    if (batch) {

      const {
        center_photo,
        building_photo,
      } = body;

      // ✅ Check if both are missing
      if (!center_photo && !building_photo) {
        return NextResponse.json({
          status: 'Error',
          statusCode: 400,
          message: 'No photos provided for upload.',
        }, { status: 400 });
      }

      // ✅ Check if center photo missing
      if (!center_photo) {
        return NextResponse.json({
          status: 'Error',
          statusCode: 400,
          message: 'Center photo is required.',
        }, { status: 400 });
      }

      // ✅ Check if building photo missing
      if (!building_photo) {
        return NextResponse.json({
          status: 'Error',
          statusCode: 400,
          message: 'Building photo is required.',
        }, { status: 400 });
      }

      // ✅ Check if files are actually File objects
      if (!(center_photo instanceof File)) {
        return NextResponse.json({
          status: 'Error',
          statusCode: 400,
          message: 'Invalid center photo file.',
        }, { status: 400 });
      }

      if (!(building_photo instanceof File)) {
        return NextResponse.json({
          status: 'Error',
          statusCode: 400,
          message: 'Invalid building photo file.',
        }, { status: 400 });
      }

      // ✅ Allowed MIME types (only image formats)
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];

      if (!allowedMimeTypes.includes(center_photo.type)) {
        return NextResponse.json({
          status: 'Error',
          statusCode: 400,
          message: 'Center photo must be an image (jpeg, png, webp, jpg, gif).',
        }, { status: 400 });
      }

      if (!allowedMimeTypes.includes(building_photo.type)) {
        return NextResponse.json({
          status: 'Error',
          statusCode: 400,
          message: 'Building photo must be an image (jpeg, png, webp, jpg, gif).',
        }, { status: 400 });
      }

      const centerPhotoBlob = center_photo as Blob;
      const centerPhotoName = center_photo ? getTime(new Date()) + "_" + (center_photo as File).name : "";

      const buildingPhotoBlob = building_photo as Blob;
      const buildingPhotoName = building_photo ? getTime(new Date()) + "_" + (building_photo as File).name : "";

      // const session = await getServerSession(authOptions);
      // const agency_id = Number(session?.user?.agency_id)
      // const createdBy = Number(session?.user.id)


      const uploadDirBuilding = path.join(process.cwd(), storageFolders.storage, storageFolders.uploads, storageFolders.agency, storageFolders.batches, id.toString(), storageFolders.buildingPhoto);
      const uploadDirCenter = path.join(process.cwd(), storageFolders.storage, storageFolders.uploads, storageFolders.agency, storageFolders.batches, id.toString(), storageFolders.centerPhoto);

      if (!fs.existsSync(uploadDirBuilding)) {
        try {
          fs.mkdirSync(uploadDirBuilding, { recursive: true });
        } catch (err) {
          console.error('Error creating upload directory:', err);
          throw new Error('Failed to create upload directory');
        }
      }

      if (!fs.existsSync(uploadDirCenter)) {
        try {
          fs.mkdirSync(uploadDirCenter, { recursive: true });
        } catch (err) {
          console.error('Error creating upload directory:', err);
          throw new Error('Failed to create upload directory');
        }
      }

      if (centerPhotoBlob) {
        const buffer = Buffer.from(await centerPhotoBlob.arrayBuffer());

        fs.writeFileSync(
          path.resolve(uploadDirCenter, centerPhotoName),
          buffer
        );
      }

      if (buildingPhotoBlob) {
        const buffer = Buffer.from(await buildingPhotoBlob.arrayBuffer());

        fs.writeFileSync(
          path.resolve(uploadDirBuilding, buildingPhotoName),
          buffer
        )
      }

      const categories = await prisma.categories.findMany({
        where: {
          category_name: {
            in: ['center_photo', 'building_photo']
          }
        },
        select: {
          id: true,
          category_name: true,
        }
      });

      // Convert array → lookup object
      const categoryMap = Object.fromEntries(
        categories.map(c => [c.category_name, c.id])
      );

      const tasks = [];

      // Handle center photo
      if (centerPhotoBlob && categoryMap['center_photo']) {
        tasks.push(
          prisma.inspection_media.create({
            data: {
              category_id: categoryMap['center_photo'],
              batch_id: Number(id),
              assessor_id: Number(decoded.id),
              media_type: 'image',
              file_name: centerPhotoName,
              uploaded_by: Number(decoded.id),
            }
          })
        );
      }

      // Handle building photo
      if (buildingPhotoBlob && categoryMap['building_photo']) {
        tasks.push(
          prisma.inspection_media.create({
            data: {
              category_id: categoryMap['building_photo'],
              batch_id: Number(id),
              assessor_id: Number(decoded.id),
              media_type: 'image',
              file_name: buildingPhotoName,
              uploaded_by: Number(decoded.id),
            }
          })
        );
      }

      // Run all creates in parallel
      await Promise.all(tasks);

      // await prisma.users_additional_data.update({
      //   where: {
      //     user_id: result.id
      //   },
      //   data: {
      //     employee_id: Number(employeeId),
      //     job_roles: jobRoles.toString(),
      //     job_valid_upto: jobValidUpto.toString(),
      //     toa_nomination: toa_nomination ? Number(toa_nomination) : null,
      //     last_qualification: lastQualification.toString(),
      //     aadhaar_no: aadhaarNumber.toString(),
      //     pan_card_no: panCardNumber.toString(),
      //     bank_name: bankName.toString(),
      //     account_no: Number(accountNumber),
      //     ifsc_code: ifscCode.toString(),
      //     certificate_8th: certificate8thName || assessor?.user_additional_data?.certificate_8th || null,
      //     certificate_10th: certificate10thName || assessor?.user_additional_data?.certificate_10th || null,
      //     certificate_12th: certificate12thName || assessor?.user_additional_data?.certificate_12th || null,
      //     certificate_DIPLOMA: certificateDiplomaName || assessor?.user_additional_data?.certificate_DIPLOMA || null,
      //     certificate_UG: certificateUGName || assessor?.user_additional_data?.certificate_UG || null,
      //     certificate_PG: certificatePGName || assessor?.user_additional_data?.certificate_PG || null,
      //     assessor_certificate: assessorCertificateName || assessor?.user_additional_data?.assessor_certificate || null,
      //     agreement_copy: agreementCopyName || assessor?.user_additional_data?.agreement_copy || null,
      //     aadhaar_card: aadhaarCardImageName || assessor?.user_additional_data?.aadhaar_card || null,
      //     resume_cv: resumeCVName || assessor?.user_additional_data?.resume_cv || null,
      //     pan_card: panCardImageName || assessor?.user_additional_data?.pan_card || null,
      //     cancel_check: cancelCheckName || assessor?.user_additional_data?.cancel_check || null
      //   }
      // })

      return NextResponse.json({
        status: 'Success',
        statusCode: 200,
        message: 'Center and building photos uploaded successfully.',
        data: {
          center_photo: centerPhotoBlob ? `/storage/uploads/agency/batches/${id}/center-photo/${centerPhotoName}` : null,
          building_photo: buildingPhotoBlob ? `/storage/uploads/agency/batches/${id}/building-photo/${buildingPhotoName}` : null,
        }
      })


    } else {

      return NextResponse.json({
        status: 'Error',
        statusCode: 404,
        message: 'Batch not found'
      }, { status: 404 });
    }
  } catch (error: any) {

    if (error.name === 'TokenExpiredError') {
      return NextResponse.json({
        status: 'Error',
        statusCode: 401,
        message: 'Token expired',
        error: error
      }, { status: 401 });
    }

    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({
        status: 'Error',
        statusCode: 401,
        message: 'Invalid token',
        error: error
      }, { status: 401 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({
        status: 'Error',
        statusCode: 400,
        message: error.message,
        error: error
      }, { status: 400 });
    }

    // Fallback for any other server-side errors

    console.error('Server Error:', error);

    return NextResponse.json({
      status: 'Error',
      statusCode: 500,
      message: 'Internal server error',
      error: error
    }, { status: 500 });
  }
}
