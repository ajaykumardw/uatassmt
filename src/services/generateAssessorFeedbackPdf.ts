import fs from 'fs';

import path from "path";

import { parse, format } from "date-fns"

import prisma from "@/libs/prisma"
import { getBrowser } from "@/libs/puppeteerBrowser"

import { storageFolders, getAgencyImagePath } from "@/configs/customDataConfig";

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

const dateFormats = [
  'dd-MMM-yyyy hh:mm a',
  'dd-MMM-yyyy',
  'dd-MM-yyyy',
  'dd/MM/yyyy',
  'dd MMM yyyy'
];

const formatDateValue = (value?: string | null) => {

  if (!value) {
    return ''
  }

  for (const dateFormat of dateFormats) {

    const parsed = parse(value, dateFormat, new Date())

    if (!isNaN(parsed.getTime())) {
      return format(parsed, 'dd-MM-yyyy')
    }
  }

  return value
};

export async function generateAssessorFeedbackPdf(
  batchId: number
) {
  const feedbackResponse = await prisma.feedback_responses.findFirst({
    where: {
      batch_id: batchId,
      user_type: 2
    },
    include: {
      feedback_form: {
        include: {
          feedback_questions: {
            orderBy: {
              id: 'asc'
            }
          }
        }
      },
      feedback_response_answers: {
        include: {
          feedback_question: true
        }
      }
    }
  })

  if (!feedbackResponse) {
    return
  }

  const batch = await prisma.batches.findUnique({
    where: { id: batchId },
    select: {
      training_partner: {
        select: {
          company_name: true
        }
      },
      agency: {
        select: {
          id: true,
          avatar: true,
          company_name: true,
          address: true,
          pin_code: true
        }
      }
    }
  })

  let agencyLogoBase64 = ''

  const agency = batch?.agency

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

  const answerMap = new Map(
    feedbackResponse.feedback_response_answers.map(answer => [
      answer.feedback_question_id,
      answer
    ])
  )

  const questions = feedbackResponse.feedback_form.feedback_questions

  const isInfoQuestion = (question: { question: string; question_type: number }) =>
    question.question_type === 3 &&
    !/overall remarks/i.test(question.question) &&
    !/reason/i.test(question.question)

  const infoEntries: { label: string; value: string }[] = questions
    .filter(isInfoQuestion)
    .map(question => ({
      label: question.question,
      value: /date of assessment/i.test(question.question)
        ? formatDateValue(answerMap.get(question.id)?.answer_value)
        : answerMap.get(question.id)?.answer_value || ''
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
      const answer = answerMap.get(question.id)

      const answerValue = answer?.answer_value || ''

      if (/reason/i.test(question.question)) {
        return `
          <tr>
            <td><b>${question.question} :</b></td>
            <td colspan="2">${answerValue}</td>
          </tr>
        `
      }

      const yesChecked =
        answerValue.toLowerCase() === 'yes' ||
        answerValue.toLowerCase() === 'y'

      const noChecked =
        answerValue.toLowerCase() === 'no' ||
        answerValue.toLowerCase() === 'n'

      return `
        <tr>
          <td><b>${question.question} :</b></td>
          <td class="center">${yesChecked ? '☑' : '☐'}</td>
          <td class="center">${noChecked ? '☑' : '☐'}</td>
        </tr>
      `
    })
    .join('')

  const remarksAnswer =
    questions.find(
      question => /overall remarks/i.test(question.question)
    )?.id

  const remarksValue =
    remarksAnswer
      ? answerMap.get(remarksAnswer)?.answer_value || ''
      : ''

  const signatureQuestion =
    questions.find(question => /signature/i.test(question.question))

  let signatureHtml = ''

  if (signatureQuestion) {
    const signatureAnswer = answerMap.get(signatureQuestion.id)

    if (signatureAnswer?.file) {

      const signaturePath = path.join(
        process.cwd(),
        storageFolders.storage,
        storageFolders.uploads,
        storageFolders.agency,
        storageFolders.batches,
        batchId.toString(),
        'feedback_response_signature',
        signatureAnswer.file
      )

      if (fs.existsSync(signaturePath)) {
        signatureHtml = `
          <div class="signature-box">
            <img src="${imageToBase64(signaturePath)}" class="signature-image" />
          </div>
        `
      }
    }
  }

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
  margin-bottom: 8px;
}

.logo-line {
  margin-bottom: 4px;
  margin-top: 2px;
  text-align: center;
}

.logo-line img {
  max-height: 34px;
  max-width: 90px;
  object-fit: contain;
}

.company-block {
  text-align: right;
  max-width: 250px;
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
  max-width: 220px;
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
  margin: 8px 0 0;
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

.signature-image {
  max-height: 50px;
  max-width: 240px;
  object-fit: contain;
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

  <div class="remarks-box">
    ${remarksValue}
  </div>
</div>

<div class="signature-section">
  <div class="signature-label">Assessor's Signature :</div>
  ${signatureHtml}
</div>

</body>
</html>
`

  const browser = await getBrowser();

  let page = null;

  try {
    page = await browser.newPage()

    await page.setContent(html, {
      waitUntil: 'load',
      timeout: 60000
    })

    const filename = `assessor-feedback.pdf`

    const uploadDir = path.join(process.cwd(), storageFolders.storage, storageFolders.uploads, storageFolders.agency, storageFolders.batches, batchId.toString(), "assessor_feedback");

    try {
      fs.mkdirSync(uploadDir, { recursive: true });
    } catch (err) {
      console.error('Error creating upload directory:', err);
      throw new Error('Failed to create upload directory');
    }

    const filePath = path.join(uploadDir, filename);

    await page.pdf({
      path: filePath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '6mm',
        bottom: '6mm',
        left: '8mm',
        right: '8mm'
      }
    })

    return filePath;

  } catch (error) {

    console.error('Error generating PDF:', error)
    throw error;

  } finally {

    if (page) {
      await page.close();
    }
  }
}
