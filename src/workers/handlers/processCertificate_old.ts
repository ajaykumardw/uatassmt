// workers/certificateWorker.ts

import path from "path";

// import { pathToFileURL } from "url";

import { format } from "date-fns";

import { toDataURL } from "qrcode";

import { type Job } from "bullmq";

import pLimit from "p-limit";

import prisma from "@/libs/prisma";

import { generateCertificatesZip } from "@/services/certificate/generateCertificatePdf_old";

import { getAgencyImagePath, STUDENT_RESULT } from "@/configs/customDataConfig";

import { getFY } from "@/utils/getFY";


// ================= HELPERS =================

// function toFileUrl(
//   relativePath: string
// ) {

//   return pathToFileURL(
//     path.resolve(relativePath)
//   ).href;
// }

// ================= PROCESS =================

export const processCertificate = async (
  job: Job
) => {

  const { jobId } = job.data;

  if (!jobId) {
    throw new Error("Invalid job data");
  }

  try {

    // mark processing

    const dbJob = await prisma.jobs.update({

      where: {
        id: Number(jobId)
      },

      data: {
        status: "processing"
      }
    });


    const batch = await prisma.batches.findUnique({

      where: {
        id: Number(dbJob.reference_id)
      },

      select: {
        id: true,
        batch_name: true,
        batch_completed: true,
        agency: {
          select: {
            id: true,
            company_name: true,
            avatar: true,
            sign_image: true,
            first_name: true,
            last_name: true
          }
        },
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
            user_name: true,
            company_name: true,
            state: {
              select: {
                state_code: true,
              }
            }
          }
        },
        students: {
          where: {
            result: STUDENT_RESULT.PASS
          },
          select: {
            id: true,
            candidate_id: true,
            candidate_name: true,
            father_name: true,
            gender: true,
            certificate_no: true,
          }
        }
      }
    });

    if (!batch) {
      throw new Error("Batch not found");
    }

    // if (!batch.batch_completed) {
    //   throw new Error("Batch is not completed yet");
    // }

    // ================= AGENCY =================
    const agency = batch?.agency;

    const tp = batch.training_partner;

    // ================= CANDIDATES =================
    const candidates = batch?.students || [];

    // ================= TEMPLATE =================

    const template = await prisma.certificate_template.findFirst({
      where: {
        agency_id: agency.id,
        is_active: true
      }
    });

    if (!template) {
      throw new Error(
        "Template not found"
      );
    }

    if (!candidates.length) {
      throw new Error(
        "No passed candidates found"
      );
    }

    // ================= IMAGES =================

    // const agencyLogo =
    //     agency?.avatar
    //         ? toFileUrl(
    //             getAgencyImagePath(
    //                 agency.id,
    //                 agency.avatar
    //             )
    //         )
    //         : "";

    // const agencyStamp =
    //     agency?.sign_image
    //         ? toFileUrl(
    //             getAgencyImagePath(
    //                 agency.id,
    //                 `sign/${agency.sign_image}`
    //             )
    //         )
    //         : "";

    const agencyLogo =
      agency?.avatar
        ?
        "/" + getAgencyImagePath(
          agency.id,
          agency.avatar
        )
        : "";

    const agencyStamp =
      agency?.sign_image
        ?
        "/" + getAgencyImagePath(
          agency.id,
          `sign/${agency.sign_image}`
        )
        : "";

    // ================= DATA =================

    const issueDate = format(
      new Date(),
      "dd/MM/yyyy"
    );

    const limit = pLimit(10);

    // const usedRandoms = new Set();

    // function getUniqueThreeDigits() {

    //     let num;

    //     do {
    //         num = Math.floor(100 + Math.random() * 900); // 100–999
    //     } while (usedRandoms.has(num));

    //     usedRandoms.add(num);

    //     return String(num);
    // }

    const certificateData =
      await Promise.all(

        candidates.map((candidate) =>
          limit(async () => {

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

            // const companyName = tp?.company_name || "";

            // let tpShortName = "";

            // const match = companyName.match(/\(([^)]+)\)/);

            // if (match) {

            //   // Case 1: If parentheses exist, take the value inside
            //   tpShortName = match[1];

            // } else {

            //   // Case 2: Otherwise, build initials from words
            //   tpShortName = companyName
            //     .split(" ")
            //     .map(word => word[0])
            //     .filter(char => /[A-Za-z]/.test(char)) // keep only letters
            //     .join("");
            // }

            const systemIdNo = `${batch.scheme.scheme_name.trim()}/${getFY()}/${tp?.state?.state_code || ""}${tp?.user_name?.trim() || ""}/${batch.batch_name?.trim()}/${candidate.candidate_id.trim()}`;

            // const uniqueNum = getUniqueThreeDigits();
            // const certificateNo = `VISTA|${tpShortName}|${tp?.state?.state_code || ""}|${uniqueNum}`;

            return {

              id: candidate.id,
              candidate_id: candidate.candidate_id,
              candidate_name: candidate.candidate_name,
              agency_name: agency?.company_name || "",
              agency_logo: agencyLogo,
              agency_stamp: agencyStamp,
              head_name: `${agency?.first_name || ""} ${agency?.last_name || ""}`.trim(),
              father_name: candidate.gender === "m" ? `S/O ${candidate.father_name}` : candidate.gender === "f" ? `D/O ${candidate.father_name}` : `C/O ${candidate.father_name}`,
              qp_name: `${batch.qualification_pack.qualification_pack_name} (${batch.qualification_pack.qualification_pack_id})`,
              qp_level: batch.qualification_pack.nsqf_level,
              scheme: batch.scheme.scheme_name || "",
              tp_name: tp?.company_name || "",
              qr_code: qrCode,
              certificate_no: candidate.certificate_no || "",
              issue_date: issueDate,
              system_identification_no: systemIdNo
            };
          })
        )
      );

    // ================= ZIP =================

    const safeBatchName = batch && batch.batch_name ? batch?.batch_name.trim()
      .replace(/[<>:"/\\|?*]+/g, "_") : "Batch";

    const zipFileName =
      `${safeBatchName}-certificate.zip`;

    const folderPath = path.join(
      process.cwd(),
      "storage",
      "uploads",
      "zips",
      "certificates"
    );

    const zipPath = path.join(
      folderPath,
      zipFileName
    );

    await generateCertificatesZip(

      template.html,

      template.config as any,

      certificateData,

      zipPath
    );

    // ================= COMPLETE =================

    await prisma.jobs.update({

      where: {
        id: dbJob.id
      },

      data: {

        status:
          "completed",

        file_path:
          `storage/uploads/zips/certificates/${zipFileName}`
      }
    });

  } catch (error: any) {

    await prisma.jobs.update({

      where: {
        id: jobId
      },

      data: {

        status:
          "failed",

        error_message:
          error.message || "An error occurred while generating certificates"
      }
    });
  }
}
