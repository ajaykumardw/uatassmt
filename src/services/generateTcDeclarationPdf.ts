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

export async function generateTcDeclarationPdf(
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

  const agencyContactName =
    [agency?.first_name, agency?.last_name]
      .filter(Boolean)
      .join(' ') || ''

  const agencyContactPhone = agency?.mobile_no || ''

  const agencyContactEmail = agency?.email || ''

  const assessorName =
    [batch?.assessor?.first_name, batch?.assessor?.last_name]
      .filter(Boolean)
      .join(' ') || ''

  const trainingCenter = batch?.training_center

  const tcName =
    [trainingCenter?.company_name, trainingCenter?.address]
      .filter(Boolean)
      .join(', ') || ''

  const tcMobile = trainingCenter?.mobile_no || ''

  const tcEmail = trainingCenter?.email || ''

  const trainingPartnerName = batch?.training_partner?.company_name || ''

  const batchName = batch?.batch_name || ''

  const qualificationPack = batch?.qualification_pack?.qualification_pack_name || ''

  const level = batch?.qualification_pack?.nsqf_level || ''

  const assessmentDate = batch?.assessment_start_datetime
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
  font-family: "Times New Roman", serif;
  font-size: 16px;
  padding: 30px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 26px;
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
  font-size: 32px;
  font-weight: bold;
  text-decoration: underline;
  color: #365F91;
  text-align: center;
  margin-bottom: 36px;
}

.para {
  line-height: 1.7;
  text-align: justify;
  margin-bottom: 14px;
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

.field {
  display: flex;
  align-items: baseline;
  line-height: 1.7;
  margin-bottom: 6px;
}

.filled {
  font-weight: bold;
  margin: 0 6px;
}

.regards {
  text-align: right;
  font-size: 16px;
  margin-top: 22px;
  margin-bottom: 90px;
}

.signature {
  text-align: right;
  font-size: 16px;
  margin-bottom: 26px;
}

.contact {
  font-size: 16px;
  margin-bottom: 10px;
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

<div class="title">TC Declaration Form</div>

<div class="para">
  This is to declare that the following assessment has been completed by
  Assessor <span style="font-weight: bold;">${assessorName}</span>, on
  <span style="font-weight: bold;">${assessmentDate}</span> (Date) as per the standard
  operating assessment guideline by SSC &amp; NSDC.
</div>

<div class="field">Batch Name: <span class="filled">${batchName}</span></div>

<div class="field">Qualification Pack: <span class="filled">${qualificationPack}</span></div>

<div class="field">Level: <span class="filled">${level}</span></div>

<div class="para">
  There is no case of any misconduct which may include but not limited to
  bribery, misbehavior etc.
</div>

<div class="regards">Regards,</div>

<div class="signature">(Signature of TC Manager and Seal)</div>

<div class="field">TP Name: <span class="filled">${trainingPartnerName}</span></div>

<div class="field">TC Name: <span class="filled">${tcName}</span></div>

<div class="field">Mobile no: <span class="filled">${tcMobile}</span></div>

<div class="field">Email ID: <span class="filled">${tcEmail}</span></div>

<div class="para">
  TC Manager is strongly advised NOT to sign this form if there have been any
  cases of misconduct. In case there has been misconduct by assessor, you are
  requested to immediately report the matter to following over phone, text,
  Whatsapp or email.
</div>

<div class="contact">${agencyContactName} (Head of Assessments): ${agencyContactPhone}</div>

<div class="contact">Email: ${agencyContactEmail}</div>

<div class="contact">(Requested to TC Manager to send the Scan copy of the declaration to the above email ID)</div>

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

    console.error(`Error generating TC Declaration PDF for batch ${batch?.id}:`, error)

    throw error

  } finally {

    await page.close()
  }
}
