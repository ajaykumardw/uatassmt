import fs from 'fs';
import path from 'path';

// Next Imports
import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server';

import jwt, { type JwtPayload } from 'jsonwebtoken';

// Data Imports
import { getServerSession } from 'next-auth';

import { getTime } from 'date-fns';

import { Prisma } from '@prisma/client';

import prisma from '@/libs/prisma';

import { authOptions } from '@/libs/auth';

export async function GET(req: Request) {

  const url = new URL(await req.url);
  const sscId = url.searchParams.get('sscId');

  const session = await getServerSession(authOptions);
  const agencyId = Number(session?.user?.agency_id);

  const whereCondition = {
    master_id: agencyId,
    role_id: 1,
    ...(sscId ? { ssc_id: Number(sscId) } : {}),
  };

  const assessors = await prisma.users.findMany({
    where: whereCondition,
    include: {
      user_additional_data: true
    }
  })

  return NextResponse.json(assessors);
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

    if(decoded.user_type !== 'U' && decoded.role_id !== 1) {
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

    if(!batch){
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
      const centerPhotoName = center_photo ? getTime(new Date())+"_"+(center_photo as File).name : "";

      const buildingPhotoBlob = building_photo as Blob;
      const buildingPhotoName = building_photo ? getTime(new Date())+"_"+(building_photo as File).name : "";

      // const session = await getServerSession(authOptions);
      // const agency_id = Number(session?.user?.agency_id)
      // const createdBy = Number(session?.user.id)


      const uploadDirBuilding = path.join(process.cwd(), 'storage', 'uploads', 'agency', 'batches', id.toString(), 'building-photo');
      const uploadDirCenter = path.join(process.cwd(), 'storage', 'uploads', 'agency', 'batches', id.toString(), 'center-photo');

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

      if(centerPhotoBlob){
        const buffer = Buffer.from(await centerPhotoBlob.arrayBuffer());

        fs.writeFileSync(
          path.resolve(uploadDirCenter, centerPhotoName),
          buffer
        );
      }

      if(buildingPhotoBlob){
        const buffer = Buffer.from(await buildingPhotoBlob.arrayBuffer());

        fs.writeFileSync(
          path.resolve(uploadDirBuilding, buildingPhotoName),
          buffer
        )
      }

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
