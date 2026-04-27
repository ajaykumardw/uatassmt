import { type Job } from "bullmq";

// import prisma from "../libs/prisma";
import prisma from "@/libs/prisma";

// import { generateEvidenceZip }
//   from "../../services/generateEvidenceZip";
import { generateEvidenceZip } from "@/services/generateEvidenceZip";

// import { createEvidenceZip }
//   from "../../services/zipGenerator.service";
import { createEvidenceZip } from "@/services/zipGenerator.service";


// =======================================
// PROCESS EVIDENCE JOB
// =======================================

export const processEvidence = async (
  job: Job
) => {

  const { jobId } =
    job.data;

  if (!jobId) {

    throw new Error(
      "Invalid job data"
    );

  }

  try {

    // =========================
    // GET JOB RECORD
    // =========================

    const dbJob =
      await prisma.jobs.findUnique({

        where: {
          id: Number(jobId)
        }

      });

    if (!dbJob) {

      throw new Error(
        "Job not found"
      );

    }

    // =========================
    // GET BATCH
    // =========================

    const batch =
      await prisma.batches.findUnique({

        where: {
          id: Number(dbJob.reference_id)
        },

        select: {
          batch_name: true
        }

      });

    const batchName =
      batch?.batch_name || "Batch";

    // =========================
    // START PROCESSING
    // =========================

    await prisma.jobs.update({

      where: {
        id: Number(jobId)
      },

      data: {

        status: "processing",

        started_at:
          new Date(),

        progress: 10,

        error_message:
          null

      }

    });

    await job.updateProgress(10);

    // =========================
    // GET FOLDERS
    // =========================

    const folders =
      (dbJob.payload as any)
        ?.folders || [];

    // =========================
    // GENERATE FILE LIST
    // =========================

    const files =
      await generateEvidenceZip(

        dbJob.reference_id,

        folders

      );

    if (!files.length) {

      await prisma.jobs.update({

        where: {
          id: Number(jobId)
        },

        data: {

          status: "failed",

          progress: 0,

          error_message:
            "No files found"

        }

      });

      throw new Error(
        "No files found"
      );

    }

    // =========================
    // MID PROGRESS
    // =========================

    await prisma.jobs.update({

      where: {
        id: Number(jobId)
      },

      data: {
        progress: 40
      }

    });

    await job.updateProgress(40);

    // =========================
    // CREATE ZIP
    // =========================

    const zipPath =
      await createEvidenceZip(

        Number(jobId),

        files,

        batchName

      );

    await job.updateProgress(90);

    // =========================
    // COMPLETE
    // =========================

    await prisma.jobs.update({

      where: {
        id: Number(jobId)
      },

      data: {

        status: "completed",

        progress: 100,

        file_path:
          zipPath,

        completed_at:
          new Date()

      }

    });

    await job.updateProgress(100);

    return {
      success: true,
      file_path: zipPath
    };

  }
  catch (error: any) {

    await prisma.jobs.update({

      where: {
        id: Number(jobId)
      },

      data: {

        status: "failed",

        error_message:
          error.message ||
          "Unknown error"

      }

    });

    throw error;

  }

};
