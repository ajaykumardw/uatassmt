// services/certificate/generateCertificatePdf.ts

import fs from "fs";
import path from "path";

import archiver from "archiver";

import pLimit from "p-limit";

import { launch } from "puppeteer";

import type {
  Browser,
  PDFOptions
} from "puppeteer";

// ================= TYPES =================

export type CandidateData = {

  candidate_id: string;

  candidate_name: string;

  father_name: string;

  qr_code: string;

  certificate_no: string;

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
        "--disable-setuid-sandbox"
      ]
    });

  return browser;
}

// ================= FILE TO BASE64 =================

const imageCache =
  new Map<string, string>();

function fileToBase64(
  relativePath: string
) {

  if (!relativePath) {
    return "";
  }

  if (
    imageCache.has(relativePath)
  ) {

    return imageCache.get(
      relativePath
    )!;
  }

  const cleanedPath =
    relativePath.startsWith("/")
      ? relativePath.substring(1)
      : relativePath;

  const absolutePath =
    path.join(
      process.cwd(),
      cleanedPath
    );

  if (
    !fs.existsSync(
      absolutePath
    )
  ) {

    console.log(
      "File not found:",
      absolutePath
    );

    return "";
  }

  const ext =
    path.extname(
      absolutePath
    )
      .substring(1)
      .toLowerCase();

  const mime =
    ext === "jpg" ||
      ext === "jpeg"
      ? "image/jpeg"
      : ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : `image/${ext}`;

  const buffer =
    fs.readFileSync(
      absolutePath
    );

  const base64 =
    `data:${mime};base64,${buffer.toString("base64")}`;

  imageCache.set(
    relativePath,
    base64
  );

  return base64;
}

// ================= CONVERT STATIC IMAGES =================

function convertStorageImagesToBase64(
  html: string
) {

  // background-image

  html =
    html.replace(

      /url\((['"]?)(\/storage\/[^'")]+)\1\)/gi,

      (_, quote, filePath) => {

        const base64 =
          fileToBase64(
            filePath
          );

        return `url("${base64}")`;
      }
    );

  // img src

  html =
    html.replace(

      /src=(['"])(\/storage\/[^'"]+)\1/gi,

      (_, quote, filePath) => {

        const base64 =
          fileToBase64(
            filePath
          );

        return `src="${base64}"`;
      }
    );

  return html;
}

// ================= MAIN =================

export const generateCertificatesZip =
  async (

    preparedHtml: string,

    config: {
      width: number;
      height: number;
    },

    candidates: CandidateData[],

    zipPath: string,

    onProgress?: (
      progress: number,
      completed: number,
      total: number
    ) => Promise<void> | void
  ) => {

    // ================= ZIP DIR =================

    console.log("start time", new Date().toISOString());
    console.time("generateCertificatesZip");

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

    // ================= PREPARE STATIC HTML ONLY ONCE =================

    const staticHtml =
      convertStorageImagesToBase64(
        preparedHtml
      );

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
            level: 0
          }
        }
      );

    archive.on(
      "error",
      (err) => {
        throw err;
      }
    );

    archive.pipe(output);

    const total = candidates.length;

    let completed = 0;

    // ================= LIMIT =================

    const limit =
      pLimit(10);

    // ================= GENERATE =================

    await Promise.all(

      candidates.map(
        (candidate) => {

          return limit(
            async () => {

              // ================= DYNAMIC HTML =================

              let html =
                staticHtml;

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

              html =
                html.replace(
                  /{{(.*?)}}/g,
                  ""
                );

              // ================= FINAL HTML =================

              const finalHtml = `
                <!DOCTYPE html>

                <html>

                  <head>

                    <meta charset="UTF-8" />

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

              // ================= PAGE =================

              const page =
                await activeBrowser.newPage();

              await page.setViewport({

                width:
                  config.width,

                height:
                  config.height
              });

              await page.emulateMediaType(
                "screen"
              );

              // ================= CONTENT =================

              await page.setContent(
                finalHtml,
                {
                  waitUntil:
                    "domcontentloaded"
                }
              );

              // ================= PDF =================

              const pdfOptions: PDFOptions = {

                width:
                  `${config.width}px`,

                height:
                  `${config.height}px`,

                printBackground:
                  true,

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

              await page.close();

              // ================= APPEND =================

              archive.append(
                Buffer.from(pdf),
                {
                  name:
                    `${candidate.candidate_name}-${candidate.candidate_id}.pdf`
                }
              );

              completed++;

              if (onProgress) {

                await onProgress((completed / total) * 100, completed, total);
                
              }
            }
          );
        }
      )
    );

    // ================= FINALIZE =================

    await archive.finalize();

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

    // ================= RESET =================

    processedJobs++;

    if (
      processedJobs >= 20
    ) {

      try {

        await browser?.close();

      } catch { }

      browser = null;

      processedJobs = 0;
    }

    console.timeEnd("generateCertificatesZip");
    console.log("end time", new Date().toISOString());

    // ================= RETURN =================

    return zipPath;
  };
