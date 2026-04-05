import { Worker } from "bullmq";

import { redis } from "../libs/redis";

import prisma from "../libs/prisma";

import { generateEvidenceZip }
  from "../services/generateEvidenceZip";

import { createEvidenceZip }
  from "../services/zipGenerator.service";

console.log("Redis Status:", redis.status);

const worker = new Worker(

  "evidenceZip",

  async (job) => {

    const { jobId } =
      job.data;

    if (!jobId) {

      throw new Error(
        "Invalid job data"
      );

    }

    try {

      const dbJob =
        await prisma.jobs.findUnique({

          where: { id: jobId }

        });

      if (!dbJob) {

        throw new Error(
          "Job not found"
        );

      }

      const batch = await prisma.batches.findUnique({

        where: { id: Number(dbJob.reference_id) },
        select: {
          batch_name: true
        }

      });

      const batchName = batch?.batch_name;

      await prisma.jobs.update({

        where: { id: Number(jobId) },

        data: {

          status: "processing",

          started_at: new Date(),

          progress: 10

        }

      });

      await job.updateProgress(10);



      const folders =
        (dbJob.payload as any)
          ?.folders || [];

      const files =
        await generateEvidenceZip(

          dbJob.reference_id,

          folders

        );

      if (!files.length) {

        await prisma.jobs.update({

          where: { id: Number(jobId) },

          data: {

            status: "failed",

            error_message:
              "No files found"

          }

        });

        return;

      }

      await prisma.jobs.update({

        where: { id: Number(jobId) },

        data: { progress: 40 }

      });

      await job.updateProgress(40);

      const zipPath =
        await createEvidenceZip(

          jobId,

          files,
          batchName

        );

      await job.updateProgress(90);

      await prisma.jobs.update({

        where: { id: Number(jobId) },

        data: {

          status: "completed",

          progress: 100,

          file_path: zipPath,

          completed_at: new Date()

        }

      });

      await job.updateProgress(100);

    }
    catch (error: any) {

      await prisma.jobs.update({

        where: { id: Number(jobId) },

        data: {

          status: "failed",

          error_message:
            error.message

        }

      });

      throw error;

    }

  },

  {

    connection: redis,

    concurrency: 2

  }

);

console.log("Evidence worker started...");

worker.on("active", (job) => {

  console.log(
    `[${new Date().toISOString()}] Processing job: ${job.id}`
  );

});

worker.on("progress", (job, progress) => {

  console.log(
    `Job ${job.id} progress: ${progress}%`
  );

});

worker.on("completed", (job) => {

  console.log(
    "Zip generation completed for job Id:",
    job?.id,
  );

});

worker.on("failed", (job, err) => {

  console.log(
    "Zip generation failed for job Id:",
    job?.id,
    "error:",
    err.message
  );

});

worker.on("error", (err) => {

  console.log(
    "Worker error:",
    err
  );

});
