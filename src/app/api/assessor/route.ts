import fs from 'fs';
import path from 'path';

// Next Imports
import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server';

import { hash } from 'bcrypt'

// Data Imports
import { getServerSession } from 'next-auth';

import { getTime } from 'date-fns';

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


export async function POST(req: NextRequest) {

  const formData = await req.formData();

  const body = Object.fromEntries(formData);

  const {
    profile,
    username,
    email,
    password,
    employeeId,
    sscId,
    jobRoles,
    jobValidUpto,
    firstName,
    lastName,
    state,
    city,
    pinCode,
    address,
    phoneNumber,
    aadhaarNumber,
    panCardNumber,
    toa_nomination,
    lastQualification,
    bankName,
    accountNumber,
    ifscCode,
    certificate_8th,
    certificate_10th,
    certificate_12th,
    certificate_DIPLOMA,
    certificate_UG,
    certificate_PG,
    assessorCertificate,
    agreementCopy,
    aadhaarCardImage,
    resumeCV,
    panCardImage,
    cancelCheck,
  } = body;

  const assessorExists = await prisma.users.findFirst({
    where: {
      OR: [
        { user_name: username.toString() },
        { email: email.toString() }
      ]
    }
  });

  if (assessorExists) {
    return NextResponse.json({ success: false, message: "Assessor already exists." }, { status: 400 })
  }

  const avatarBlob = profile as Blob;
  const avatarName = profile ? getTime(new Date()) + "_" + (profile as File).name : "";

  const certificate8thBlob = certificate_8th as Blob;
  const certificate8thName = certificate_8th ? getTime(new Date()) + "_" + (certificate_8th as File).name : "";

  const certificate10thBlob = certificate_10th as Blob;
  const certificate10thName = certificate_10th ? getTime(new Date()) + "_" + (certificate_10th as File).name : "";

  const certificate12thBlob = certificate_12th as Blob;
  const certificate12thName = certificate_12th ? getTime(new Date()) + "_" + (certificate_12th as File).name : "";

  const certificateDiplomaBlob = certificate_DIPLOMA as Blob;
  const certificateDiplomaName = certificate_DIPLOMA ? getTime(new Date()) + "_" + (certificate_DIPLOMA as File).name : "";

  const certificateUGBlob = certificate_UG as Blob;
  const certificateUGName = certificate_UG ? getTime(new Date()) + "_" + (certificate_UG as File).name : "";

  const certificatePGBlob = certificate_PG as Blob;
  const certificatePGName = certificate_PG ? getTime(new Date()) + "_" + (certificate_PG as File).name : "";

  const assessorCertificateBlob = assessorCertificate as Blob;
  const assessorCertificateName = assessorCertificate ? getTime(new Date()) + "_" + (assessorCertificate as File).name : "";

  const agreementCopyBlob = agreementCopy as Blob;
  const agreementCopyName = agreementCopy ? getTime(new Date()) + "_" + (agreementCopy as File).name : "";

  const aadhaarCardImageBlob = aadhaarCardImage as Blob;
  const aadhaarCardImageName = aadhaarCardImage ? getTime(new Date()) + "_" + (aadhaarCardImage as File).name : "";

  const resumeCVBlob = resumeCV as Blob;
  const resumeCVName = resumeCV ? getTime(new Date()) + "_" + (resumeCV as File).name : "";

  const panCardImageBlob = panCardImage as Blob;
  const panCardImageName = panCardImage ? getTime(new Date()) + "_" + (panCardImage as File).name : "";

  const cancelCheckBlob = cancelCheck as Blob;
  const cancelCheckName = cancelCheck ? getTime(new Date()) + "_" + (cancelCheck as File).name : "";

  const hashPassword = await hash((password as string), 10)
  const userType = 'U'
  const session = await getServerSession(authOptions)
  const agency_id = Number(session?.user?.agency_id)
  const createdBy = Number(session?.user.id)

  const result = await prisma.users.create({
    data: {
      user_name: username.toString(),
      ssc_id: Number(sscId),
      email: email as string,
      password: hashPassword,
      user_type: userType,
      first_name: firstName.toString(),
      last_name: lastName.toString(),
      avatar: avatarName,
      mobile_no: phoneNumber.toString(),
      is_master: false,
      master_id: agency_id,
      role_id: 1,
      state_id: Number(state),
      city_id: Number(city),
      pin_code: pinCode.toString(),
      address: address.toString(),
      created_by: createdBy
    }
  })

  if (result) {

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'agency', 'users', result.id.toString());

    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
      } catch (err) {
        console.error('Error creating upload directory:', err);
        throw new Error('Failed to create upload directory');
      }
    }

    if (avatarBlob) {
      const buffer = Buffer.from(await avatarBlob.arrayBuffer());

      fs.writeFileSync(
        path.resolve(uploadDir, avatarName),
        buffer
      );
    }

    if (certificate8thBlob) {
      const buffer = Buffer.from(await certificate8thBlob.arrayBuffer());

      fs.writeFileSync(
        path.resolve(uploadDir, certificate8thName),
        buffer
      )
    }

    if (certificate10thBlob) {
      const buffer = Buffer.from(await certificate10thBlob.arrayBuffer());

      fs.writeFileSync(
        path.resolve(uploadDir, certificate10thName),
        buffer
      )
    }

    if (certificate12thBlob) {
      const buffer = Buffer.from(await certificate12thBlob.arrayBuffer());

      fs.writeFileSync(
        path.resolve(uploadDir, certificate12thName),
        buffer
      )
    }

    if (certificateDiplomaBlob) {
      const buffer = Buffer.from(await certificateDiplomaBlob.arrayBuffer());

      fs.writeFileSync(
        path.resolve(uploadDir, certificateDiplomaName),
        buffer
      )
    }

    if (certificateUGBlob) {
      const buffer = Buffer.from(await certificateUGBlob.arrayBuffer());

      fs.writeFileSync(
        path.resolve(uploadDir, certificateUGName),
        buffer
      )
    }

    if (certificatePGBlob) {
      const buffer = Buffer.from(await certificatePGBlob.arrayBuffer());

      fs.writeFileSync(
        path.resolve(uploadDir, certificatePGName),
        buffer
      )
    }

    if (assessorCertificateBlob) {
      const buffer = Buffer.from(await assessorCertificateBlob.arrayBuffer());

      fs.writeFileSync(
        path.resolve(uploadDir, assessorCertificateName),
        buffer
      )
    }

    if (agreementCopyBlob) {
      const buffer = Buffer.from(await agreementCopyBlob.arrayBuffer());

      fs.writeFileSync(
        path.resolve(uploadDir, agreementCopyName),
        buffer
      )
    }

    if (aadhaarCardImageBlob) {
      const buffer = Buffer.from(await aadhaarCardImageBlob.arrayBuffer());

      fs.writeFileSync(
        path.resolve(uploadDir, aadhaarCardImageName),
        buffer
      )
    }

    if (resumeCVBlob) {
      const buffer = Buffer.from(await resumeCVBlob.arrayBuffer());

      fs.writeFileSync(
        path.resolve(uploadDir, resumeCVName),
        buffer
      )
    }

    if (panCardImageBlob) {
      const buffer = Buffer.from(await panCardImageBlob.arrayBuffer());

      fs.writeFileSync(
        path.resolve(uploadDir, panCardImageName),
        buffer
      )
    }

    if (cancelCheckBlob) {
      const buffer = Buffer.from(await cancelCheckBlob.arrayBuffer());

      fs.writeFileSync(
        path.resolve(uploadDir, cancelCheckName),
        buffer
      )
    }

    await prisma.users_additional_data.create({
      data: {
        user_id: result.id,
        employee_id: Number(employeeId),
        job_roles: jobRoles.toString(),
        job_valid_upto: jobValidUpto.toString(),
        toa_nomination: toa_nomination ? Number(toa_nomination) : null,
        last_qualification: lastQualification.toString(),
        aadhaar_no: aadhaarNumber.toString(),
        pan_card_no: panCardNumber.toString(),
        bank_name: bankName.toString(),
        account_no: Number(accountNumber),
        ifsc_code: ifscCode.toString(),
        certificate_8th: certificate8thName || null,
        certificate_10th: certificate10thName || null,
        certificate_12th: certificate12thName || null,
        certificate_DIPLOMA: certificateDiplomaName || null,
        certificate_UG: certificateUGName || null,
        certificate_PG: certificatePGName || null,
        assessor_certificate: assessorCertificateName || null,
        agreement_copy: agreementCopyName || null,
        aadhaar_card: aadhaarCardImageName || null,
        resume_cv: resumeCVName || null,
        pan_card: panCardImageName || null,
        cancel_check: cancelCheckName || null
      }
    })

    return NextResponse.json({ success: true, message: "User created successfully." })
  }

  return NextResponse.json({ success: false, message: "User not created." })
}
