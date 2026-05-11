// workers/certificateWorker.ts

import path from "path";

import { format } from "date-fns";

import { toDataURL } from "qrcode";

import { type Job } from "bullmq";

import pLimit from "p-limit";

import prisma from "@/libs/prisma";

import { generateCertificatesZip } from "@/services/certificate/generateCertificatePdf";

import { getAgencyImagePath } from "@/configs/customDataConfig";

import { getFY } from "@/utils/getFY";

// ================= PROCESS =================

export const processCertificate = async (
  job: Job
) => {

  const { jobId } = job.data;

  if (!jobId) {
    throw new Error("Invalid job data");
  }

  try {

    // ================= UPDATE JOB =================

    const dbJob =
      await prisma.jobs.update({

        where: {
          id: Number(jobId)
        },

        data: {
          status: "processing"
        }
      });

    // ================= BATCH =================

    const batch =
      await prisma.batches.findUnique({

        where: {
          id: Number(
            dbJob.reference_id
          )
        },

        select: {

          id: true,

          batch_name: true,

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
                  state_code: true
                }
              }
            }
          },

          students: {

            where: {
              result: "pass"
            },

            select: {
              id: true,
              candidate_id: true,
              candidate_name: true,
              father_name: true,
              gender: true,
              certificate_no: true
            }
          }
        }
      });

    if (!batch) {
      throw new Error(
        "Batch not found"
      );
    }

    const agency =
      batch.agency;

    const tp =
      batch.training_partner;

    const candidates =
      batch.students || [];

    if (!candidates.length) {
      throw new Error(
        "No passed candidates found"
      );
    }

    // ================= TEMPLATE =================

    const template =
      await prisma.certificate_template.findFirst({

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

    // ================= STATIC DATA =================

    const agencyLogo =
      agency?.avatar
        ? "/" + getAgencyImagePath(
          agency.id,
          agency.avatar
        )
        : "";

    const agencyStamp =
      agency?.sign_image
        ? "/" + getAgencyImagePath(
          agency.id,
          `sign/${agency.sign_image}`
        )
        : "";

    const issueDate =
      format(
        new Date(),
        "dd/MM/yyyy"
      );

    // ================= PREPARED HTML =================

    let preparedHtml =
      template.html;

    const staticData = {

      agency_name:
        agency?.company_name || "",

      agency_logo:
        agencyLogo,

      agency_stamp:
        agencyStamp,

      head_name:
        `${agency?.first_name || ""} ${agency?.last_name || ""}`.trim(),

      qp_name:
        `${batch.qualification_pack.qualification_pack_name} (${batch.qualification_pack.qualification_pack_id})`,

      qp_level:
        batch.qualification_pack.nsqf_level,

      scheme:
        batch.scheme.scheme_name || "",

      tp_name:
        tp?.company_name || "",

      issue_date:
        issueDate
    };

    Object.entries(
      staticData
    ).forEach(
      ([key, value]) => {

        preparedHtml =
          preparedHtml.replaceAll(
            `{{${key}}}`,
            String(value || "")
          );
      }
    );

    // ================= CANDIDATE DATA =================

    const limit =
      pLimit(10);

    const certificateData =
      await Promise.all(

        candidates.map(
          (candidate) =>
            limit(
              async () => {

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

                const systemIdNo =
                  `${batch.scheme.scheme_name.trim()}/${getFY()}/${tp?.state?.state_code || ""}${tp?.user_name?.trim() || ""}/${batch.batch_name?.trim()}/${candidate.candidate_id.trim()}`;

                return {

                  candidate_id:
                    candidate.candidate_id,

                  candidate_name:
                    candidate.candidate_name,

                  father_name:
                    candidate.gender === "m"
                      ? `S/O ${candidate.father_name}`
                      : candidate.gender === "f"
                        ? `D/O ${candidate.father_name}`
                        : `C/O ${candidate.father_name}`,

                  qr_code:
                    qrCode,

                  certificate_no:
                    candidate.certificate_no || "",

                  system_identification_no:
                    systemIdNo
                };
              }
            )
        )
      );

    // ================= ZIP PATH =================

    const safeBatchName = batch && batch.batch_name ? batch?.batch_name.trim()
      .replace(/[<>:"/\\|?*]+/g, "_") : "Batch";

    const zipFileName =
      `${safeBatchName}-certificate.zip`;

    const folderPath =
      path.join(
        process.cwd(),
        "storage",
        "uploads",
        "zips",
        "certificates"
      );

    const zipPath =
      path.join(
        folderPath,
        zipFileName
      );

    // ================= GENERATE ZIP =================

    await generateCertificatesZip(

      preparedHtml,

      template.config as any,

      certificateData,

      zipPath,
      async (
        progress,
        completed,
        total
      ) => {

        // bullmq progress

        await job.updateProgress({
          progress,
          completed,
          total
        });

        // database progress

        await prisma.jobs.update({

          where: {
            id: dbJob.id
          },

          data: {

            progress,
          }
        });
      }
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
          error.message ||
          "Certificate generation failed"
      }
    });
  }
};
