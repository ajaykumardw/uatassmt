import fs from 'fs';

import { randomUUID } from "crypto";

import { pipeline } from "stream/promises";

import path from "path";

import { type NextRequest, NextResponse } from "next/server";

import { verify, type JwtPayload } from 'jsonwebtoken';

import { Prisma } from '@prisma/client';

import prisma from '@/libs/prisma';

import { storageFolders } from "@/configs/customDataConfig";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {

  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json({
      status: 'Error',
      statusCode: 401,
      message: "Missing token"
    }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  try {

    const decoded = verify(token, process.env.NEXTAUTH_SECRET as string) as JwtPayload;

    if (decoded.user_type !== 'U' || decoded.role_id !== 1) {
      return NextResponse.json({
        status: 'Error',
        statusCode: 403,
        message: 'Forbidden: Insufficient permissions'
      }, { status: 403 });
    }

    const id = Number(params.id);

    const batch = await prisma.batches.findUnique({
      where: {
        id: id,
        assessor: {
          id: Number(decoded.id)
        }
      },
      select: {
        training_center: {
          select: {
            id: true,
            email: true,
            company_name: true,
            user_name: true,
            user_type: true,
            first_name: true,
            last_name: true,
            mobile_no: true,
          }
        },
        training_partner: {
          select: {
            company_name: true,
            first_name: true,
            last_name: true
          }
        },
      }
    })

    if (!batch) {
      return NextResponse.json({
        status: 'Error',
        statusCode: 404,
        message: 'Batch not found'
      }, { status: 404 });
    }

    const declarationData = await prisma.inspection_media.findMany({
      where: {
        batch_id: id,
        category: {
          category_name: {
            in: ["tp_spoc_signature", "assessor_signature"]
          }
        }
      },
      include: {
        category: true
      }
    });

    // if (declarationData.length === 0) {
    //   return NextResponse.json({
    //     status: "Success",
    //     statusCode: 404,
    //     message: "No declaration media found for this batch",
    //   }, { status: 404 });
    // }

    const declarationText = `I, {center_spoc_name} Center SPOC of this training center, on behalf of {training_partner_name}, acknowledge that the assessment process conducted by ({assessment_agency_name}) is in the manner of the SOP and assessor has not asked/demanded any bribe.`

    const groupedData: Record<string, { id: number; url: string } | null> = {};

    const relativePath = path.posix.join(
      storageFolders.storage,
      storageFolders.uploads,
      storageFolders.agency,
      storageFolders.batches,
      id.toString(),
    );

    declarationData.forEach(item => {
      const categoryName = item.category.category_name;

      const folderName = categoryName === "tp_spoc_signature"
        ? storageFolders.tpSpocSignature
        : storageFolders.assessorSignature;

      if (!groupedData[categoryName]) {
        groupedData[categoryName] = null;
      }

      const url = `${process.env.NEXT_PUBLIC_APP_URL}/${path.posix.join(
        relativePath,
        folderName,
        item.file_name
      )}`;

      groupedData[categoryName] = {
        id:item.id,
        url:url
      };
    });

    const data = {
      "center_spoc_name": (batch.training_center.first_name + " " + batch.training_center.last_name).trim(),
      "center_spoc_email": batch.training_center.email,
      "center_spoc_mobile": batch.training_center.mobile_no,
      "training_partner_name": batch.training_partner.company_name,
      "assessment_agency_name": "Assessment Agency Name",
      "declaration": declarationText,
      "tp_spoc_signature": groupedData["tp_spoc_signature"] || null,
      "assessor_signature": groupedData["assessor_signature"] || null
    }

    return NextResponse.json({
      status: "Success",
      statusCode: 200,
      message: "Declaration media fetched successfully",
      data: data
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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {

  const authHeader = request.headers.get("authorization");

  if (!authHeader) {

    return NextResponse.json({
      status: 'Error',
      message: "Missing token"
    }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  try {

    const decoded =
      verify(
        token,
        process.env.NEXTAUTH_SECRET as string
      ) as JwtPayload;

    if (
      decoded.user_type !== 'U' ||
      decoded.role_id !== 1
    ) {
      return NextResponse.json({
        status: 'Error',
        message: 'Forbidden'
      }, { status: 403 });
    }

    const formData = await request.formData();

    const tpFile = formData.get("tp_spoc_signature") as File;

    const assessorFile = formData.get("assessor_signature") as File;

    if (!tpFile && !assessorFile) {
      return NextResponse.json({
        status: "Error",
        statusCode: 400,
        message: "No tp_spoc_signature or assessor_signature file provided",
      }, { status: 400 });
    }

    const { id } = params;

    const MAX_SIZE = 5 * 1024 * 1024;

    const outputs: any = {};

    async function processFile(
      file: File,
      key: string,
      folder: string
    ) {

      const ext = file.type.split("/")[1].toLowerCase();

      if(!["jpeg","jpg","png","webp"].includes(ext)){
        throw new Error("Invalid file");
      }

      if (file.size > MAX_SIZE) {
        throw new Error("File too large");
      }

      const filename = `${randomUUID()}.${ext}`;

      const uploadDir = path.join(
        process.cwd(),
        storageFolders.storage,
        storageFolders.uploads,
        storageFolders.agency,
        storageFolders.batches,
        id.toString(),
        folder
      );

      await fs.promises.mkdir(
        uploadDir,
        { recursive: true }
      );

      const filePath = path.join(uploadDir, filename);

      const category = await prisma.categories.findFirst({

          where: {
            category_name: key
          },

          select: {
            id: true
          }

        });

      if (!category) {
        throw new Error("Category not found");
      }

      const existing = await prisma.inspection_media.findFirst({

        where: {
          batch_id: Number(id),
          category_id: category.id
        }

      });

      try {

        // SAVE NEW FILE FIRST (safe order)
        await pipeline(
          file.stream() as any,
          fs.createWriteStream(filePath)
        );

      } catch (error) {

        console.error("File upload error:", error);

        throw new Error("Failed to upload file");
      }

      // Now update DB
      let media;

      if (existing) {

        media = await prisma.inspection_media.update({

          where: {
            id: existing.id
          },

          data: {
            file_name: filename,
            uploaded_by: decoded.id
          }

        });

        // delete old after success
        if(existing?.file_name){

          const oldPath =
          path.join(uploadDir,existing.file_name);

          if(fs.existsSync(oldPath)){
            fs.unlinkSync(oldPath);
          }

        }

      } else {

        media = await prisma.inspection_media.create({

          data: {
            category_id: category.id,
            batch_id: Number(id),
            assessor_id: decoded.id,
            media_type: "image",
            file_name: filename,
            uploaded_by: decoded.id
          }

        });

      }

      outputs[key] = {

        id: media.id,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/storage/uploads/agency/batches/${id}/${folder}/${filename}`

      };

    }

    if (tpFile instanceof File) {

      try {

        await processFile(
          tpFile,
          "tp_spoc_signature",
          storageFolders.tpSpocSignature
        );
      } catch (error) {
        console.error("Error processing tp_spoc_signature:", error);

        return NextResponse.json({
          status: "Error",
          statusCode: 400,
          message: `${error instanceof Error ? error.message : 'Unknown error'}`
        }, { status: 400 });

      }

    }

    if (assessorFile instanceof File) {

      try {
        await processFile(
          assessorFile,
          "assessor_signature",
          storageFolders.assessorSignature
        );
      } catch (error) {
        console.error("Error processing assessor_signature:", error);

        return NextResponse.json({
          status: "Error",
          statusCode: 400,
          message: `${error instanceof Error ? error.message : 'Unknown error'}`
        }, { status: 400 });

      }

    }

    return NextResponse.json({

      status: "Success",
      message: "Declaration media uploaded successfully",
      data: outputs

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
