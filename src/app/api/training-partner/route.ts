import fs from "fs";
import fsp from "fs/promises";
import path from 'path';
import { randomUUID } from "crypto";

import { pipeline } from "stream/promises";

// Next Imports
import { NextResponse } from 'next/server'

import {hash} from 'bcrypt'

// Data Imports
import { getServerSession } from 'next-auth';

import prisma from '@/libs/prisma';

import { authOptions } from '@/libs/auth';
import { storageFolders } from "@/configs/customDataConfig";

export async function GET() {
  const session = await getServerSession(authOptions);
  const agency_id = Number(session?.user?.agency_id);

  const trainingPartners = await prisma.users.findMany({
    where: {
      master_id: agency_id,
      user_type: 'U',
      role_id: 2
    },
    orderBy:{
      company_name: "asc"
    }
  });

  return NextResponse.json(trainingPartners);
}


export async function POST(req: Request) {

  // return NextResponse.json({success: false, message: "User not created"}, {status: 500})

  const formData = await req.formData();

  const { tpName, username, email, password, firstName, lastName, phoneNumber, state, city, pinCode, address, contactPersonAddress, panCardNumber, gstNumber, profileImage } = Object.fromEntries(formData.entries());
  
  const hashPassword = await hash(password as string, 10)
  const userType = 'U'
  const session = await getServerSession(authOptions)
  const agency_id = Number(session?.user?.agency_id)
  const createdBy = Number(session?.user.id)

  let filename = '';

  if (profileImage) {

    const file = profileImage as File;
    const ext = file.name.split(".").pop();

    filename = `${randomUUID()}.${ext}`;

  }

  const result = await prisma.users.create({
    data: {
      company_name: tpName.toString(),
      user_name: username.toString(),
      email: email as string,
      password: hashPassword,
      user_type: userType,
      first_name: firstName.toString(),
      last_name: lastName.toString(),
      mobile_no: phoneNumber.toString(),
      is_master: false,
      master_id: agency_id,
      role_id: 2,
      state_id: Number(state),
      city_id: Number(city),
      pin_code: pinCode.toString(),
      address: address.toString(),
      created_by: createdBy,
      avatar: filename
    }
  })

  if(result){

    await prisma.users_additional_data.create({
      data: {
        user_id: result.id,
        gst_no: gstNumber.toString(),
        pan_card_no: panCardNumber?.toString() || '',
        contact_person_address: contactPersonAddress?.toString() || ''
      }
    })

    if(filename){

      const file = profileImage as File;

      // const uploadDir = path.join(process.cwd(), 'storage', 'uploads', 'agency', result.id.toString());
      const uploadDir = path.join(process.cwd(), storageFolders.storage, storageFolders.uploads, storageFolders.agency, storageFolders.users, result.id.toString());

      await fsp.mkdir(uploadDir, { recursive: true });

      // Save file
      const filePath = path.join(uploadDir, filename);

      await pipeline(file.stream() as any, fs.createWriteStream(filePath));
    }

    return NextResponse.json({ success: true, message: "User created successfully." })
  }

  return NextResponse.json({ success: false, message: "User not created." })
}
