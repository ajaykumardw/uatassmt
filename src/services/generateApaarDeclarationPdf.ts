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

export async function generateApaarDeclarationPdf(
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

  const trainingPartner = batch?.training_partner

  const trainingCenter = batch?.training_center

  const tpName = trainingPartner?.company_name || ''

  const tcName = trainingCenter?.company_name || ''

  const centerManagerName =
    [trainingCenter?.first_name, trainingCenter?.last_name]
      .filter(Boolean)
      .join(' ') || ''

  const centerManagerMobile = trainingCenter?.mobile_no || ''

  const batchId = batch?.batch_name || ''

  const jobRole = batch?.qualification_pack?.qualification_pack_name || ''

  const numberOfCandidates = batch?.students?.length || 0

  const date = batch?.assessment_start_datetime
    ? format(new Date(batch.assessment_start_datetime), 'dd MMM, yyyy')
    : format(new Date(), 'dd MMM, yyyy')

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
* {
  padding: 0;
  margin: 0;
}

body {
  font-family: "Calibri", sans-serif;
  font-size: 14px;
  padding: 30px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
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
  max-width: 60%;
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
  font-size: 13px;
  max-width: 240px;
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
  margin-bottom: 24px;
}

.para {
  line-height: 1.9;
  text-align: justify;
  margin-bottom: 14px;
}

.filled {
  font-weight: bold;
  white-space: nowrap;
}

.line {
  border-top: 1px solid #000;
  margin: 6px 0 14px;
}

.row {
  display: flex;
  align-items: baseline;
  line-height: 2.1;
}

.row-label {
  width: 250px;
}

.row-filled {
  font-weight: bold;
  white-space: nowrap;
}

.center-block {
  margin: 20px 0 0;
}

.sign-label {
  font-weight: bold;
  margin-bottom: 8px;
}

.sign-block {
  margin-top: 26px;
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

<div class="title">Declaration for APAAR ID</div>

<p class="para">
  This is to certify that <span class="filled">${centerManagerName}</span>
  (Center Manager), on behalf of <span class="filled">${tpName}</span>
  (TP Name), hereby declares that the <b>APAAR IDs</b> of the candidates under
  the batch mentioned below could not be provided to the Assessment Agency due
  to that APAAR ID is not a mandatory requirement under the concerned scheme.
  Therefore, the Training Partner was not required to collect or maintain APAAR
  IDs of the candidates, and consequently, the availability/ status of APAAR
  IDs for the candidates was not known at the time of assessment.
</p>

<p>&nbsp;</p>

<p><b>Particulars</b><span style="margin-left:220px"></span><b>Details</b></p>

<div class="line"></div>

<div class="row">
  <div class="row-label">Training Partner Name</div>
  <div class="row-filled">${tpName}</div>
</div>

<div class="row">
  <div class="row-label">Training Center Name</div>
  <div class="row-filled">${tcName}</div>
</div>

<div class="row">
  <div class="row-label">Batch ID</div>
  <div class="row-filled">${batchId}</div>
</div>

<div class="row">
  <div class="row-label">Job Role</div>
  <div class="row-filled">${jobRole}</div>
</div>

<div class="row">
  <div class="row-label">Number of Candidates</div>
  <div class="row-filled">${numberOfCandidates}</div>
</div>

<p class="para">
  We confirm that the above-mentioned candidates are being presented for
  assessment as per the applicable <b>Project/Scheme requirements</b>. We
  request the Assessment Agency to kindly proceed with the assessment and
  consider this declaration in lieu of the APAAR IDs at this stage.
</p>

<p class="para">
  We undertake to provide the APAAR IDs to the concerned authority/Assessment
  Agency <b>immediately upon their availability</b>.
</p>

<p><b>For and on behalf of the Training Partner</b></p>

<p>&nbsp;</p>
<p>&nbsp;</p>
<p>&nbsp;</p>
<p>&nbsp;</p>
<p>&nbsp;</p>

<p>
  <b>Name:</b> <span class="filled">${centerManagerName}</span><br/>
  <b>Designation:</b> <span class="filled">Center Manager</span><br/>
  <b>Mobile No.:</b> <span class="filled">${centerManagerMobile}</span><br/>
  <b>Date:</b> <span class="filled">${date}</span>
</p>

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
        left: '10mm',
        right: '10mm'
      }
    })

    return Buffer.from(pdfBuffer)

  } catch (error) {

    console.error(`Error generating APAAR Declaration PDF for batch ${batch?.id}:`, error)

    throw error

  } finally {

    await page.close()
  }
}
