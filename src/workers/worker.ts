import { Worker } from "bullmq";

import { redis } from "../libs/redis";

import { processEvidence } from "./handlers/processEvidence";

import { processResult } from "./handlers/processResult";
import { processBatchResult } from "./handlers/processCandidateResult";
import { processCertificate } from "./handlers/processCertificate";
import { processQuestionPaper } from "./handlers/processQuestionPaper";
import { processOMRSheet } from "./handlers/processOMR";

// import { processCertificate } from "./handlers/processCertificate";

console.log("Redis Status:", redis.status);

// =======================================
// MAIN DOCUMENT WORKER
// Single PM2 Process
// Queue Name: documentJobs
// Job Names:
// evidenceZip
// resultZip
// certificateZip
// =======================================

const worker = new Worker(

  "evidenceZip",

  async (job) => {
    try {
      switch (job.name) {
        case "generateZip":
          return await processEvidence(job);

        case "resultZip":
          return await processResult(job);

        case "updateResult":
          return await processBatchResult(job);

        case "generateCertificate":
          return await processCertificate(job);

        case "generateQuestionPaper":
          return await processQuestionPaper(job);

        case "generateOMRSheet":
          return await processOMRSheet(job);

        // case "certificateZip":
        //   return await processCertificate(job);

        default:
          throw new Error(`Unknown job type: ${job.name}`);
      }
    } catch (error) {
      throw error;
    }
  },

  {
    connection: redis,
    concurrency: 2
  }
);

console.log("Document worker started...");

// =======================================
// EVENTS
// =======================================

worker.on("active", (job) => {
  console.log(
    `[${new Date().toISOString()}] Processing job: ${job.id} (${job.name})`
  );
});

worker.on("progress", (job, progress) => {
  console.log(
    `[${new Date().toISOString()}] Job ${job.id} (${job.name}) progress: ${progress}%`
  );
});

worker.on("completed", (job) => {
  console.log(
    `[${new Date().toISOString()}] Job completed: ${job?.id} (${job?.name})`
  );
});

worker.on("failed", (job, err) => {
  console.log(
    `[${new Date().toISOString()}] Job failed: ${job?.id} (${job?.name}) | Error: ${err.message}`
  );
});

worker.on("error", (err) => {
  console.log(
    `[${new Date().toISOString()}] Worker error:`,
    err
  );
});

// =======================================
// GRACEFUL SHUTDOWN
// =======================================

const shutdown = async () => {
  console.log("Shutting down worker...");

  await worker.close();

  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
