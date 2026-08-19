import fs from 'fs';

import path from "path";

import { format } from "date-fns"

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

export async function generateAssessorFeedbackBlankPdf(
  batch: any
): Promise<Buffer> {
  const feedbackForm = await prisma.feedback_forms.findFirst({
    where: { form_type: 2 },
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

  const trainingPartnerName = batch?.training_partner?.company_name || ''

  const trainingCenter = batch?.training_center

  const assessorName =
    [batch?.assessor?.first_name, batch?.assessor?.last_name]
      .filter(Boolean)
      .join(' ') || ''

  const completeAddress = [
    trainingCenter?.address,
    trainingCenter?.city?.city_name,
    trainingCenter?.state?.state_name
  ].filter(Boolean).join(', ')

  const students = batch?.students || []

  const totalCandidates = students.length

  const assessmentDate = batch?.assessment_start_datetime
    ? format(new Date(batch.assessment_start_datetime), 'dd-MM-yyyy')
    : ''

  const questions = feedbackForm?.feedback_questions || []

  const isInfoQuestion = (question: { question: string; question_type: number }) =>
    question.question_type === 3 &&
    !/overall remarks/i.test(question.question) &&
    !/reason/i.test(question.question)

  const resolveInfoValue = (label: string) => {
    if (/agency/i.test(label)) return agencyName
    if (/assessor's name/i.test(label)) return assessorName
    if (/identity number/i.test(label)) return batch?.assessor?.user_name || ''
    if (/training center/i.test(label)) return trainingCenter?.company_name || ''
    if (/complete address/i.test(label)) return completeAddress
    if (/center id/i.test(label)) return trainingCenter?.user_name || ''
    if (/batch id/i.test(label)) return batch?.batch_name || ''
    if (/job role/i.test(label)) return batch?.qualification_pack?.qualification_pack_name || ''
    if (/no\. of candidates|no of candidates/i.test(label)) return String(totalCandidates)
    if (/preferred language/i.test(label)) return ''
    if (/conducted in the language/i.test(label)) return ''
    if (/spoc name/i.test(label)) return batch?.center_spoc_person_name || `${trainingCenter?.first_name || ''} ${trainingCenter?.last_name || ''}`.trim()
    if (/date of assessment/i.test(label)) return assessmentDate
    
return ''
  }

  const infoEntries: { label: string; value: string }[] = questions
    .filter(isInfoQuestion)
    .map(question => ({
      label: question.question,
      value: resolveInfoValue(question.question)
    }))

  const trainingPartnerIndex =
    infoEntries.findIndex(entry => /identity number/i.test(entry.label))

  if (trainingPartnerIndex !== -1) {
    infoEntries.splice(trainingPartnerIndex + 1, 0, {
      label: 'Training Partner Name',
      value: trainingPartnerName
    })
  }

  const infoRowsHtml = infoEntries
    .reduce<{ label: string; value: string }[][]>((rows, entry, index) => {
      if (index % 2 === 0) {
        rows.push([entry])
      } else {
        rows[rows.length - 1].push(entry)
      }

      return rows

    }, [])
    .map(row => `
      <tr>
        ${row.map(entry => `
          <td><b>${entry.label} :</b> ${entry.value}</td>
        `).join('')}
        ${row.length === 1 ? '<td></td>' : ''}
      </tr>
    `)
    .join('')

  const questionRowsHtml = questions
    .filter(question =>
      question.question_type === 1 ||
      (question.question_type === 3 && /reason/i.test(question.question))
    )
    .map(question => {
      if (/reason/i.test(question.question)) {
        return `
          <tr>
            <td><b>${question.question} :</b></td>
            <td colspan="2"></td>
          </tr>
        `
      }

      return `
        <tr>
          <td><b>${question.question} :</b></td>
          <td class="center"></td>
          <td class="center"></td>
        </tr>
      `
    })
    .join('')

  const addressRaw = agency?.address || '';

  const addressHtml = `<div class="addr">${addressRaw}</div>`

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
body {
  font-family: Arial, sans-serif;
  font-size: 10px;
  padding: 10px;
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

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.logo-line {
  flex: 0 0 auto;
}

.logo-line img {
  max-height: 110px;
  max-width: 110px;
  object-fit: contain;
}

.company-block {
  text-align: right;
  max-width: 60%;
  margin-left: auto;
}

.company {
  font-size: 14px;
  line-height: 16px;
  font-weight: bold;
  color: #000;
  word-wrap: break-word;
}

.addr {
  margin-top: 4px;
  font-size: 11px;
  line-height: 14px;
  max-width: 240px;
  margin-left: auto;
  word-wrap: break-word;
}

.pin-line {
  text-align: center;
}

.title {
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  text-decoration: underline;
  margin: 14px 0 14px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

td, th {
  border: 1px solid #000;
  padding: 4px;
  vertical-align: top;
}

.center {
  text-align: center;
}

.info-table td {
  height: 22px;
}

.remarks-box {
  border: 1px solid #000;
  min-height: 45px;
  padding: 6px;
}

.signature-section {
  margin-top: 16px;
}

.signature-label {
  font-weight: bold;
  margin-bottom: 4px;
}

.signature-box {
  border: 1px solid #000;
  min-height: 50px;
  padding: 6px;
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
  <div class="logo-line">
    <img src="${agencyLogoBase64}" alt="Agency Logo" />
  </div>
  ` : ''}

  <div class="company-block">
    <div class="company">
      ${agencyName}
    </div>

    ${addressHtml}
  </div>
</div>

<div class="title">
  ASSESSOR'S FEEDBACK FORM
</div>

<table class="info-table">
  ${infoRowsHtml}
</table>

<br/>

<table>
  <tr>
    <th>Tick the appropriate answer</th>
    <th style="width:10%">Yes</th>
    <th style="width:10%">No</th>
  </tr>

  ${questionRowsHtml}
</table>

<br/>

<div>
  <div class="signature-label">Overall Remarks :</div>

  <div class="remarks-box"></div>
</div>

<div class="signature-section">
  <div class="signature-label">Assessor's Signature :</div>
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
        top: '6mm',
        bottom: '6mm',
        left: '8mm',
        right: '8mm'
      }
    })

    return Buffer.from(pdfBuffer)

  } catch (error) {

    console.error(`Error generating Assessor Feedback PDF for batch ${batch?.id}:`, error)

    throw error

  } finally {

    await page.close()
  }
}