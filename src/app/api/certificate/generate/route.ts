// app/api/certificate/generate/route.ts

import fs from "fs";
import os from "os";
import path from "path";

import { pathToFileURL } from "url";

import { type NextRequest, NextResponse } from "next/server";

import { launch } from "puppeteer";

import type { Browser } from "puppeteer";

import { toDataURL } from "qrcode";

import { getServerSession } from "next-auth";

import { format } from "date-fns";

import prisma from "@/libs/prisma";

import { authOptions } from "@/libs/auth";

import { getAgencyImagePath } from "@/configs/customDataConfig";
import { getFY } from "@/utils/getFY";

// ================= TYPES =================

type Payload = {
  candidateId: number;
};

// ================= HELPERS =================

function toFileUrl(relativePath: string) {

  const absolutePath =
    path.resolve(relativePath);

  return pathToFileURL(
    absolutePath
  ).href;
}

const now = () => Date.now();

const logTime = (
  label: string,
  start: number
) => {

  console.log(
    `${label}: ${Date.now() - start}ms`
  );
};


let browser: Browser | null = null;

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

// ================= POST =================

export async function POST(req: NextRequest) {

  const totalStart = now();


  try {

    const body: Payload =
      await req.json();

    const {
      candidateId
    } = body;

    const t1 = now();

    const session =
      await getServerSession(authOptions);

    const agencyId =
      session?.user.agency_id;

    logTime("Session", t1);

    // ================= VALIDATIONS =================

    if (!session) {

      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized"
        },
        { status: 401 }
      );
    }

    if (!candidateId) {

      return NextResponse.json(
        {
          success: false,
          message: "Candidate ID is required"
        },
        { status: 400 }
      );
    }

    if (!agencyId) {

      return NextResponse.json(
        {
          success: false,
          message: "Agency ID not found in session"
        },
        { status: 400 }
      );
    }

    const t2 = now();

    // ================= TEMPLATE =================

    const template =
      await prisma.certificate_template.findFirst({
        where: {
          is_active: true
        }
      });

    if (!template) {

      return NextResponse.json(
        {
          success: false,
          message: "Template not found"
        },
        { status: 404 }
      );
    }

    logTime("Template query", t2);

    // ================= AGENCY =================

    const agencyData =
      await prisma.users.findFirst({
        where: {
          id: Number(agencyId)
        },
        select: {
          company_name: true,
          first_name: true,
          last_name: true,
          avatar: true,
          sign_image: true
        }
      });

    // ================= CANDIDATE =================

    const t3 = now();

    const candidate =
      await prisma.students.findUnique({
        where: {
          id: candidateId
        },
        select: {
          id: true,
          candidate_id: true,
          candidate_name: true,
          father_name: true,
          gender: true,

          batch: {
            select: {

              batch_name: true,

              scheme: {
                select: {
                  scheme_name: true
                }
              },

              qualification_pack: {
                select: {
                  qualification_pack_name: true,
                  qualification_pack_id: true,
                  nsqf_level: true
                }
              },

              training_partner: {
                select: {
                  company_name: true
                }
              }
            }
          }
        }
      });


    logTime("candidate query", t3);

    if (!candidate) {

      return NextResponse.json(
        {
          success: false,
          message: "Candidate not found"
        },
        { status: 404 }
      );
    }

    // ================= FILE URLS =================

    const agencyLogo =
      agencyData?.avatar
        ? toFileUrl(
          getAgencyImagePath(
            Number(agencyId),
            agencyData.avatar
          )
        )
        : "";

    const agencyStamp =
      agencyData?.sign_image
        ? toFileUrl(
          getAgencyImagePath(
            Number(agencyId),
            `sign/${agencyData.sign_image}`
          )
        )
        : "";

    const qrCode =
      await toDataURL(
        `certificate-${candidate.id}`,
        {
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF"
          }
        }
      );

    // const financialYear = (() => {
    //   const now = new Date();
    //   const year = now.getFullYear();
    //   const month = now.getMonth() + 1;
      
    //   return month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
    // })();

    // ================= DATA =================

    const data = {

      agency_name:
        agencyData?.company_name || "",

      agency_logo:
        agencyLogo,

      agency_stamp:
        agencyStamp,

      head_name: `${agencyData?.first_name || ""} ${agencyData?.last_name || ""}`.trim(),

      candidate_name:
        candidate.candidate_name,

      father_name:
        candidate.gender === "m"
          ? `S/O ${candidate.father_name}`
          : candidate.gender === "f"
            ? `D/O ${candidate.father_name}`
            : `C/O ${candidate.father_name}`,

      qp_name:
        `${candidate.batch.qualification_pack.qualification_pack_name} (${candidate.batch.qualification_pack.qualification_pack_id})`,

      qp_level:
        candidate.batch.qualification_pack.nsqf_level,

      scheme:
        candidate.batch.scheme.scheme_name,

      tp_name:
        candidate.batch.training_partner.company_name,

      // qr_code:
      //   `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=certificate-${candidate.id}`
      qr_code: qrCode,

      certificate_no: `CERT-${candidate.id.toString().padStart(6, "0")}`,
      issue_date: format(new Date(), "dd/MM/yyyy"),
      system_identification_no: `${candidate.batch.scheme.scheme_name.trim()}/${getFY()}/UP2019CR26944/${candidate.batch.batch_name?.trim()}/${candidate.candidate_id.trim()}`,
    };

    // ================= HTML =================

    const t4 = now();

    let html =
      template.html;

    Object.entries(data).forEach(
      ([key, value]) => {

        html = html.replaceAll(
          `{{${key}}}`,
          value || ""
        );
      }
    );

    // remove remaining placeholders

    html = html.replace(
      /{{(.*?)}}/g,
      ""
    );

    // ================= FIX EXISTING STORAGE PATHS =================

    html = html.replace(
      /url\((['"]?)\/storage\/(.*?)\1\)/g,
      (_, quote, filePath) => {

        const fullPath =
          toFileUrl(
            `storage/${filePath}`
          );

        return `url("${fullPath}")`;
      }
    );

    html = html.replace(
      /src=(['"])\/storage\/(.*?)\1/g,
      (_, quote, filePath) => {

        const fullPath =
          toFileUrl(
            `storage/${filePath}`
          );

        return `src="${fullPath}"`;
      }
    );

    logTime("HTML generation", t4);

    // ================= BASE URL =================

    const baseUrl =
      pathToFileURL(
        process.cwd() + "/"
      ).href;

    const finalHtml = `
      <!DOCTYPE html>

      <html>

        <head>

          <meta charset="UTF-8" />

          <base href="${baseUrl}" />

          <style>
            html, body {
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

    console.log(
      "Temporary HTML file created at:",
      tempHtmlPath
    );

    // ================= BROWSER =================
    const t5 = now();

    // browser =
    //   await puppeteer.launch({

    //     headless: true,

    //     args: [
    //       "--no-sandbox",
    //       "--disable-setuid-sandbox",
    //       "--allow-file-access-from-files"
    //     ]
    //   });


    const browser = await getBrowser();


    logTime("browser launch", t5);

    // const page =
    //   await browser.newPage();


    // const browser = await getBrowser();
    const page = await browser.newPage();

    page.setDefaultNavigationTimeout(0);

    // ================= VIEWPORT =================

    const config: any =
      template.config;

    await page.setViewport({
      width: config.width,
      height: config.height
    });

    await page.emulateMediaType("screen");

    // ================= LOAD HTML =================

    const t6 = now();

    await page.goto(
      pathToFileURL(tempHtmlPath).href,
      {
        waitUntil: "domcontentloaded"
      }
    );


    logTime("page goto", t6);

    // ================= WAIT FOR IMAGES =================
    const t7 = now();

    await page.evaluate(async () => {

      const images =
        Array.from(document.images);

      await Promise.all(
        images.map((img) => {

          if (img.complete) {
            return Promise.resolve();
          }

          return new Promise((resolve) => {

            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );
    });

    logTime("wait for images", t7);

    // ================= DEBUG SCREENSHOT =================

    // await page.screenshot({
    //   path: "debug.png",
    //   fullPage: true
    // });

    // ================= PDF =================
    const t8 = now();

    const pdf =
      await page.pdf({

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
      });

    logTime("PDF generation", t8);

    // ================= CLEANUP =================

    fs.unlinkSync(tempHtmlPath);

    // await browser.close();
    await page.close();

    logTime("Total execution time", totalStart);

    // ================= RESPONSE =================

    return new NextResponse(
      Buffer.from(pdf),
      {

        status: 200,

        headers: {

          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            `inline; filename=certificate-${Date.now()}.pdf`
        }
      }
    );

  } catch (error: any) {

    console.error(error);

    if (browser) {
      await browser.close();
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Internal server error"
      },
      { status: 500 }
    );
  }
}


// app/api/certificate/generate/route.ts

// import fs from "fs";
// import path from "path";

// import puppeteer from "puppeteer";
// import type { Browser } from "puppeteer";

// // import QRCode from "qrcode";
// import QRCode from "qrcode";

// import { NextRequest, NextResponse } from "next/server";

// import prisma from "@/libs/prisma";

// import { getServerSession } from "next-auth";
// import { authOptions } from "@/libs/auth";

// import { getAgencyImagePath } from "@/configs/customDataConfig";

// // ================= TYPES =================

// type Payload = {
//   candidateId: number;
// };

// // ================= HELPERS =================

// const now = () => Date.now();

// const logTime = (
//   label: string,
//   start: number
// ) => {

//   console.log(
//     `${label}: ${Date.now() - start}ms`
//   );
// };

// // ================= BASE64 IMAGE =================

// function imageToBase64(
//   filePath: string
// ) {

//   try {

//     const absolutePath =
//       path.resolve(filePath);

//     if (
//       !fs.existsSync(
//         absolutePath
//       )
//     ) {
//       return "";
//     }

//     const buffer =
//       fs.readFileSync(
//         absolutePath
//       );

//     const ext =
//       path.extname(
//         absolutePath
//       ).replace(".", "");

//     return `data:image/${ext};base64,${buffer.toString("base64")}`;
//   }

//   catch {

//     return "";
//   }
// }

// // ================= STORAGE IMAGE TO BASE64 =================

// function fileToBase64Url(
//   filePath: string
// ) {

//   try {

//     const absolutePath =
//       path.join(
//         process.cwd(),
//         "public",
//         filePath
//       );

//     if (
//       !fs.existsSync(
//         absolutePath
//       )
//     ) {
//       return "";
//     }

//     const buffer =
//       fs.readFileSync(
//         absolutePath
//       );

//     const ext =
//       path.extname(
//         absolutePath
//       ).replace(".", "");

//     return `data:image/${ext};base64,${buffer.toString("base64")}`;
//   }

//   catch {

//     return "";
//   }
// }

// // ================= BROWSER =================

// let browser: Browser | null = null;

// async function getBrowser() {

//   if (browser) {
//     return browser;
//   }

//   browser =
//     await puppeteer.launch({

//       headless: true,

//       args: [
//         "--no-sandbox",
//         "--disable-setuid-sandbox"
//       ]
//     });

//   return browser;
// }

// // ================= POST =================

// export async function POST(
//   req: NextRequest
// ) {

//   const totalStart = now();

//   try {

//     const body: Payload =
//       await req.json();

//     const {
//       candidateId
//     } = body;

//     // ================= SESSION =================

//     const t1 = now();

//     const session =
//       await getServerSession(authOptions);

//     const agencyId =
//       session?.user.agency_id;

//     logTime(
//       "Session",
//       t1
//     );

//     // ================= VALIDATIONS =================

//     if (!session) {

//       return NextResponse.json(
//         {
//           success: false,
//           message: "Unauthorized"
//         },
//         { status: 401 }
//       );
//     }

//     if (!candidateId) {

//       return NextResponse.json(
//         {
//           success: false,
//           message:
//             "Candidate ID is required"
//         },
//         { status: 400 }
//       );
//     }

//     if (!agencyId) {

//       return NextResponse.json(
//         {
//           success: false,
//           message:
//             "Agency ID not found in session"
//         },
//         { status: 400 }
//       );
//     }

//     // ================= TEMPLATE =================

//     const t2 = now();

//     const template =
//       await prisma.certificate_template.findFirst({
//         where: {
//           is_active: true
//         }
//       });

//     if (!template) {

//       return NextResponse.json(
//         {
//           success: false,
//           message:
//             "Template not found"
//         },
//         { status: 404 }
//       );
//     }

//     logTime(
//       "Template query",
//       t2
//     );

//     // ================= AGENCY =================

//     const agencyData =
//       await prisma.users.findFirst({
//         where: {
//           id: Number(
//             agencyId
//           )
//         },
//         select: {
//           company_name: true,
//           first_name: true,
//           last_name: true,
//           avatar: true,
//           sign_image: true
//         }
//       });

//     // ================= CANDIDATE =================

//     const t3 = now();

//     const candidate =
//       await prisma.students.findUnique({
//         where: {
//           id: candidateId
//         },
//         select: {

//           id: true,

//           candidate_name: true,

//           father_name: true,

//           gender: true,

//           batch: {
//             select: {

//               scheme: {
//                 select: {
//                   scheme_name: true
//                 }
//               },

//               qualification_pack: {
//                 select: {
//                   qualification_pack_name: true,
//                   qualification_pack_id: true,
//                   nsqf_level: true
//                 }
//               },

//               training_partner: {
//                 select: {
//                   company_name: true
//                 }
//               }
//             }
//           }
//         }
//       });

//     logTime(
//       "candidate query",
//       t3
//     );

//     if (!candidate) {

//       return NextResponse.json(
//         {
//           success: false,
//           message:
//             "Candidate not found"
//         },
//         { status: 404 }
//       );
//     }

//     // ================= BASE64 IMAGES =================

//     const agencyLogo =
//       agencyData?.avatar
//         ? imageToBase64(
//           getAgencyImagePath(
//             Number(
//               agencyId
//             ),
//             agencyData.avatar
//           )
//         )
//         : "";

//     const agencyStamp =
//       agencyData?.sign_image
//         ? imageToBase64(
//           getAgencyImagePath(
//             Number(
//               agencyId
//             ),
//             `sign/${agencyData.sign_image}`
//           )
//         )
//         : "";

//     // ================= QR =================

//     const qrCode =
//       await QRCode.toDataURL(
//         `certificate-${candidate.id}`
//       );
//     // const qrCode = QRCode

//     // ================= DATA =================

//     const data = {

//       agency_name:
//         agencyData?.company_name || "",

//       agency_logo:
//         agencyLogo,

//       agency_stamp:
//         agencyStamp,

//       head_name:
//         `${agencyData?.first_name || ""}
//          ${agencyData?.last_name || ""}`.trim(),

//       candidate_name:
//         candidate.candidate_name,

//       father_name:
//         candidate.gender === "m"
//           ? `S/O ${candidate.father_name}`
//           : candidate.gender === "f"
//             ? `D/O ${candidate.father_name}`
//             : `C/O ${candidate.father_name}`,

//       qp_name:
//         `${candidate.batch.qualification_pack.qualification_pack_name}
//         (${candidate.batch.qualification_pack.qualification_pack_id})`,

//       qp_level:
//         candidate.batch.qualification_pack.nsqf_level,

//       scheme:
//         candidate.batch.scheme.scheme_name,

//       tp_name:
//         candidate.batch.training_partner.company_name,

//       qr_code:
//         qrCode
//     };

//     // ================= HTML =================

//     const t4 = now();

//     let html =
//       template.html;

//     Object.entries(data).forEach(
//       ([key, value]) => {

//         html =
//           html.replaceAll(
//             `{{${key}}}`,
//             String(value || "")
//           );
//       }
//     );

//     // ================= CONVERT STORAGE IMAGES TO BASE64 =================

//     // background-image: url('/storage/...')

//     html = html.replace(

//       /url\(\s*(['"]?)\s*(\/storage\/[^'")\s]+)\s*\1\s*\)/g,

//       (_, __, filePath) => {

//         const base64 =
//           fileToBase64Url(filePath);

//         return `url("${base64}")`;
//       }
//     );

//     // <img src="/storage/...">

//     html = html.replace(

//       /src\s*=\s*(['"])\s*(\/storage\/[^'"\s>]+)\s*\1/g,

//       (_, quote, filePath) => {

//         const base64 =
//           fileToBase64Url(filePath);

//         return `src="${base64}"`;
//       }
//     );

//     // ================= REMOVE REMAINING PLACEHOLDERS =================

//     html = html.replace(
//       /{{(.*?)}}/g,
//       ""
//     );

//     logTime(
//       "HTML generation",
//       t4
//     );

//     // ================= FINAL HTML =================

//     const finalHtml = `
//       <!DOCTYPE html>

//       <html>

//         <head>

//           <meta charset="UTF-8" />

//           <style>

//             html,
//             body {

//               margin: 0;
//               padding: 0;
//             }

//           </style>

//         </head>

//         <body>

//           ${html}

//         </body>

//       </html>
//     `;

//     // ================= BROWSER =================

//     const t5 = now();

//     const browser =
//       await getBrowser();

//     logTime(
//       "browser launch",
//       t5
//     );

//     // ================= PAGE =================

//     const page =
//       await browser.newPage();

//     page.setDefaultNavigationTimeout(
//       0
//     );

//     // ================= VIEWPORT =================

//     const config: any =
//       template.config;

//     await page.setViewport({

//       width:
//         config.width,

//       height:
//         config.height
//     });

//     await page.emulateMediaType(
//       "screen"
//     );

//     // ================= LOAD HTML =================

//     const t6 = now();

//     await page.setContent(
//       finalHtml,
//       {
//         waitUntil:
//           "domcontentloaded"
//       }
//     );

//     logTime(
//       "page setContent",
//       t6
//     );

//     // ================= WAIT FOR IMAGES =================

//     const t7 = now();

//     await page.evaluate(async () => {

//       const images =
//         Array.from(
//           document.images
//         );

//       await Promise.all(
//         images.map((img) => {

//           if (img.complete) {
//             return Promise.resolve();
//           }

//           return new Promise(
//             (resolve) => {

//               img.onload =
//                 resolve;

//               img.onerror =
//                 resolve;
//             }
//           );
//         })
//       );
//     });

//     logTime(
//       "wait for images",
//       t7
//     );

//     // ================= PDF =================

//     const t8 = now();

//     const pdf =
//       await page.pdf({

//         width:
//           `${config.width}px`,

//         height:
//           `${config.height}px`,

//         printBackground: true,

//         margin: {
//           top: "0px",
//           right: "0px",
//           bottom: "0px",
//           left: "0px"
//         }
//       });

//     logTime(
//       "PDF generation",
//       t8
//     );

//     // ================= CLEANUP =================

//     await page.close();

//     logTime(
//       "Total execution time",
//       totalStart
//     );

//     // ================= RESPONSE =================

//     return new NextResponse(
//       Buffer.from(pdf),
//       {

//         status: 200,

//         headers: {

//           "Content-Type":
//             "application/pdf",

//           "Content-Disposition":
//             `inline; filename=certificate-${Date.now()}.pdf`
//         }
//       }
//     );

//   } catch (error: any) {

//     console.error(error);

//     return NextResponse.json(
//       {
//         success: false,
//         message:
//           error?.message ||
//           "Internal server error"
//       },
//       { status: 500 }
//     );
//   }
// }
