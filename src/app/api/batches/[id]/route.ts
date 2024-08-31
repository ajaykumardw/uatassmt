// Next Imports
import { NextResponse } from 'next/server'


// Data Imports
import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';


export async function GET(
  req: Request,
  context: { params: { id: number } }
) {

  const session = await getServerSession(authOptions);
  const agencyId = Number(session?.user.agency_id);
  const id = Number(context.params.id);

  const batch = await prisma.batches.findFirst({
    where: {
      id: id,
      agency_id: agencyId
    },
    include: {
      qualification_pack: true
    }
  })

  // console.log(batch)

  if(batch){
    return NextResponse.json(batch);
  }

  return NextResponse.json({message: "Batch not found!"}, {status: 404});

}


export async function POST(
  req: Request,
  context: { params: { id: number } }
) {

  const id = Number(context.params.id);

  const data = await req.json();

  const {qpId, batchName, batchSize, scheme, subScheme, trainingPartner, trainingCenter, assessmentStartDate, assessmentEndDate, loginRestrictCount, modeOfAssessment, captureImage, captureImageInSeconds} = data;

  const session = await getServerSession(authOptions);
  const createdBy = Number(session?.user.id);
  const agencyId = Number(session?.user?.agency_id);

  const batchExist = await prisma.batches.findUnique({
    where: {
      id: id,
      agency_id: agencyId
    }
  });

  if(batchExist){

    const result = await prisma.batches.update({
      where: {
        id: id,
        agency_id: agencyId
      },
      data: {
        batch_name: batchName,
        qp_id: Number(qpId),
        scheme_id: Number(scheme),
        sub_scheme_id: Number(subScheme),
        batch_size: batchSize,
        training_partner_id: Number(trainingPartner),
        training_centre_id: Number(trainingCenter),
        assessment_start_datetime: assessmentStartDate,
        assessment_end_datetime: assessmentEndDate,
        login_restrict: Number(loginRestrictCount),
        assessment_mode: Number(modeOfAssessment),
        capture_image_in_seconds: captureImage ? Number(captureImageInSeconds) : null,
      }
    });

    if(result){
      return NextResponse.json({message: 'Batch updated successfully!'})
    }else{
      return NextResponse.json({message: 'Batch not updated!'}, {status: 500})
    }
  }else{
    return NextResponse.json({message: 'Batch not found!'}, {status: 404})
  }


}
