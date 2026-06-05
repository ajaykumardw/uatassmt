import fs from 'fs';

import path from "path";

// import { pipeline } from 'stream/promises';

import prisma from "@/libs/prisma"
import { getBrowser } from "@/libs/puppeteerBrowser"
import { storageFolders } from "@/configs/customDataConfig";

export async function generateAssessorFeedbackPdf(
  batchId: number
) {
  const feedbackResponse = await prisma.feedback_responses.findFirst({
    where: {
      batch_id: batchId,
      user_type: 2
    },
    include: {
      batch: {
        select: {
          id: true,
          batch_name: true
        }
      },
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

  if (!feedbackResponse.batch) {
    return
  }

  const answerMap = new Map(
    feedbackResponse.feedback_response_answers.map(answer => [
      answer.feedback_question_id,
      answer.answer_value || ''
    ])
  )

  const questionsHtml =
    feedbackResponse.feedback_form.feedback_questions
      .map(question => {
        const answer = answerMap.get(question.id) || ''

        const yesChecked =
          answer.toLowerCase() === 'yes' ||
          answer.toLowerCase() === 'y'

        const noChecked =
          answer.toLowerCase() === 'no' ||
          answer.toLowerCase() === 'n'

        return `
          <tr>
            <td>${question.question}</td>
            <td class="center">${yesChecked ? '☑' : '☐'}</td>
            <td class="center">${noChecked ? '☑' : '☐'}</td>
          </tr>
        `
      })
      .join('')

  const remarksAnswer =
    feedbackResponse.feedback_response_answers.find(
      x =>
        x.feedback_question.question
          .toLowerCase()
          .includes('overall remarks')
    )?.answer_value || ''

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

.center {
  text-align: center;
}

.info-table td {
  height: 28px;
}

.remarks-box {
  border: 1px solid #000;
  min-height: 80px;
  padding: 10px;
}

.signature {
  margin-top: 40px;
}

.label {
  font-weight: bold;
}
</style>
</head>

<body>

<div class="header">
  <div class="company">
    Vistaskills Private Limited<br/>
    Office No. 319, Block A, 3rd Floor,<br/>
    Chandigarh Citi Center (CCC),<br/>
    VIP Road, Zirakpur, Punjab - 140603
  </div>

  <div class="title">
    ASSESSOR'S FEEDBACK FORM
  </div>
</div>

<table class="info-table">
  <tr>
    <td><b>Assessor's Name</b></td>
    <td></td>
    <td><b>Assessment Agency Name</b></td>
    <td></td>
  </tr>

  <tr>
    <td><b>Assessor's Identity Number</b></td>
    <td></td>
    <td><b>Training Center Name</b></td>
    <td></td>
  </tr>

  <tr>
    <td><b>Center ID</b></td>
    <td></td>
    <td><b>Batch ID</b></td>
    <td>${batchId}</td>
  </tr>

  <tr>
    <td><b>Date of Assessment</b></td>
    <td>${feedbackResponse.submitted_at.toLocaleDateString()}</td>
    <td><b>Training Partner Name</b></td>
    <td></td>
  </tr>
</table>

<br/>

<table>
  <thead>
    <tr>
      <th style="width:80%">Question</th>
      <th style="width:10%">Yes</th>
      <th style="width:10%">No</th>
    </tr>
  </thead>

  <tbody>
    ${questionsHtml}
  </tbody>
</table>

<br/>

<div>
  <div class="label">Overall Remarks:</div>

  <div class="remarks-box">
    ${remarksAnswer}
  </div>
</div>

<div class="signature">
  <b>Assessor's Signature :</b>
</div>

</body>
</html>
`

  const browser = await getBrowser();

  let page = null;

  try {
    page = await browser.newPage()

    await page.setContent(html, {
      waitUntil: 'networkidle0'
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
        top: '10mm',
        bottom: '10mm',
        left: '10mm',
        right: '10mm'
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
