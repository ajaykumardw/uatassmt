import fs from 'fs';

import path from "path";

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

const M1_ITEMS: { description: string; attachment: string }[] = [
  { description: 'Verify Biometric Attendance (Student Attendance Must be Above 70%, Candiendate Attendance Register Need to Check)', attachment: 'NO' },
  { description: 'Biometric Attendance Screen Shot Photo and Hard Copy', attachment: 'Sceen Shot & Hard Copy' },
  { description: 'Trainee Biometric Attendance Record Available', attachment: '(Bio Attendance Pic) & Hard Copy' },
  { description: 'Check Manual Attendance Record Available', attachment: '(Attendance Pic) & Hard Copy' },
  { description: 'Candidates Manual Attendance Record Photographs & Collect Hards Copy', attachment: 'Check & Collect' },
  { description: 'Take Batch Attendance Sheet from Samhit Portal, Collect Candidates Signatures and SPOC Singnature & Stamp', attachment: 'Collect' },
  { description: "Assessor's Selfi with Name Board Photos", attachment: "Take Photo's" },
  { description: "Take Photo's of All Candidates Original Aadhar Cards in a Single Photo's & collect Aadhar card Xerox Copies also", attachment: "Take Photo's" },
  { description: 'Coolect Students Feedback Frorms', attachment: 'Check & Collect' },
  { description: 'Coolect Students Registration Frorms', attachment: 'Check & Collect' },
  { description: "Photographh's of CCTV Footage", attachment: "Take Photo's" },
  { description: "Center Photographh's (Name board, Front Office, Class Rooms, Lab, Infrastructure, Library, Facilities, Posters and Banners Photos)", attachment: "Take Photo's" },
  { description: "Equipment Photograph's", attachment: "Take Photo's" },
  { description: "Group Photograph's of Students", attachment: "Take Photo's" },
  { description: "Group Photograph's of Students with Trainer", attachment: "Take Photo's" },
  { description: "Group Photograph's of Students with Assessor", attachment: "Take Photo's" },
  { description: "Group Photograph's of Students with Assessor, Trainer & SPOC", attachment: "Take Photo's" },
  { description: "Photographh's of Trainer Aadhar Card", attachment: "Take Photo's" },
  { description: "Photographh of Trainer TOT Certificate & Collect Hard Copy & Date of TOT Attended", attachment: 'Photos & Had Copy' },
  { description: 'Photographs of PMKVY Kit', attachment: "Take Photo's" },
  { description: 'Photographs of Theory Exam', attachment: "Take Photo's" },
  { description: 'Photographs of Practical Exam', attachment: "Take Photo's" },
  { description: 'Photographs of Viva Exam', attachment: "Take Photo's" },
  { description: "Video's of Theory Exam each Video 30 sec", attachment: "Video's" },
  { description: "Video's of Practical each Video 30 sec", attachment: "Video's" },
  { description: "Video's of Viva each Video 30 sec", attachment: "Video's" }
];

export async function generateAnnexureM1Pdf(batch: any): Promise<Buffer> {

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

  const assessorName =
    [batch?.assessor?.first_name, batch?.assessor?.last_name]
      .filter(Boolean)
      .join(' ') || ''

  const assessorId = batch?.assessor?.user_name || ''

  const centerHeadName =
    [batch?.training_center?.first_name, batch?.training_center?.last_name]
      .filter(Boolean)
      .join(' ') || ''

  const rowsHtml = M1_ITEMS
    .map((item, index) => `
      <tr>
        <td class="center no">${index + 1}</td>
        <td class="desc">${item.description}</td>
        <td class="center opt"></td>
        <td class="center opt"></td>
        <td class="opt"></td>
        <td class="opt attachment">${item.attachment}</td>
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
  width: 5%;
}

.desc {
  width: 55%;
}

.opt {
  width: 9%;
}

.attachment {
  width: 22%;
  font-size: 9px;
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
  Annexure (M1) Filled by Assessor
</div>

<table>
  <tr>
    <th>S.No</th>
    <th>Tick the Appropriate Answer :</th>
    <th>Yes</th>
    <th>No</th>
    <th>Remarks</th>
    <th>Attachment Option</th>
  </tr>

  ${rowsHtml}
</table>

<div class="signature-section">
  <div class="signature-col">
    <div class="signature-line"><b>Assessor's ID</b> - ${assessorId}</div>
    <div class="signature-line"><b>Assessor's Name</b> - ${assessorName}</div>
    <div class="signature-line"><b>Assessor's Signature</b></div>
  </div>
  <div class="signature-col right">
    <div class="signature-line"><b>Center Head Name</b> - ${centerHeadName}</div>
    <div class="signature-line"><b>Center Head Signature &amp; Stamp</b></div>
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

    console.error('Error generating Annexure M1 PDF:', error)
    throw error;

  } finally {

    if (page) {
      await page.close();
    }
  }
}
