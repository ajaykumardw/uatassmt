import { Queue } from "bullmq";

import { redis } from "@/libs/redis";

export const evidenceQueue = new Queue(
  "evidenceZip",
  {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  }
);
