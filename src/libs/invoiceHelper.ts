import prisma from '@/libs/prisma'

/**
 * Generate a professional invoice number in format: TYPE-INV-FY-XXXXXX
 * where FY = financial year (e.g., 2526 for Apr 2025 - Mar 2026)
 * and XXXXXX = zero-padded sequential counter
 *
 * Example: SSC-INV-2526-000001
 */
export async function generateInvoiceNumber(type: 'SSC' | 'ASSESSOR' | 'TP', table: string): Promise<string> {
  const now = new Date()
  let fyStart: number, fyEnd: number

  // Indian financial year: April to March
  if (now.getMonth() >= 3) {
    // Apr-Dec: current year is FY start
    fyStart = now.getFullYear()
    fyEnd = fyStart + 1
  } else {
    // Jan-Mar: previous year is FY start
    fyStart = now.getFullYear() - 1
    fyEnd = fyStart + 1
  }

  const fyCode = String(fyStart).slice(-2) + String(fyEnd).slice(-2)
  const prefix = `${type}-INV-${fyCode}-`

  // Find the highest existing invoice number for this FY prefix
  const rows = await prisma.$queryRawUnsafe<Array<{ max_seq: string | null }>>(
    `SELECT MAX(SUBSTRING(invoice_number, -6)) AS max_seq FROM \`${table}\` WHERE invoice_number LIKE ?`,
    `${prefix}%`
  )

  const lastSeq = (rows as any[])[0]?.max_seq
  const nextSeq = lastSeq ? String(Number(lastSeq) + 1).padStart(6, '0') : '000001'

  return `${prefix}${nextSeq}`
}
