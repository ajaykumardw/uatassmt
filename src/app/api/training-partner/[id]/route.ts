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


export async function POST(req: Request, context: { params: { id: number } }) {

  const formData = await req.formData()
  const { tpName, username, email, firstName, lastName, phoneNumber, state, city, pinCode, address, contactPersonAddress, panCardNumber, gstNumber, profileImage } = Object.fromEntries(formData.entries());

  const session = await getServerSession(authOptions)
  const agency_id = Number(session?.user?.agency_id)

  const id = Number(context.params.id);


  let filename = '';

  if (profileImage) {

    const file = profileImage as File;
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
        company_name: tpName.toString(),
        user_name: username.toString(),
        email: email as string,
        first_name: firstName.toString(),
        last_name: lastName.toString(),
        mobile_no: phoneNumber.toString(),
        state_id: Number(state),
        city_id: Number(city),
        pin_code: pinCode.toString(),
        address: address.toString(),
        avatar: filename || userExist.avatar
      }
    })

    if(result){

      console.log("User updated: ", id);

      // await prisma.users_additional_data.update({
      //   where: {
      //     user_id: id
      //   },
      //   data: {
      //     gst_no: gstNumber.toString(),
      //     pan_card_no: panCardNumber?.toString() || '',
      //     contact_person_address: contactPersonAddress?.toString() || ''
      //   }
      // })

      await prisma.users_additional_data.upsert({
        where: {
          user_id: id
        },
        update: {
          gst_no: gstNumber?.toString() || '',
          pan_card_no: panCardNumber?.toString() || '',
          contact_person_address: contactPersonAddress?.toString() || ''
        },
        create: {
          user_id: id,
          gst_no: gstNumber?.toString() || '',
          pan_card_no: panCardNumber?.toString() || '',
          contact_person_address: contactPersonAddress?.toString() || ''
        }
      })

      console.log("Filename: ", filename);

      if(filename){

        if(userExist.avatar){

          const oldFilePath = path.join(process.cwd(), storageFolders.storage, storageFolders.uploads, storageFolders.agency, storageFolders.users, id.toString(), userExist.avatar);

          if(fs.existsSync(oldFilePath)){
            await fsp.unlink(oldFilePath);
          }
        }

        const file = profileImage as File;

        const uploadDir = path.join(process.cwd(), storageFolders.storage, storageFolders.uploads, storageFolders.agency, storageFolders.users, result.id.toString());

        await fsp.mkdir(uploadDir, { recursive: true });

        // Save file
        const filePath = path.join(uploadDir, filename);

        await pipeline(file.stream() as any, fs.createWriteStream(filePath));
      }

      return NextResponse.json({ success: true, message: "User updated successfully." })
    }

    return NextResponse.json({ success: false, message: "User not updated." })
  }else {
    return NextResponse.json({ success: false, message: "User not found." }, {status: 404})
  }
}
