import prisma from "@/libs/prisma";

import { evidenceQueue }
  from "@/libs/queue";

export async function createZipJob(

  batchId: number,
  folders: string[],
  requestedBy: number

) {

  const job = await prisma.jobs.create({

    data: {
      job_type: "generate_zip",
      reference_id: batchId,
      reference_type: "batch",
      payload: { folders },
      status: "pending",
      progress: 0,
      requested_by: requestedBy
    }

  });

  await evidenceQueue.add(

    "generateZip",

    {

      jobId: job.id

    }

  );

  return job;

}

export async function createResultZipJob(

  batchId: number,
  requestedBy: number

) {

  const job = await prisma.jobs.create({

    data: {
      job_type: "generate_result_sheet_zip",
      reference_id: batchId,
      reference_type: "batch",
      payload: {},
      status: "pending",
      progress: 0,
      requested_by: requestedBy
    }

  });

  await evidenceQueue.add(

    "resultZip",

    {

      jobId: job.id

    }

  );

  return job;
}

export async function updateCandidateResultJob(

  batchId: number,
  requestedBy: number

) {

  const job = await prisma.jobs.create({

    data: {
      job_type: "update_candidate_result",
      reference_id: batchId,
      reference_type: "batch",
      payload: {},
      status: "pending",
      progress: 0,
      requested_by: requestedBy
    }

  });

  await evidenceQueue.add(

    "updateResult",

    {

      jobId: job.id

    }

  );

  return job;
}

export async function createCertificateJob(
  batchId: number,
  requestedBy: number
) {
  const job = await prisma.jobs.create({
    data: {
      job_type: "generate_certificate",
      reference_id: batchId,
      reference_type: "batch",
      payload: {},
      status: "pending",
      progress: 0,
      requested_by: requestedBy
    }
  });

  await evidenceQueue.add(
    "generateCertificate",
    {
      jobId: job.id
    }
  );

  return job;
}

export async function createQuestionPaperJob(
  batchId: number,
  requestedBy: number
) {

  // CHECK ACTIVE JOB
  const existingJob = await prisma.jobs.findFirst({
    where: {
      job_type: "generate_question_paper",
      reference_id: batchId,
      reference_type: "batch",
    }
  });

  // RETURN EXISTING JOB
  // ALREADY RUNNING
  if (
    existingJob &&
    ["pending", "processing"].includes(existingJob.status)
  ) {

    return existingJob;

  }

  let job;

  // RETRY EXISTING JOB
  if (existingJob) {

    job = await prisma.jobs.update({

      where: {
        id: existingJob.id
      },

      data: {

        status: "pending",

        progress: 0,

        payload: {},

        requested_by: requestedBy,

        retry_count: {
          increment: 1
        }

      }

    });

  } else {

    // CREATE NEW JOB
    job = await prisma.jobs.create({
      data: {
        job_type: "generate_question_paper",
        reference_id: batchId,
        reference_type: "batch",
        payload: {},
        status: "pending",
        progress: 0,
        requested_by: requestedBy
      }
    });

  }


  await evidenceQueue.add(
    "generateQuestionPaper",
    {
      jobId: job.id
    }
  );

  console.log(
    "Created question paper job with ID:",
    job.id,
    "for batch ID:",
    batchId,
    "and job data:",
    job
   );

  return job;
}
