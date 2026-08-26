import fs from 'fs';

import path from "path";

import prisma from "@/libs/prisma";

import { getBrowser } from "@/libs/puppeteerBrowser";

import { storageFolders } from "@/configs/customDataConfig";

const imageToBase64 = (filePath: string) => {

  const ext = path.extname(filePath).toLowerCase();

  const mimeType =
    ext === '.png'
      ? 'image/png'
      : ext === '.webp'
        ? 'image/webp'
        : 'image/jpeg';

  const buffer = fs.readFileSync(filePath);

  const base64 = `data:${mimeType};base64,${buffer.toString('base64')}`;

  return base64;
};

export async function generateCandidateAadhaarPdf(
  batchId: number
) {
  const students = await prisma.students.findMany({
    where: {
      batch_id: batchId,
    },
    select: {
      id: true,
      candidate_id: true,
      candidate_name: true,
      id_front_image: true,
      id_back_image: true,
    }
  });

  const browser = await getBrowser();

  const files: string[] = [];

  for (const student of students) {

    const relativePath = path.posix.join(
      storageFolders.storage,
      storageFolders.uploads,
      storageFolders.agency,
      storageFolders.batches,
      batchId.toString(),
      storageFolders.student,
      student.id.toString(),
      storageFolders.images
    );

    const aadhaarFront = student.id_front_image ? path.join(process.cwd(), relativePath, student.id_front_image) : null;
    const aadhaarBack = student.id_back_image ? path.join(process.cwd(), relativePath, student.id_back_image) : null;

    // console.log(`Processing student ID ${student.id} - Aadhaar Front: ${aadhaarFront}, Aadhaar Back: ${aadhaarBack}`);

    if (
      !aadhaarFront ||
      !aadhaarBack ||
      !fs.existsSync(aadhaarFront) ||
      !fs.existsSync(aadhaarBack)
    ) {

      // console.warn(`Aadhaar images not found for student ID ${student.id}. Skipping PDF generation for this student.`);

      continue;
    }

    const aadhaarFrontBase64 = imageToBase64(aadhaarFront);
    const aadhaarBackBase64 = imageToBase64(aadhaarBack);


    const page = await browser.newPage();

    const htmlContent = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0.5in;
              border: 2px solid black;
            }
            .aadhaar-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 20px;
            }
            .candidate {
            	display: flex;
              flex-direction: column;
              align-items: start;
              margin-bottom: 80px;
            }
            .candidate-id {
              font-size: 14px;
              font-weight: bold;
            }
            .aadhaar-image {
              max-width: 400px;
              margin-bottom: 20px;
            }
            .aadhaar-image > div {
            	margin-bottom: 10px;
            }
            .aadhaar-image > img {
            	width: 100%;
              max-height: 380px;
              display: block;
            	object-fit: contain;
            }
          </style>
        </head>
        <body>
          <div class="aadhaar-container">
            <div class="candidate">
              <div class="candidate-id">Candidate Name: ${student.candidate_name}</div>
              <div class="candidate-id">Candidate ID: ${student.candidate_id}</div>
            </div>
            <div class="aadhaar-image">
            	<div>Aadhaar Front</div>
            	<img src="${aadhaarFrontBase64}" alt="Aadhaar Front">
            </div>
            <div class="aadhaar-image">
            	<div>Aadhaar Back</div>
            	<img src="${aadhaarBackBase64}" alt="Aadhaar Back">
            </div>
          </div>
        </body>
      </html>
    `;

    try {

      await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
      });

      const uploadDir = path.join(storageFolders.storage, storageFolders.uploads, storageFolders.agency, storageFolders.batches,
        batchId.toString(),
        storageFolders.student,
        student.id.toString(),
        "aadhaar");

      try {
        fs.mkdirSync(uploadDir, { recursive: true });
      } catch (err) {
        console.error('Error creating upload directory:', err);
        throw new Error('Failed to create upload directory');
      }

      const filePath = path.join(uploadDir, `${student.candidate_id}_aadhaar.pdf`);

      fs.writeFileSync(filePath, pdfBuffer);

      files.push(filePath);
    } catch (error) {
      console.error(`Error generating PDF for student ID ${student.id}:`, error);
    } finally {
      await page.close();
    }
  }

  return files;

}
