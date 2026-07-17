import prisma from '@/libs/prisma'

const TYPE_PREFIX: Record<number, string> = { 1: 'SSC', 2: 'ASSESSOR', 3: 'TP' }

export async function generateInvoiceNumber(type: number): Promise<string> {
  const now = new Date()
  let fyStart: number, fyEnd: number

  if (now.getMonth() >= 3) {
    fyStart = now.getFullYear()
    fyEnd = fyStart + 1
  } else {
    fyStart = now.getFullYear() - 1
    fyEnd = fyStart + 1
  }

  const fyCode = String(fyStart).slice(-2) + String(fyEnd).slice(-2)
  const prefix = `${TYPE_PREFIX[type] || 'SSC'}-INV-${fyCode}-`

  const rows = await prisma.$queryRawUnsafe<Array<{ max_seq: string | null }>>(
    `SELECT MAX(SUBSTRING(invoice_number, -6)) AS max_seq FROM invoices WHERE invoice_number LIKE ?`,
    `${prefix}%`
  )

  const lastSeq = (rows as any[])[0]?.max_seq
  const nextSeq = lastSeq ? String(Number(lastSeq) + 1).padStart(6, '0') : '000001'

  return `${prefix}${nextSeq}`
}
