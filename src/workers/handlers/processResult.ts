import path from "path";
import fs from "fs/promises";

import { createWriteStream } from "fs";

import archiver from "archiver";

import { type Job } from "bullmq";

import { format } from "date-fns";

import prisma from "@/libs/prisma";

import { generateBatchResultData } from "@/services/result-sheet/generateBatchResultData";
import { generateCandidatePdf } from "@/services/result-sheet/generateCandidatePdf";

// =======================================
// PROCESS RESULT ZIP JOB
// Job Type: resultZip
// =======================================

export const processResult = async (
  job: Job
) => {
  const { jobId } = job.data;

  if (!jobId) {
    throw new Error("Invalid job data");
  }

  try {
    // =========================
    // GET JOB RECORD
    // =========================
    const dbJob =
      await prisma.jobs.findUnique({
        where: {
          id: Number(jobId),
        },
      });

    if (!dbJob) {
      throw new Error("Job not found");
    }

    const batchId =
      Number(dbJob.reference_id);

    // =========================
    // GET BATCH
    // =========================
    const batch =
      await prisma.batches.findUnique({
        where: {
          id: batchId,
        },
        select: {
          batch_name: true,
        },
      });

    const batchName =
      batch?.batch_name || "Batch";

    // =========================
    // START JOB
    // =========================
    await prisma.jobs.update({
      where: {
        id: Number(jobId),
      },
      data: {
        status: "processing",
        started_at: new Date(),
        progress: 5,
        error_message: null,
      },
    });

    await job.updateProgress(5);

    // =========================
    // FETCH DATA
    // =========================
    const data =
      await generateBatchResultData(
        batchId
      );

    if (!data.candidates.length) {
      await prisma.jobs.update({
        where: {
          id: Number(jobId),
        },
        data: {
          status: "failed",
          progress: 0,
          error_message:
            "No candidates found",
        },
      });

      throw new Error(
        "No candidates found"
      );
    }

    await prisma.jobs.update({
      where: {
        id: Number(jobId),
      },
      data: {
        progress: 20,
      },
    });

    await job.updateProgress(20);

    // =========================
    // ZIP PATH
    // =========================
    const folderPath = path.join(
      process.cwd(),
      "storage",
      "exports",
      "results"
    );

    await fs.mkdir(folderPath, {
      recursive: true,
    });

    const fileName = `Candidates_Result_Sheet_of_${batchName}_${format(new Date(), "dd-MMM-yyyy")}.zip`;

    const zipPath = path.join(
      folderPath,
      fileName
    );

    // =========================
    // CREATE ZIP
    // =========================
    const output =
      createWriteStream(zipPath);

    const archive =
      archiver("zip", {
        zlib: { level: 9 },
      });

    archive.pipe(output);

    archive.on(
      "error",
      (err) => {
        throw err;
      }
    );

    // =========================
    // GENERATE PDFs
    // =========================
    const total =
      data.candidates.length;

    let processed = 0;

    for (const candidate of data.candidates) {
      const pdfFile =
        await generateCandidatePdf(candidate, data.assets);

      archive.append(
        pdfFile.buffer,
        { name: pdfFile.fileName }
      );

      archive.append(
        pdfFile.buffer,
        {
          name: pdfFile.fileName,
        }
      );

      processed++;

      const progress =
        20 +
        Math.floor(
          (processed / total) * 70
        );

      await prisma.jobs.update({
        where: {
          id: Number(jobId),
        },
        data: {
          progress,
        },
      });

      await job.updateProgress(
        progress
      );
    }

    // =========================
    // FINALIZE ZIP
    // =========================
    await archive.finalize();

    await new Promise<void>(
      (resolve, reject) => {
        output.on(
          "close",
          () => resolve()
        );

        output.on(
          "error",
          reject
        );
      }
    );

    // =========================
    // COMPLETE
    // =========================
    const dbFilePath =
      `storage/uploads/zips/${fileName}`;

    await prisma.jobs.update({
      where: {
        id: Number(jobId),
      },
      data: {
        status: "completed",
        progress: 100,
        file_path:
          dbFilePath,
        completed_at:
          new Date(),
      },
    });

    await job.updateProgress(100);

    return {
      success: true,
      file_path:
        dbFilePath,
    };
  } catch (error: any) {
    await prisma.jobs.update({
      where: {
        id: Number(jobId),
      },
      data: {
        status: "failed",
        error_message:
          error.message ||
          "Unknown error",
      },
    });

    throw error;
  }
};
