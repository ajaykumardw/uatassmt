import fs from 'fs'
import path from 'path'

import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { getBrowser } from '@/libs/puppeteerBrowser'
import { getAgencyImagePath } from '@/configs/customDataConfig'

function imageToBase64(relativePath: string): string {
  try {
    const absPath = path.resolve(relativePath)

    if (!fs.existsSync(absPath)) return ''
    const buffer = fs.readFileSync(absPath)
    const ext = path.extname(absPath).replace('.', '')

    
return `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${buffer.toString('base64')}`
  } catch {
    return ''
  }
}

function formatDate(d: string | null) {
  if (!d) return '-'
  
return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const TYPE_LABEL: Record<number, string> = { 1: 'SSC Assessment Invoice', 2: 'Assessor/Proctor Invoice', 3: 'Training Partner Invoice' }

function numberToWords(n: number): string {
  if (n === 0) return 'Zero'
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const scales = ['', 'Thousand', 'Lakh', 'Crore']

  function convertBelow1000(num: number): string {
    if (num === 0) return ''
    let res = ''

    if (num >= 100) { res += ones[Math.floor(num / 100)] + ' Hundred '; num %= 100 }
    if (num >= 20) { res += tens[Math.floor(num / 10)] + ' '; num %= 10 }
    if (num > 0) res += ones[num] + ' '
    
return res.trim()
  }

  const parts: string[] = []
  let scaleIdx = 0

  if (n >= 100) { parts.push(convertBelow1000(n % 1000)); n = Math.floor(n / 1000); scaleIdx = 1 }

  while (n > 0) {
    const chunk = n % 100

    if (chunk > 0) parts.push(ones[chunk] + ' ' + scales[scaleIdx])
    n = Math.floor(n / 100)
    scaleIdx++
  }

  parts.reverse()
  
return parts.join(' ') || ''
}

function amountInWords(amount: number): string {
  const whole = Math.floor(amount)
  const decimal = Math.round((amount - whole) * 100)
  let words = numberToWords(whole) + ' Rupees'

  if (decimal > 0) words += ' And ' + numberToWords(decimal) + ' Paise'
  
return words + ' Only'
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)

    const rows = await prisma.$queryRaw`
      SELECT
        i.id, i.invoice_number, i.type, i.batch_id, b.batch_name AS batch_name,
        i.ssc_id, ssc.ssc_name AS ssc_name, i.scheme,
        i.assessor_id, CONCAT(au.first_name, ' ', au.last_name) AS assessor_name,
        i.tp_id, CONCAT(tu.first_name, ' ', tu.last_name) AS tp_name,
        i.assessment_date, i.total_candidate, i.present_candidate,
        i.amount_per_candidate, i.total_amount,
        i.gst_amount, i.gst_percentage,
        i.status, i.notes,
        i.created_at, i.agency_id,
        ag.company_name AS agency_name, ag.address AS agency_address,
        ag.avatar AS agency_logo, ag.sign_image AS agency_stamp,
        ci.city_name AS agency_city, st.state_name AS agency_state,
        ag.pin_code AS agency_pincode,
        uad.gst_no AS agency_gst, uad.pan_card_no AS agency_pan
      FROM invoices i
      LEFT JOIN batches b ON b.id = i.batch_id
      LEFT JOIN sector_skill_councils ssc ON ssc.id = i.ssc_id
      LEFT JOIN users au ON au.id = i.assessor_id
      LEFT JOIN users tu ON tu.id = i.tp_id
      LEFT JOIN users ag ON ag.id = i.agency_id
      LEFT JOIN users_additional_data uad ON uad.user_id = i.agency_id
      LEFT JOIN city ci ON ci.city_id = ag.city_id
      LEFT JOIN state st ON st.state_id = ag.state_id
      WHERE i.id = ${id}
      LIMIT 1
    `

    const invoice = (rows as any[])[0]

    if (!invoice) {
      return NextResponse.json({ status: 'Error', statusCode: 404, message: 'Invoice not found' }, { status: 404 })
    }

    const entityName = invoice.type === 1 ? invoice.ssc_name : invoice.type === 2 ? invoice.assessor_name : invoice.tp_name

    const logoPath = invoice.agency_logo ? getAgencyImagePath(invoice.agency_id, invoice.agency_logo) : ''
    const stampPath = invoice.agency_stamp ? getAgencyImagePath(invoice.agency_id, `sign/${invoice.agency_stamp}`) : ''
    const logoUrl = logoPath ? imageToBase64(logoPath) : ''
    const stampUrl = stampPath ? imageToBase64(stampPath) : ''

    // const agencyAddressParts = [invoice.agency_address, invoice.agency_city, invoice.agency_state, invoice.agency_pincode].filter(Boolean)
    const agencyAddressParts = [invoice.agency_address].filter(Boolean)
    const agencyAddress = agencyAddressParts.join(', ')

    const gstAmt = invoice.gst_percentage
      ? Number(invoice.total_amount) * Number(invoice.gst_percentage) / 100
      : (invoice.gst_amount ? Number(invoice.gst_amount) : 0)

    const netAmount = invoice.type === 3
      ? Number(invoice.total_amount) + gstAmt
      : Number(invoice.total_amount)

    const invoiceDate = formatDate(invoice.created_at)

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.invoice_number || `INV-${invoice.id}`}</title>
  <style>
    @page { margin: 15mm; size: A4; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #333; line-height: 1.5; }
    .top-section { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .agency-info { flex: 1; }
    .agency-name { font-size: 18px; font-weight: bold; color: #1a237e; margin-bottom: 4px; }
    .agency-details { font-size: 11px; color: #555; }
    .agency-details div { margin-bottom: 2px; }
    .logo-area { text-align: right; }
    .logo-area img { max-height: 70px; max-width: 160px; }
    .inv-number-box { text-align: center; margin: 15px 0 20px; }
    .inv-number-box .box { display: inline-block; padding: 8px 28px; background: #1a237e; color: #fff; border-radius: 4px; font-size: 15px; font-weight: bold; letter-spacing: 1px; }
    .inv-number-box .box span { font-weight: normal; opacity: 0.8; margin-right: 6px; }
    .header-title { text-align: center; font-size: 16px; font-weight: bold; color: #1a237e; margin-bottom: 5px; }
    .header-subtitle { text-align: center; font-size: 13px; color: #666; margin-bottom: 15px; }
    .section { margin-bottom: 15px; }
    .section-title { font-size: 13px; font-weight: bold; border-bottom: 2px solid #1a237e; padding-bottom: 4px; margin-bottom: 8px; color: #1a237e; }
    table { width: 100%; border-collapse: collapse; }
    table.details td { padding: 5px 8px; border: 1px solid #ddd; }
    table.details td.label { font-weight: bold; width: 35%; background: #f5f5f5; }
    .amount { text-align: right; font-weight: bold; }
    .total-row td { font-weight: bold; background: #e8eaf6; }
    .total-row-bg td { font-weight: bold; background: #c5cae9; font-size: 13px; }
    .amount-words { margin-top: 12px; padding: 8px; background: #fafafa; border: 1px dashed #ccc; border-radius: 4px; font-size: 12px; }
    .amount-words strong { color: #1a237e; }
    .signature-area { margin-top: 35px; display: flex; justify-content: flex-end; }
    .signature-block { text-align: center; }
    .signature-block img { max-height: 60px; max-width: 130px; margin-bottom: 4px; }
    .signature-block .sign-label { font-size: 11px; color: #888; }
    .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #aaa; border-top: 1px solid #ddd; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="top-section">
    <div class="agency-info">
      <div class="agency-name">${invoice.agency_name || 'Agency'}</div>
      ${agencyAddress ? `<div class="agency-details"><div>${agencyAddress.replace(/,/g, ', ')}</div></div>` : ''}
      <div class="agency-details" style="margin-top:6px">
        ${invoice.agency_gst ? `<div><strong>GST No.:</strong> ${invoice.agency_gst}</div>` : ''}
        ${invoice.agency_pan ? `<div><strong>PAN No.:</strong> ${invoice.agency_pan}</div>` : ''}
      </div>
    </div>
    ${logoUrl ? `<div class="logo-area"><img src="${logoUrl}" alt="Agency Logo"></div>` : ''}
  </div>

  <div class="header-title">${TYPE_LABEL[invoice.type] || 'Invoice'}</div>
  <div class="header-subtitle">${entityName || ''}</div>

  <div class="inv-number-box">
    <div class="box"><span>Invoice No.</span> ${invoice.invoice_number || `INV-${invoice.id}`}</div>
  </div>

  <div class="section">
    <div class="section-title">Invoice Details</div>
    <table class="details">
      <tr><td class="label">Invoice Date</td><td>${invoiceDate}</td></tr>
      <tr><td class="label">Batch</td><td>${invoice.batch_name || '-'}</td></tr>
      <tr><td class="label">${invoice.type === 1 ? 'SSC' : invoice.type === 2 ? 'Assessor' : 'Training Partner'}</td><td>${entityName || '-'}</td></tr>
      <tr><td class="label">Scheme</td><td>${invoice.scheme || '-'}</td></tr>
      <tr><td class="label">Assessment Date</td><td>${formatDate(invoice.assessment_date)}</td></tr>
      <tr><td class="label">Total Candidates</td><td>${invoice.total_candidate || '-'}</td></tr>
      ${invoice.type !== 3 ? `<tr><td class="label">Present Candidates</td><td>${invoice.present_candidate || '-'}</td></tr>` : ''}
      <tr><td class="label">Amount Per Candidate</td><td class="amount">₹ ${Number(invoice.amount_per_candidate).toFixed(2)}</td></tr>
      <tr class="total-row"><td class="label">Total Amount</td><td class="amount">₹ ${Number(invoice.total_amount).toFixed(2)}</td></tr>
      ${invoice.type === 3 && gstAmt > 0 ? `<tr><td class="label">GST (${invoice.gst_percentage || 0}%)</td><td class="amount">₹ ${gstAmt.toFixed(2)}</td></tr>` : ''}
      ${invoice.type === 3 && gstAmt > 0 ? `<tr class="total-row"><td class="label">Total Including GST</td><td class="amount">₹ ${(Number(invoice.total_amount) + gstAmt).toFixed(2)}</td></tr>` : ''}
    </table>
  </div>

  ${invoice.type === 3 && gstAmt > 0 ? '' : ''}
  <div class="section">
    <div class="section-title">Invoice Summary</div>
    <table class="details">
      <tr class="total-row-bg"><td class="label">Net Invoice Amount</td><td class="amount">₹ ${netAmount.toFixed(2)}</td></tr>
    </table>
  </div>

  <div class="amount-words">
    <strong>Amount in Words:</strong> ${amountInWords(netAmount)}
  </div>

  ${invoice.notes ? `
  <div class="section">
    <div class="section-title">Notes</div>
    <p style="margin:0;padding:8px;background:#fafafa;border-radius:4px">${invoice.notes}</p>
  </div>` : ''}

  <div class="section">
    <div class="section-title">Payment Summary</div>
    <table class="details">
      <tr><td class="label">Net Invoice Amount</td><td class="amount">₹ ${netAmount.toFixed(2)}</td></tr>
      <tr><td class="label">Payment Status</td><td>${Number(invoice.status) === 4 ? 'Paid' : 'Unpaid'}</td></tr>
    </table>
  </div>

  <div class="signature-area">
    <div class="signature-block">
      ${stampUrl ? `<img src="${stampUrl}" alt="Agency Stamp"><br>` : ''}
      <div class="sign-label">Authorised Signatory</div>
    </div>
  </div>

  <div class="footer">
    Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}<br>
    This is a computer-generated invoice
  </div>
</body>
</html>`

    const browser = await getBrowser()
    const page = await browser.newPage()

    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdfBuffer = Buffer.from(await page.pdf({
      format: 'A4',
      margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' },
      printBackground: true
    }))

    await page.close()

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice_${invoice.invoice_number || invoice.id}.pdf"`,
        'Content-Length': String(pdfBuffer.length)
      }
    })
  } catch (error: any) {
    return NextResponse.json({ status: 'Error', statusCode: 500, message: error.message }, { status: 500 })
  }
}
