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


export async function GET() {

  const userType = 'AG';

  const data = await prisma.users.findMany({
    where: {
      user_type: userType
    },
    include: {
      state: true,
      city: true
    },
    orderBy: {
      first_name: "asc"
    }
  })

  return NextResponse.json(data)
}

export async function POST(req: Request) {

  const formData = await req.formData()
  const { email, password, companyName, contactPersonFirstName, contactPersonLastName, phoneNumber, landlineNumber, state, city, pincode, address, profileImage } = Object.fromEntries(formData)
  const hashPassword = await hash(password as string, 10)
  const userType = 'AG'
  const session = await getServerSession(authOptions)
  const createdBy = Number(session?.user.id)

  let filename = '';
  
  if (profileImage) {

    const file = profileImage as File;
    const ext = file.name.split(".").pop();
    
    filename = `${randomUUID()}.${ext}`;
  
  }


  const result = await prisma.users.create({
    data: {
      email: email.toString(),
      password: hashPassword,
      company_name: companyName.toString(),
      user_type: userType,
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
      created_by: createdBy,
      avatar: filename
    }
  })

  if(result){
    
    if(filename){

      const file = profileImage as File;

      const uploadDir = path.join(process.cwd(), 'storage', 'uploads', 'agency', result.id.toString());
      
      await fsp.mkdir(uploadDir, { recursive: true });

      // Save file
      const filePath = path.join(uploadDir, filename);

      await pipeline(file.stream() as any, fs.createWriteStream(filePath));
    }


    return NextResponse.json({ data: {'email': email, 'password': password}})
  }

  return NextResponse.json({data: 'not created'})
}
