// utils/generateCertificatesZip.ts

import fs from "fs";
import os from "os";
import path from "path";

import { pathToFileURL } from "url";

import archiver from "archiver";

import pLimit from "p-limit";

import { launch } from "puppeteer";

import type {
  Browser,
  PDFOptions
} from "puppeteer";


// ================= TYPES =================

export type CandidateData = {

  id: number;

  candidate_id: string;

  candidate_name: string;

  agency_name: string;

  agency_logo: string;

  agency_stamp: string;

  head_name: string;

  father_name: string;

  qp_name: string;

  qp_level: string;

  scheme: string;

  tp_name: string;

  qr_code: string;

  certificate_no: string;

  issue_date: string;

  system_identification_no: string;
};

// ================= SHARED BROWSER =================

let browser: Browser | null =
  null;

let processedJobs = 0;

// ================= BROWSER =================

async function getBrowser() {

  if (browser) {
    return browser;
  }

  browser =
    await launch({

      headless: true,

      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--allow-file-access-from-files"
      ]
    });

  return browser;
}

// ================= HELPERS =================

function toFileUrl(
  relativePath: string
) {

  const absolutePath =
    path.resolve(relativePath);

  return pathToFileURL(
    absolutePath
  ).href;
}

// ================= MAIN =================

export const generateCertificatesZip =
  async (

    htmlTemplate: string,

    config: {
      width: number;
      height: number;
    },

    candidates: CandidateData[],

    zipPath: string
  ) => {

    // ================= CREATE ZIP DIR =================

    const zipDir =
      path.dirname(
        zipPath
      );

    if (
      !fs.existsSync(
        zipDir
      )
    ) {

      fs.mkdirSync(
        zipDir,
        {
          recursive: true
        }
      );
    }

    // ================= REMOVE OLD ZIP =================

    if (
      fs.existsSync(
        zipPath
      )
    ) {

      fs.unlinkSync(
        zipPath
      );
    }

    // ================= BROWSER =================

    const activeBrowser =
      await getBrowser();

    // ================= ZIP =================

    const output =
      fs.createWriteStream(
        zipPath
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

    // ================= ARCHIVE ERROR =================

    archive.on(
      "error",
      (err) => {
        throw err;
      }
    );

    archive.pipe(output);

    // ================= CONCURRENCY =================

    const limit =
      pLimit(3);

    // ================= GENERATE PDFs =================

    await Promise.all(

      candidates.map(
        (candidate) => {

          return limit(
            async () => {

              // ================= HTML =================

              let html =
                htmlTemplate;

              Object.entries(
                candidate
              ).forEach(
                ([key, value]) => {

                  html =
                    html.replaceAll(
                      `{{${key}}}`,
                      String(
                        value || ""
                      )
                    );
                }
              );

              // ================= REMOVE REMAINING =================

              html =
                html.replace(
                  /{{(.*?)}}/g,
                  ""
                );

              // ================= FIX STORAGE URLS =================

              html =
                html.replace(
                  /url\((['"]?)\/storage\/(.*?)\1\)/g,
                  (_, quote, filePath) => {

                    const fullPath =
                      toFileUrl(
                        `storage/${filePath}`
                      );

                    return `url("${fullPath}")`;
                  }
                );

              html =
                html.replace(
                  /src=(['"])\/storage\/(.*?)\1/g,
                  (_, quote, filePath) => {

                    const fullPath =
                      toFileUrl(
                        `storage/${filePath}`
                      );

                    return `src="${fullPath}"`;
                  }
                );

              // ================= BASE URL =================

              const baseUrl =
                pathToFileURL(
                  process.cwd() + "/"
                ).href;

              // ================= FINAL HTML =================

              const finalHtml = `
                <!DOCTYPE html>

                <html>

                  <head>

                    <meta charset="UTF-8" />

                    <base href="${baseUrl}" />

                    <style>

                      html,
                      body {

                        margin: 0;
                        padding: 0;
                      }

                    </style>

                  </head>

                  <body>

                    ${html}

                  </body>

                </html>
              `;

                // ================= TEMP HTML FILE =================
              
                const tempHtmlPath =
                    path.join(
                        os.tmpdir(),
                        `certificate-${Date.now()}.html`
                    );
            
                fs.writeFileSync(
                    tempHtmlPath,
                    finalHtml,
                    "utf-8"
                );

              // ================= PAGE =================

              const page =
                await activeBrowser.newPage();

              // ================= AUTO RECOVERY =================

              page.on(
                "error",
                async () => {

                  try {

                    await browser?.close();

                  } catch {}

                  browser = null;
                }
              );

              page.setDefaultNavigationTimeout(
                0
              );

              // ================= VIEWPORT =================

              await page.setViewport({

                width:
                  config.width,

                height:
                  config.height
              });

              await page.emulateMediaType(
                "screen"
              );

              // ================= LOAD HTML =================

            //   await page.setContent(
            //     finalHtml,
            //     {
            //       waitUntil:
            //         "domcontentloaded"
            //     }
            //   );

            await page.goto(
                pathToFileURL(tempHtmlPath).href,
                {
                    waitUntil: "domcontentloaded"
                }
            );

              // ================= WAIT IMAGES =================

              await page.evaluate(
                async () => {

                  const images =
                    Array.from(
                      document.images
                    );

                  await Promise.all(

                    images.map((img) => {

                      if (
                        img.complete
                      ) {

                        return Promise.resolve();
                      }

                      return new Promise<void>(
                        (resolve) => {

                          img.onload =
                            () => resolve();

                          img.onerror =
                            () => resolve();
                        }
                      );
                    })
                  );
                }
              );

              // ================= PDF =================

              const pdfOptions: PDFOptions = {

                width:
                  `${config.width}px`,

                height:
                  `${config.height}px`,

                printBackground: true,

                margin: {
                  top: "0px",
                  right: "0px",
                  bottom: "0px",
                  left: "0px"
                }
              };

              const pdf =
                await page.pdf(
                  pdfOptions
                );

                if (
                    fs.existsSync(tempHtmlPath)
                ) {
                    fs.unlinkSync(tempHtmlPath);
                }

              // ================= CLOSE PAGE =================

              await page.close();

              // ================= APPEND ZIP =================
              const pdfBuffer = Buffer.from(pdf);

              archive.append(
                pdfBuffer,
                {
                  name:
                    `${candidate.candidate_name}-${candidate.candidate_id}.pdf`
                }
              );
            }
          );
        }
      )
    );

    // ================= FINALIZE ZIP =================

    await archive.finalize();

    // ================= WAIT ZIP =================

    await new Promise<void>(
      (resolve, reject) => {

        output.on(
          "close",
          () => resolve()
        );

        output.on(
          "error",
          (err) => reject(err)
        );
      }
    );

    // ================= OPTIONAL RESET =================

    processedJobs++;

    if (
      processedJobs >= 20
    ) {

      try {

        await browser?.close();

      } catch {}

      browser = null;

      processedJobs = 0;
    }

    // ================= RETURN =================

    return zipPath;
};
