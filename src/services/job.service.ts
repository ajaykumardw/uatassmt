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
