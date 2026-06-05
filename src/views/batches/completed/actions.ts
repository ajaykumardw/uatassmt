'use server'

import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma'

import { folders } from "@/configs/customDataConfig";

type FileCount = {
  id: string;
  name: string;
  count: number;
};

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

// export async function getFiles(batchId: number) {
//   const inspectionMedia = await prisma.inspection_media.findMany({
//     where: {
//       batch_id: batchId,
//     },
//     include: {
//       category: {
//         select: {
//           category_name: true,
//         },
//       },
//     },
//   });

//   const result: Record<string, { count: number }> = {};

//   for (const media of inspectionMedia) {
//     const categoryName =
//       media.category?.category_name || "Uncategorized";

//     if (!result[categoryName]) {
//       result[categoryName] = {
//         count: 0,
//       };
//     }

//     result[categoryName].count += 1;
//   }

//   return {
//     success: true,
//     files: result,
//   };
// }

export async function getFiles(batchId: number) {

  const excludedFolderIds = new Set([
    "theory_exam",
    "practical_exam",
    "viva_exam",
    "assessor_feedback",
    "student_image_and_aadhaar"
  ]);

  const inspectionFolders = folders.filter(
    folder =>
      folder.status === 1 &&
      !excludedFolderIds.has(folder.id)
  );

  const result: Record<string, FileCount> = {};

  // Initialize all folders with 0
  for (const folder of folders.filter(f => f.status === 1)) {
    result[folder.id] = {
      id: folder.id,
      name: folder.name,
      count: 0
    };
  }

  // -------------------------
  // Inspection Media Counts
  // -------------------------

  const inspectionMedia = await prisma.inspection_media.findMany({
    where: {
      batch_id: batchId
    },
    include: {
      category: true
    }
  });

  const categoryToFolderMap = new Map(
    inspectionFolders.map(folder => [
      folder.id.toLowerCase(),
      folder.id,
    ])
  );

  for (const media of inspectionMedia) {
    const categoryName =
      media.category?.category_name?.toLowerCase();

    if (!categoryName) {
      continue;
    }

    const folderId = categoryToFolderMap.get(categoryName);

    if (!folderId) {
      continue;
    }

    result[folderId].count += 1;
  }

  // // -------------------------
  // // Assessor Feedback
  // // -------------------------

  // result.assessor_feedback.count =
  //   await getAssessorFeedbackCount(batchId);

  // // -------------------------
  // // Student Image + Aadhaar
  // // -------------------------

  // result.student_image_and_aadhaar.count =
  //   await getStudentImageAadhaarCount(batchId);

  // // -------------------------
  // // Theory Exam
  // // -------------------------

  // result.theory_exam.count =
  //   await getTheoryExamCount(batchId);

  // // -------------------------
  // // Practical Exam
  // // -------------------------

  // result.practical_exam.count =
  //   await getPracticalExamCount(batchId);

  // // -------------------------
  // // Viva Exam
  // // -------------------------

  // result.viva_exam.count =
  //   await getVivaExamCount(batchId);

  return {
    success: true,
    files: Object.values(result)
  };
}
