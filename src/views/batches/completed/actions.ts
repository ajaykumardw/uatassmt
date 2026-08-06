'use server'

import { getServerSession } from 'next-auth';

import { authOptions } from '@/libs/auth';

import prisma from '@/libs/prisma'

import { folders } from "@/configs/customDataConfig";
import { generateInvoiceNumber } from '@/libs/invoiceHelper'

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

  // Prevent unchecking once marked
  if (hardCopyReceived === 0) {
    return {
      success: false,
      message: 'Cannot uncheck. Once marked as received, it cannot be changed.'
    }
  }

  const created_by = Number(session?.user?.id)
  const agency_id = Number((session?.user as any)?.agency_id)

  // Fetch batch details first (needed in both paths)
  const batch = await prisma.batches.findUnique({
    where: { id: batchId },
    select: {
      id: true,
      assessor_id: true,
      batch_size: true,
      assessment_end_datetime: true,
      qualification_pack: {
        select: {
          ssc: { select: { id: true } }
        }
      },
      scheme: {
        select: { scheme_name: true }
      },
      _count: {
        select: { students: true }
      }
    }
  })

  if (!batch || !batch.assessor_id) {
    return {
      success: false,
      message: 'Batch not found or no assessor assigned'
    }
  }

  const sscId = batch.qualification_pack?.ssc?.id

  if (!sscId) {
    return {
      success: false,
      message: 'SSC not found for this batch'
    }
  }

  const totalCandidates = batch._count.students || Number(batch.batch_size) || 0

  // Fetch latest amount_per_candidate from invoice_master_data for this assessor
  const masterData = await prisma.$queryRaw<Array<{ amount_per_candidate: number }>>`
    SELECT amount_per_candidate FROM invoice_master_data
    WHERE type = 2 AND assessor_id = ${batch.assessor_id}
    ORDER BY id DESC LIMIT 1
  `

  const amountPerCandidate = (masterData as any[]).length > 0
    ? Number((masterData as any[])[0].amount_per_candidate)
    : 0

  const totalAmount = amountPerCandidate * totalCandidates

  // Check if invoice already exists for this batch (type=2)
  const existingInvoice = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT id FROM invoices WHERE batch_id = ${batchId} AND type = 2 LIMIT 1
  `

  if ((existingInvoice as any[]).length > 0) {
    const existingId = (existingInvoice as any[])[0].id

    // Update existing invoice with correct amounts from master data
    await prisma.$executeRaw`
      UPDATE invoices SET
        amount_per_candidate = ${amountPerCandidate},
        total_amount = ${totalAmount},
        updated_at = NOW()
      WHERE id = ${existingId}
    `

    if (hardCopyReceived) {
      await prisma.batches.update({
        where: { id: batchId },
        data: { hard_copy_received: 1 },
      })
    }

    return { success: true, message: 'Invoice amounts updated from master data' }
  }

  try {
    const invoiceNumber = await generateInvoiceNumber(2)

    await prisma.$executeRaw`
      INSERT INTO invoices (
        invoice_number, type, batch_id, ssc_id, scheme, assessor_id,
        assessment_date, total_candidate, present_candidate, amount_per_candidate,
        total_amount, advance_amount, tds_amount, other_deduction, gst_amount, gst_percentage,
        status, notes, agency_id, created_by, created_at, updated_at
      ) VALUES (
        ${invoiceNumber}, 2, ${batchId}, ${sscId},
        ${batch.scheme?.scheme_name || null}, ${batch.assessor_id},
        ${batch.assessment_end_datetime || null}, ${totalCandidates},
        ${totalCandidates}, ${amountPerCandidate}, ${totalAmount}, 0, 0, 0, 0, null,
        1, 'Auto-generated from Hard Copy Received', ${agency_id}, ${created_by}, NOW(), NOW()
      )
    `

    // Update hard_copy_received to 1
    await prisma.batches.update({
      where: { id: batchId },
      data: { hard_copy_received: 1 },
    })

    return { success: true, message: 'Assessor invoice created successfully with amount ' + amountPerCandidate }
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to create invoice' }
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

  // -------------------------
  // Candidate Feedback
  // -------------------------

  result.candidate_feedback.count =
    await prisma.feedback_responses.count({
      where: {
        batch_id: batchId,
        user_type: 1
      }
    });

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
