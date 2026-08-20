import fs from 'fs';

import path from "path";

import prisma from "@/libs/prisma"
import { getBrowser } from "@/libs/puppeteerBrowser"

import { getAgencyImagePath } from "@/configs/customDataConfig";

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

export async function generateTrainingProviderFeedbackPdf(
  batch: any
): Promise<Buffer> {
  const feedbackForm = await prisma.feedback_forms.findFirst({
    where: { form_type: 3 },
    orderBy: { id: 'desc' },
    include: {
      feedback_questions: {
        orderBy: { id: 'asc' }
      }
    }
  })

  const agency = batch?.agency

  let agencyLogoBase64 = ''

  if (agency?.avatar) {
    const logoPath = path.join(
      process.cwd(),
      getAgencyImagePath(agency.id, agency.avatar)
    )

    if (fs.existsSync(logoPath)) {
      agencyLogoBase64 = imageToBase64(logoPath)
    }
  }

  const agencyName = agency?.company_name || ''

  const jobRole = batch?.qualification_pack?.qualification_pack_name || ''

  const trainingProviderName = batch?.training_partner?.company_name || ''

  const trainingCenter = batch?.training_center

  const trainingCenterName = trainingCenter?.company_name || ''

  const trainingCenterLocation = [
    trainingCenterName,
    trainingCenter?.address,
    trainingCenter?.city?.city_name,
    trainingCenter?.state?.state_name
  ].filter(Boolean).join(', ')

  const students = batch?.students || []

  const batchSize = students.length

  const noOfAssessed = students.filter((s: any) => s?.attendance === 1).length

  const questions =
    (feedbackForm?.feedback_questions || [])
      .filter(question => question.question_type !== 4)

  const questionsHtml = questions
    .map((question, index) => {
      let bodyHtml = ''

      if (question.question_type === 1) {
        bodyHtml = `
          <div class="answer">
            <span class="option">☐ Yes</span>
            <span class="option">☐ No</span>
          </div>
        `
      } else if (question.question_type === 2) {
        const options = [
          question.option1,
          question.option2,
          question.option3,
          question.option4
        ].filter(Boolean)

        bodyHtml = `
          <div class="answer">
            ${options.map(option => `
              <span class="option">☐ ${option}</span>
            `).join('')}
          </div>
        `
      } else if (question.question_type === 3) {
        bodyHtml = `
          <div class="answer">
            <div class="text-answer"></div>
          </div>
        `
      } else {
        return null
      }

      return `
        <tr>
          <td class="q-no">${index + 1}</td>
          <td class="q-text">${question.question}</td>
          <td class="q-answer">${bodyHtml}</td>
        </tr>
      `
    })
    .filter(Boolean)
    .join('')

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
body {
  font-family: Arial, sans-serif;
  font-size: 12px;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 20px;
}

.agency-logo {
  margin-bottom: 8px;
}

.agency-logo img {
  max-height: 70px;
  max-width: 120px;
  object-fit: contain;
}

.watermark {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.12;
  z-index: -1;
  pointer-events: none;
}

.watermark img {
  width: 400px;
  height: 400px;
  object-fit: contain;
}

.company {
  font-size: 12px;
  line-height: 18px;
}

.title {
  font-size: 18px;
  font-weight: bold;
  margin-top: 10px;
  text-decoration: underline;
}

table {
  width: 100%;
  border-collapse: collapse;
}

td, th {
  border: 1px solid #000;
  padding: 6px;
  vertical-align: top;
}

.info-table td {
  height: 28px;
}

.label {
  font-weight: bold;
}

.answer {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.option {
  white-space: nowrap;
}

.text-answer {
  min-height: 20px;
}

.q-no {
  width: 8%;
  text-align: center;
}

.q-answer {
  width: 35%;
}

.signature-section {
  margin-top: 30px;
}

.signature-label {
  font-weight: bold;
  margin-bottom: 8px;
}

.signature-box {
  border: 1px solid #000;
  min-height: 80px;
  padding: 10px;
  display: flex;
  align-items: center;
}
</style>
</head>

<body>

${agencyLogoBase64 ? `
<div class="watermark">
  <img src="${agencyLogoBase64}" />
</div>
` : ''}

<div class="header">
  ${agencyLogoBase64 ? `
  <div class="agency-logo">
    <img src="${agencyLogoBase64}" alt="Agency Logo" />
  </div>
  ` : ''}

  <div class="company">
    ${agencyName}
  </div>

  <div class="title">
    ${feedbackForm?.form_name || 'Training Provider Feedback Form'}
  </div>
</div>

<table class="info-table">
  <tr>
    <td><b>Title of Training Course (Job Role)</b></td>
    <td>${jobRole}</td>
    <td><b>Name of Training Provider</b></td>
    <td>${trainingProviderName}</td>
  </tr>

  <tr>
    <td><b>Date</b></td>
    <td></td>
    <td><b>Batch ID</b></td>
    <td>${batch?.batch_name || ''}</td>
  </tr>

  <tr>
    <td><b>Batch Size</b></td>
    <td>${batchSize}</td>
    <td><b>No. of Assessed</b></td>
    <td>${noOfAssessed}</td>
  </tr>

  <tr>
    <td><b>Location</b></td>
    <td colspan="3">${trainingCenterLocation}</td>
  </tr>
</table>

<br/>

<table>
  <thead>
    <tr>
      <th>S.No</th>
      <th>Question</th>
      <th>Answer</th>
    </tr>
  </thead>

  <tbody>
    ${questionsHtml}
  </tbody>
</table>

<div class="signature-section">
  <div class="signature-label">TP/Centre Incharge's Signature:</div>
  <div class="signature-box"></div>
</div>

</body>
</html>
`

  const browser = await getBrowser();

  const page = await browser.newPage()

  try {
    await page.setContent(html, {
      waitUntil: 'load',
      timeout: 60000
    })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        bottom: '10mm',
        left: '10mm',
        right: '10mm'
      }
    })

    return Buffer.from(pdfBuffer)

  } catch (error) {

    console.error(`Error generating Training Provider Feedback PDF for batch ${batch?.id}:`, error)

    throw error

  } finally {

    await page.close()
  }
}
