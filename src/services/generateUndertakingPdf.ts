import fs from "fs";
import path from "path";

import { format } from "date-fns";

import { getAgencyImagePath } from "@/configs/customDataConfig";
import { getBrowser } from "@/libs/puppeteerBrowser"

const imageToBase64 = (filePath: string) => {
  const ext = path.extname(filePath).toLowerCase();

  const mimeType =
    ext === '.png'
      ? 'image/png'
      : ext === '.webp'
        ? 'image/webp'
        : 'image/jpeg';

  const buffer = fs.readFileSync(filePath);


return `data:${mimeType};base64,${buffer.toString('base64')}`;
};

export async function generateUndertakingPdf(
  batch: any
): Promise<Buffer> {
  const agency = batch?.agency

  const agencyName = agency?.company_name || ''

  const agencyAddressRaw = agency?.address || ''

  const agencyAddress = agencyAddressRaw.endsWith(String(agency?.pin_code || ''))
    ? agencyAddressRaw
    : [agencyAddressRaw, agency?.pin_code].filter(Boolean).join(', ')

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

  const assessorName =
    [batch?.assessor?.first_name, batch?.assessor?.last_name]
      .filter(Boolean)
      .join(' ') || ''

  const trainingCenter = batch?.training_center

  const centerManagerName =
    [trainingCenter?.first_name, trainingCenter?.last_name]
      .filter(Boolean)
      .join(' ') || ''

  const trainingPartnerName = batch?.training_partner?.company_name || ''

  const tcLocation = trainingCenter?.address || ''

  const batchName = batch?.batch_name || ''

  const qualificationPack = batch?.qualification_pack?.qualification_pack_name || ''

  const assessmentDate = batch?.assessment_start_datetime
    ? format(new Date(batch.assessment_start_datetime), 'dd MMM, yyyy')
    : format(new Date(), 'dd MMM, yyyy')

  const totalCandidates = batch?.students?.length || 0

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
body {
  font-family: "Calibri", sans-serif;
  font-size: 14px;
  padding: 8px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.logo-line {
  flex: 0 0 auto;
}

.logo-line img {
  max-width: 110px;
  max-height: 110px;
  object-fit: contain;
}

.company-block {
  text-align: right;
  max-width: 250px;
  margin-left: auto;
}

.company {
  font-family: "Cambria", serif;
  font-size: 18px;
  font-weight: bold;
  color: #365F91;
  word-wrap: break-word;
}

.addr {
  margin-top: 4px;
  font-size: 11px;
  max-width: 220px;
  margin-left: auto;
  word-wrap: break-word;
}

.title {
  font-family: "Cambria", serif;
  font-size: 26px;
  font-weight: bold;
  text-decoration: underline;
  color: #365F91;
  text-align: center;
  margin-bottom: 18px;
}

.para {
  line-height: 1.9;
  text-align: justify;
  margin-bottom: 12px;
}

.blank {
  display: inline-block;
  min-width: 120px;
  border-bottom: 1px dotted #000;
}

.blank-line {
  flex: 1;
  margin-left: 8px;
  border-bottom: 1px dotted #000;
}

.filled {
  font-weight: bold;
  margin: 0 6px;
}

.field {
  display: flex;
  align-items: baseline;
  line-height: 2;
  margin-bottom: 6px;
}

.right {
  text-align: right;
}

.section-title {
  text-align: center;
  font-weight: bold;
  font-size: 14px;
  margin: 18px 0 8px;
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
    <div class="company">${agencyName}</div>
    <div class="addr">${agencyAddress}</div>
  </div>
</div>

<div class="title">UNDERTAKING FORM</div>

<p class="para"><b>To,</b><br/>
<b>The Director,</b><br/>
<b>${agencyName}</b></p>

<p class="para">
  I, <span class="filled">${centerManagerName}</span> on behalf of TC/TP Name
  <span class="filled">${trainingPartnerName}</span> declare that identity of the candidates
  whose names are in Assessment Attendance Sheet and appearing in the
  examination for the Qualification Pack <span class="filled">${qualificationPack}</span>.
  Batch Name: <span class="filled">${batchName}</span> Assessment Date:
  <span class="filled">${assessmentDate}</span>. have been validated by us as per their
  Aadhaar Numbers and other identity as mentioned in the application form
  and the data uploaded on SDMS portal for the said batch.
</p>

<p class="para">
  We take the responsibility, if any discrepancy found in the above-mentioned
  details
</p>

<p class="para">
  We here by confirm that the assessment was held in our Training centre by
  AA (Assessment Agency) ${agencyName}
  on <span class="filled">${assessmentDate}</span> at <span class="filled">${tcLocation}</span>
</p>

<p class="para">We confirm the below provided information hold valid.</p>

<p class="field">Name of the Assessor: <span class="filled">${assessorName}</span></p>

<p class="field">Total Number of candidates: <span class="filled">${totalCandidates}</span></p>

<p class="field">Number of Candidates present for the assessment: <span class="blank-line"></span></p>

<p class="right">Thanks &amp; Regards,</p>

<p>&nbsp;</p>

<p class="right">TC Manager</p>

<p class="right">(Signature &amp; Seal)</p>

<div class="section-title">DECLARATION BY ASSESSOR</div>

<p class="para">
  I declare that all the information furnished in this undertaking form is
  verified by me and found true,
</p>

<p class="field">Assessor's Name: <span class="filled">${assessorName}</span></p>

<p class="field">Time to arrive at the Centre: <span class="blank-line"></span></p>

<p>&nbsp;</p>

<p>Assessor's Signature:</p>

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
        top: '5mm',
        bottom: '5mm',
        left: '10mm',
        right: '10mm'
      }
    })

    return Buffer.from(pdfBuffer)

  } catch (error) {

    console.error(`Error generating Undertaking PDF for batch ${batch?.id}:`, error)

    throw error

  } finally {

    await page.close()
  }
}
