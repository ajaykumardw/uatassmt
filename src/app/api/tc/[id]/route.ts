import fs from "fs";
import fsp from "fs/promises";
import path from 'path';
import { randomUUID } from "crypto";

import { pipeline } from "stream/promises";

// Next Imports
import { NextResponse } from 'next/server'


// Data Imports
import { getServerSession } from 'next-auth';

import prisma from '@/libs/prisma';

import { authOptions } from '@/libs/auth';
import { storageFolders } from "@/configs/customDataConfig";

export async function GET(
  req: Request,
  context: { params: { id: number } }
) {

  const session = await getServerSession(authOptions);
  const createdBy = Number(session?.user.id)
  const id = Number(context.params.id);

  const trainingPartner = await prisma.users.findFirst({
    where: {
      id: id,
      OR: [
        { tp_id: createdBy },
        { created_by: createdBy }
      ],
    }
  })

  return NextResponse.json(trainingPartner);
}

export async function POST(req: Request, context: { params: { id: number } }) {

  const formData = await req.formData();

  const { tcId, tcName, email, status, firstName, lastName, phoneNumber, state, city, address, pinCode, signImage } = Object.fromEntries(formData.entries());

  const session = await getServerSession(authOptions)
  const agency_id = Number(session?.user?.agency_id)

  const id = Number(context.params.id);

  let filename = '';

  if (signImage) {

    const file = signImage as File;
    const ext = file.name.split(".").pop();

    filename = `${randomUUID()}.${ext}`;

  }

  const userExist = await prisma.users.findUnique({
    where: {
      id: id,
      master_id: agency_id
    }
  })

  if(userExist){

    const result = await prisma.users.update({
      where: {
        id: id
      },
      data: {
        user_name: tcId.toString(),
        company_name: tcName.toString(),
        email: email as string,
        first_name: firstName.toString(),
        last_name: lastName.toString(),
        mobile_no: phoneNumber.toString(),
        state_id: Number(state),
        city_id: Number(city),
        pin_code: pinCode.toString(),
        address: address.toString(),
        status: Number(status),
        sign_image: filename ? filename : userExist?.sign_image
      }
    })

    if(result){

      if(filename){

        const file = signImage as File;

        // const uploadDir = path.join(process.cwd(), 'storage', 'uploads', 'agency', result.id.toString());
        const uploadDir = path.join(process.cwd(), storageFolders.storage, storageFolders.uploads, storageFolders.agency, storageFolders.users, result.id.toString(), 'sign');

        await fsp.mkdir(uploadDir, { recursive: true });

        // Save file
        const filePath = path.join(uploadDir, filename);

        await pipeline(file.stream() as any, fs.createWriteStream(filePath));
      }

      return NextResponse.json({ success: true, message: "Training Center updated successfully." })
    }

    return NextResponse.json({ success: false, message: "Training Center not updated." })
  }else {
    return NextResponse.json({ success: false, message: "Training Center not found." }, {status: 404})
  }
}
