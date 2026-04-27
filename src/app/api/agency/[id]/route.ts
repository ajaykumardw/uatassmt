import fs from "fs";
import fsp from "fs/promises";
import path from 'path';
import { randomUUID } from "crypto";

import { pipeline } from "stream/promises";

// Next Imports
import { NextResponse } from 'next/server'

// Data Imports
import prisma from '@/libs/prisma';

export async function GET(
  req: Request,
  context: { params: { id: number } }
) {

  const id = context.params.id;

  const data = await prisma.users.findUnique({
    where: {
      id: Number(id),
      user_type: 'AG'
    }
  })

  if(data){

    return NextResponse.json(data)
  }
  else{

    return NextResponse.json({message: 'agency not found'},{status: 404})
  }
}

export async function POST(
  req: Request,
  context: { params: { id: number } }
) {

  const id = context.params.id;
  const formData = await req.formData()
  const { email, companyName, contactPersonFirstName, contactPersonLastName, phoneNumber, landlineNumber, state, city, pincode, address, profileImage, signImage } = Object.fromEntries(formData)


  let filename = '';

  if (profileImage) {

    const file = profileImage as File;
    const ext = file.name.split(".").pop();

    filename = `${randomUUID()}.${ext}`;

  }

  let signFilename = '';

  if (signImage) {

    const file = signImage as File;
    const ext = file.name.split(".").pop();

    signFilename = `${randomUUID()}.${ext}`;

  }

  const agencyExist = await prisma.users.findUnique({
    where: {
      id: Number(id),
      user_type: 'AG'
    }
  })

  if(agencyExist){

    const result = await prisma.users.update({
      where: {
        id: Number(id),
        user_type: 'AG'
      },
      data: {
        email: email.toString(),
        company_name: companyName.toString(),
        first_name: contactPersonFirstName.toString(),
        last_name: contactPersonLastName.toString(),
        mobile_no: phoneNumber.toString(),
        landline_no: landlineNumber?.toString() || '',
        is_master: true,
        master_id: 0,
        state_id: Number(state),
        city_id: Number(city),
        pin_code: pincode.toString(),
        address: address.toString(),
        avatar: filename || agencyExist.avatar,
        sign_image: signFilename || agencyExist.sign_image
      }
    })

    if( result ){

      if(filename){

        if(agencyExist.avatar){

          const oldFilePath = path.join(process.cwd(), 'storage', 'uploads', 'agency', id.toString(), agencyExist.avatar);

          if(fs.existsSync(oldFilePath)){
            await fsp.unlink(oldFilePath);
          }
        }

        const file = profileImage as File;

        const uploadDir = path.join(process.cwd(), 'storage', 'uploads', 'agency', result.id.toString());

        await fsp.mkdir(uploadDir, { recursive: true });

        // Save file
        const filePath = path.join(uploadDir, filename);

        await pipeline(file.stream() as any, fs.createWriteStream(filePath));
      }

      if(signFilename){

        if(agencyExist.sign_image){

          const oldSignFilePath = path.join(process.cwd(), 'storage', 'uploads', 'agency', id.toString(), 'sign', agencyExist.sign_image);

          if(fs.existsSync(oldSignFilePath)){
            await fsp.unlink(oldSignFilePath);
          }
        }

        const file = signImage as File;

        const uploadDir = path.join(process.cwd(), 'storage', 'uploads', 'agency', result.id.toString(), 'sign');

        await fsp.mkdir(uploadDir, { recursive: true });

        // Save file
        const filePath = path.join(uploadDir, signFilename);

        await pipeline(file.stream() as any, fs.createWriteStream(filePath));
      }

      return NextResponse.json({message: 'Agency updated successfully!'})
    }

    return NextResponse.json({message: 'Agency not updated'}, {status: 500})
  }
  else{
    return NextResponse.json({message: 'Agency not found'}, {status: 404})
  }
}
