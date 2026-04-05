import fs from "fs";

import path from "path";

import archiver from "archiver";


import prisma from "@/libs/prisma";

import { type EvidenceFile }
  from "./generateEvidenceZip";

const ZIP_BASE_PATH =
  "storage/uploads/zips";

export async function createEvidenceZip(

  jobId: number,

  files: EvidenceFile[],

  batchName?: string | null

): Promise<string> {

  return new Promise(

    async (resolve, reject) => {

      try {

        if (!fs.existsSync(ZIP_BASE_PATH)) {

          fs.mkdirSync(
            ZIP_BASE_PATH,
            { recursive: true }
          );

        }

        const zipName = `${batchName?.replace(/\s+/g, "_") || "evidence"}.zip`;

        const zipFilePath =
          path.join(

            ZIP_BASE_PATH,

            zipName

          );

        const output =
          fs.createWriteStream(
            zipFilePath
          );

        const archive =
          archiver(

            "zip",

            {

              zlib: {
                level: 9
              }

            }

          );

        output.on(

          "close",

          () => {

            resolve(
              zipFilePath
            );

          }

        );

        archive.on(

          "error",

          (err) => {

            reject(err);

          }

        );

        archive.pipe(output);

        let processed = 0;

        for (const file of files) {

          if (
            fs.existsSync(
              file.fullPath
            )
          ) {

            archive.file(

              file.fullPath,

              {

                name: path.join(
                  batchName || "evidence",
                  file.zipPath
                )

              }

            );

          }

          processed++;

          const progress =
            Math.floor(

              40 +
              (processed / files.length) * 55

            );

          await prisma.jobs.update({

            where: { id: jobId },

            data: { progress }

          });

        }

        await archive.finalize();

      }
      catch (error) {

        reject(error);

      }

    }

  );

}
