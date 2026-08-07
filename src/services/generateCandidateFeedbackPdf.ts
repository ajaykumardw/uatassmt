import fs from 'fs';

import path from "path";

import { format } from "date-fns"

import prisma from "@/libs/prisma"
import { getBrowser } from "@/libs/puppeteerBrowser"
import { decrypt, maskAadhaar } from "@/utils/encryption"

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

export async function generateCandidateFeedbackPdf(
  batchId: number
) {
  const responses = await prisma.feedback_responses.findMany({
    where: {
      batch_id: batchId,
      user_type: 1
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
      feedback_response_answers: true
    }
  })

  if (responses.length === 0) {
    return []
  }

  const studentIds = responses.map(response => response.user_id)

  const students = await prisma.students.findMany({
    where: {
      id: { in: studentIds }
    },
    select: {
      id: true,
      candidate_id: true,
      candidate_name: true,
      aadhaar_no: true,
      image: true
    }
  })

  const studentMap = new Map(
    students.map(student => [student.id, student])
  )

  const batch = await prisma.batches.findUnique({
    where: { id: batchId },
    select: {
      batch_name: true,
      qualification_pack: {
        select: {
          qualification_pack_name: true
        }
      },
      training_partner: {
        select: {
          company_name: true
        }
      },
      training_center: {
        select: {
          company_name: true,
          address: true,
          city: {
            select: {
              city_name: true
            }
          },
          state: {
            select: {
              state_name: true
            }
          }
        }
      },
      agency: {
        select: {
          id: true,
          avatar: true,
          company_name: true
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

  const browser = await getBrowser();

  const files: string[] = [];

  for (const feedbackResponse of responses) {

    const student = studentMap.get(feedbackResponse.user_id)

    if (!student) {
      continue
    }

    let attendanceSelfieHtml = ''

    if (student.image) {

      const imagePath = path.join(
        process.cwd(),
        storageFolders.storage,
        storageFolders.uploads,
        storageFolders.agency,
        storageFolders.batches,
        batchId.toString(),
        storageFolders.student,
        student.id.toString(),
        storageFolders.images,
        student.image
      )

      if (fs.existsSync(imagePath)) {
        attendanceSelfieHtml = `
          <div class="attendance-box">
            <img src="${imageToBase64(imagePath)}" class="attendance-image" />
          </div>
        `
      }
    }

    const answerMap = new Map(
      feedbackResponse.feedback_response_answers.map(answer => [
        answer.feedback_question_id,
        answer
      ])
    )

    const questionsHtml =
      feedbackResponse.feedback_form.feedback_questions
        .map((question, index) => {
          const answer = answerMap.get(question.id)
          const answerValue = answer?.answer_value || ''

          let bodyHtml = ''

          if (question.question_type === 1) {
            const yesChecked =
              answerValue.toLowerCase() === 'yes' ||
              answerValue.toLowerCase() === 'y'

            const noChecked =
              answerValue.toLowerCase() === 'no' ||
              answerValue.toLowerCase() === 'n'

            bodyHtml = `
              <div class="answer">
                <span class="option">${yesChecked ? '☑' : '☐'} Yes</span>
                <span class="option">${noChecked ? '☑' : '☐'} No</span>
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
                  <span class="option">${answerValue === option ? '☑' : '☐'} ${option}</span>
                `).join('')}
              </div>
            `
          } else if (question.question_type === 3) {
            bodyHtml = `
              <div class="answer">
                <div class="text-answer">${answerValue || ''}</div>
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

    const signatureAnswer =
      feedbackResponse.feedback_response_answers.find(
        answer => answer.file
      )

    let signatureHtml = ''

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

.attendance-box {
  position: absolute;
  top: 0;
  right: 0;
  text-align: center;
}

.attendance-image {
  max-height: 80px;
  max-width: 80px;
  object-fit: contain;
  border: 1px solid #ccc;
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

.signature-image {
  max-height: 80px;
  max-width: 300px;
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
  ${attendanceSelfieHtml}
  ${agencyLogoBase64 ? `
  <div class="agency-logo">
    <img src="${agencyLogoBase64}" alt="Agency Logo" />
  </div>
  ` : ''}

  <div class="company">
    ${agencyName || 'Vistaskills Private Limited'}
  </div>

  <div class="title">
    ${feedbackResponse.feedback_form.form_name}
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
    <td>${format(feedbackResponse.submitted_at, 'dd-MM-yyyy')}</td>
    <td><b>Location</b></td>
    <td>${trainingCenterLocation}</td>
  </tr>

  <tr>
    <td><b>Batch ID</b></td>
    <td>${batch?.batch_name || batchId}</td>
    <td><b>Candidate Name</b></td>
    <td>${student.candidate_name}</td>
  </tr>

  <tr>
    <td><b>Candidate ID</b></td>
    <td>${student.candidate_id}</td>
    <td><b>Candidate Aadhaar</b></td>
    <td>${student.aadhaar_no ? maskAadhaar(decrypt(student.aadhaar_no)) : ''}</td>
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
  <div class="signature-label">Candidate's Signature:</div>
  ${signatureHtml}
</div>

</body>
</html>
`

    const page = await browser.newPage()

    try {
      await page.setContent(html, {
        waitUntil: 'load',
        timeout: 60000
      })

      const uploadDir = path.join(
        process.cwd(),
        storageFolders.storage,
        storageFolders.uploads,
        storageFolders.agency,
        storageFolders.batches,
        batchId.toString(),
        storageFolders.student,
        student.id.toString(),
        'feedback'
      )

      try {
        fs.mkdirSync(uploadDir, { recursive: true });
      } catch (err) {
        console.error('Error creating upload directory:', err);
        throw new Error('Failed to create upload directory');
      }

      const filePath = path.join(uploadDir, `${student.candidate_id}_feedback.pdf`);

      await page.pdf({
        path: filePath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          bottom: '10mm',
          left: '10mm',
          right: '10mm'
        }
      })

      files.push(filePath)

    } catch (error) {

      console.error(`Error generating PDF for candidate ${student.candidate_id}:`, error)

    } finally {

      await page.close()
    }
  }

  return files
}
