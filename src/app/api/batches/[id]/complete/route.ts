// Next Imports
import { NextResponse } from 'next/server'

// Data Imports
import { getServerSession } from 'next-auth';

import { format } from 'date-fns';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma';

import { updateCandidateResultJob } from '@/services/job.service';

export async function POST(
  req: Request,
  context: { params: { id: number } }
) {

  const id = Number(context.params.id);

  const session = await getServerSession(authOptions);

  // const createdBy = Number(session?.user.id);

  const agencyId = Number(session?.user?.id);

  const batch = await prisma.batches.findUnique({
    where: {
      id: id,
      agency_id: agencyId
    }
  })

  if (!batch) {
    return NextResponse.json({message: 'Batch not found!'}, {status: 404})
  }

  try {

    if (batch.batch_completed) {

      return NextResponse.json({message: 'Batch already completed!'}, {status: 400})
    }

    await prisma.batches.update({
      where: { id },
      data: { batch_completed: 1 }
    });

    const job = await updateCandidateResultJob(id, agencyId);

    // const result = await updateBatchWiseCandidateResult(id);

    if(job){

      return NextResponse.json({message: 'Manually batch completed!'})
    }else{

      return NextResponse.json({message: 'No changes made!'}, {status: 400})
    }

  } catch (error: any) {

    console.error(`[${format(new Date(), "yyyy-MM-dd HH:mm:ss")}] Error completing batch:`, error);

    return NextResponse.json({message: error.message || 'An error occurred while updating the batch result.'}, {status: 500});
  }

}
