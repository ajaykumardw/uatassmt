// Next Imports
import { NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

export async function GET() {

  const session = await getServerSession(authOptions);
  const agencyId = Number(session?.user?.agency_id);

  const batches = await prisma.batches.findMany({
    where: {
      agency_id: agencyId
    },
    select: {
      id: true,
      batch_name: true,
      batch_size: true,
      assessment_start_datetime: true,
      assessment_end_datetime: true,
      qualification_pack: {
        select: {
          qualification_pack_id: true,
          qualification_pack_name: true,
          ssc: {
            select: {
              ssc_code: true
            }
          }
        }
      },
      training_partner: {
        select: {
          first_name: true,
          last_name: true
        }
      },
      training_center: {
        select: {
          user_name: true
        }
      },
      scheme: {
        select: {
          id: true,
          scheme_name: true,
          scheme_code: true
        }
      },
      sub_scheme: {
        select:{
          id: true,
          scheme_name: true,
          scheme_code: true
        }
      }
    },
    orderBy: {
      assessment_start_datetime: "desc"
    }
  });

  // console.log(batches)

  return NextResponse.json(batches);
}

export async function POST(req: Request) {

  const data = await req.json();

  const {qpId, batchName, batchSize, scheme, subScheme, trainingPartner, trainingCenter, assessmentStartDate, assessmentEndDate, loginRestrictCount, modeOfAssessment, captureImage, captureImageInSeconds} = data;

  const session = await getServerSession(authOptions);
  const createdBy = Number(session?.user.id);
  const agencyId = Number(session?.user?.agency_id);

  const result = await prisma.batches.create({
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
      agency_id: agencyId,
      created_by: createdBy,
    }
  });

  if(result){
    return NextResponse.json({message: 'Batch created successfully!'})
  }else{
    return NextResponse.json({message: 'Batch not created!'}, {status: 500})
  }


}
