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

export async function generateAnnexureM2Pdf(batch: any): Promise<Buffer> {

  const agency = batch?.agency;

  let agencyLogoBase64 = '';

  if (agency?.avatar) {
    const logoPath = path.join(
      process.cwd(),
      getAgencyImagePath(agency.id, agency.avatar)
    )

    if (fs.existsSync(logoPath)) {
      agencyLogoBase64 = imageToBase64(logoPath)
    }
  }

  const agencyName = agency?.company_name || '';

  const addressRaw = agency?.address || '';

  const addressHtml = `<div class="addr">${addressRaw}</div>`

  const students = batch?.students || [];

  const totalCandidates = students.length;

  const assessorName =
    [batch?.assessor?.first_name, batch?.assessor?.last_name]
      .filter(Boolean)
      .join(' ') || ''

  const assessorId = batch?.assessor?.user_name || ''

  const centerHeadName =
    [batch?.training_center?.first_name, batch?.training_center?.last_name]
      .filter(Boolean)
      .join(' ') || ''

  const assessorAadhaar = await prisma.users_additional_data
    .findUnique({
      where: { user_id: batch?.assessor?.id }
    })
    .then(data => data?.aadhaar_no || '')
    .catch(() => '')

  const M2_ROWS: { label: string; value: string }[] = [
    { label: 'Assessment Agency Name :', value: agencyName },
    { label: 'Assessor\u2019s Name :', value: assessorName },
    { label: 'Assessor\u2019s Aadhar number :', value: assessorAadhaar },
    { label: 'Total No of candidates in the batch :', value: String(totalCandidates) },
    { label: 'No of candidates Present in the batch :', value: '' },
    { label: 'No of candidates Absent in the batch :', value: '' },
    { label: 'Training Partner name :', value: batch?.training_partner?.company_name || '' },
    { label: 'Training Center name :', value: batch?.training_center?.company_name || '' },
    { label: 'Actual Center SPOC Name :', value: '' },
    { label: 'Actual SPOC mobile no :', value: '' },
    { label: 'Center Id :', value: batch?.training_center?.user_name || '' },
    { label: 'Batch id :', value: batch?.batch_name || '' },
    { label: 'Job role for which assessment conducted :', value: batch?.qualification_pack?.qualification_pack_name || '' },
    { label: 'Sector Name :', value: batch?.qualification_pack?.ssc?.ssc_name || '' },
    { label: 'SPOC Aadhaar ID :', value: '' },
    { label: 'Alternate ID Number of SPOC (if any):', value: '' },
    { label: 'Student Preferred language of assessment', value: '' },
    { label: 'Assessment conducted in the language', value: '' },
    { label: 'Center Address on SDMS :', value: batch?.training_center?.address || '' },
    { label: 'Actual Center Address :', value: '' },
    { label: 'Actual Date of Assessment:', value: '' },
    { label: 'Assessment is conducted on the Scheduled Date ?, If No , Reasons for change of Date ?', value: '' },
    { label: 'Were the candidate the same as SDMS enrollment', value: '' },
    { label: 'Are the Trainees being assessed for same job role, for which they were trained ?', value: '' },
    { label: 'Receipts of Booklets issued to every candidate are verified by Assessor', value: '' },
    { label: 'Trainee Feedback form & Trainees Enrolment Forms available, and signed by the trainee ? (Each 5 Hard Copies & Photos)', value: '' },
    { label: 'Trainee Attendance Record Available, and signed by the trainees Photos', value: '' },
    { label: 'Are the trainees aware they are enrolled under PMKVY Scheme ?', value: '' },
    { label: 'Are the trainees aware of the Certification Process ?', value: '' },
    { label: 'Posters of PMKVY displayed in Counseling Room & Class Room Photos', value: '' },
    { label: 'Do the candidates have APPAR IDs or not?', value: '' }
  ];

  const rowsHtml = M2_ROWS
    .map((row, index) => `
      <tr>
        <td class="center no">${index + 1}</td>
        <td class="label">${row.label}</td>
        <td class="value">${row.value}</td>
        <td class="remark"></td>
      </tr>
    `)
    .join('')

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
  padding: 3px;
  vertical-align: middle;
}

th {
  font-size: 10px;
}

.center {
  text-align: center;
}

.no {
  width: 6%;
}

.label {
  width: 44%;
}

.value {
  width: 34%;
}

.remark {
  width: 16%;
}

.signature-section {
  margin-top: 16px;
  display: table;
  width: 100%;
}

.signature-col {
  display: table-cell;
  width: 50%;
  height: 120px;
  vertical-align: top;
}

.signature-col.right {
  text-align: right;
}

.signature-line {
  margin-bottom: 6px;
}

.signature-label {
  font-weight: bold;
  margin-top: 12px;
}

.note {
  margin-top: 18px;
  font-size: 9px;
  text-align: justify;
}
</style>
</head>

<body>

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
  Annexure (M2) Filled by Assessor
</div>

<table>
  <tr>
    <th>S. No.</th>
    <th>Details</th>
    <th>Details</th>
    <th>Remarks</th>
  </tr>

  ${rowsHtml}
</table>

<div class="signature-section">
  <div class="signature-col">
    <div class="signature-line"><b>Assessor's ID</b> - ${assessorId}</div>
    <div class="signature-line"><b>Assessor's Name</b> - ${assessorName}</div>
    <div class="signature-label">Assessor's Signature</div>
  </div>
  <div class="signature-col right">
    <div class="signature-line"><b>Center Head Name</b> - ${centerHeadName}</div>
    <div class="signature-label">Center Head Signature &amp; Stamp</div>
  </div>
</div>

<div class="note">
  Note: Kindly share all documents, photos, and videos in the created group. Please scan all documents properly and send them in PDF format. The hard copies should be duly compiled and sent to us through courier.
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

    return Buffer.from(pdfBuffer);

  } catch (error) {

    console.error('Error generating Annexure M2 PDF:', error)
    throw error;

  } finally {

    if (page) {
      await page.close();
    }
  }
}