'use server'

import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma'

export async function changeHardCopyStatus(
  batchId: number,
  hardCopyReceived: number
) {

  const session = await getServerSession(authOptions);
  const userType = session?.user?.user_type

  if (userType !== "AG"){
    return {
      success: false, message: 'Unauthorized'
    }
  }

  if ( Number.isNaN(batchId) || Number.isNaN(hardCopyReceived) ) {
    return {
      success: false,
      message: 'Invalid data'
    }
  }

  const result = await prisma.batches.update({
    where: {
      id: batchId,
    },
    data: {
      hard_copy_received: hardCopyReceived,
    },
  })

  if(result){

    return { success: true }

  } else {

    return { success: false }
  }

}

export async function getFiles(batchId: number) {
  const inspectionMedia = await prisma.inspection_media.findMany({
    where: {
      batch_id: batchId,
    },
    include: {
      category: {
        select: {
          category_name: true,
        },
      },
    },
  });

  const result: Record<string, { count: number }> = {};

  for (const media of inspectionMedia) {
    const categoryName =
      media.category?.category_name || "Uncategorized";

    if (!result[categoryName]) {
      result[categoryName] = {
        count: 0,
      };
    }

    result[categoryName].count += 1;
  }

  return {
    success: true,
    files: result,
  };
}
