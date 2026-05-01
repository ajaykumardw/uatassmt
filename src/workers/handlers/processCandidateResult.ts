import type { Job } from "bullmq";

import prisma from "@/libs/prisma";
import updateBatchWiseCandidateResult from "@/libs/UpdateBatchWiseCandidateResult";

export const processBatchResult = async (job: Job) => {
  const { jobId } = job.data;

  if (!jobId) throw new Error("Invalid job data");

  try {
    const dbJob = await prisma.jobs.findUnique({
      where: { id: Number(jobId) },
    });

    if (!dbJob) throw new Error("Job not found");

    const batchId = Number(dbJob.reference_id);

    // START
    await prisma.jobs.update({
      where: { id: Number(jobId) },
      data: {
        status: "processing",
        started_at: new Date(),
        progress: 5,
        error_message: null,
      },
    });

    await job.updateProgress(5);

    // PROCESS
    const count = await updateBatchWiseCandidateResult(
      batchId,
      async (progress) => {
        await job.updateProgress(progress);

        await prisma.jobs.update({
          where: { id: Number(jobId) },
          data: { progress },
        });
      }
    );

    if (!(count > 0)) {
      throw new Error("No candidates processed");
    }

    // COMPLETE
    await prisma.jobs.update({
      where: { id: Number(jobId) },
      data: {
        status: "completed",
        progress: 100,
        completed_at: new Date(),
      },
    });

    await job.updateProgress(100);

    return { success: true };

  } catch (error: any) {
    await prisma.jobs.update({
      where: { id: Number(jobId) },
      data: {
        status: "failed",
        progress: 0,
        error_message: error.message || "Unknown error",
      },
    });

    throw error;
  }
};
