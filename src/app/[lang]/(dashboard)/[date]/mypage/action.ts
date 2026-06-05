"use server"

import { Workbook } from 'exceljs'

import prisma from '@/libs/prisma';

export async function passCandidates(formData: FormData) {
  const file = formData.get("file") as File;
  const password = formData.get("password") as string;

  if (!file) {
    throw new Error("File is required");
  }

  if (!password) {
    throw new Error("Password is required");
  }

  // ==========================================
  // LOAD EXCEL
  // ==========================================
  const workbook = new Workbook();

  // await workbook.xlsx.readFile(FILE_PATH);

  await workbook.xlsx.load(await file.arrayBuffer());

  const sheet = workbook.worksheets[0];

  if (!sheet) {
    throw new Error("No worksheet found in the Excel file");
  }

  // const rows = sheet.getRows(2, sheet.rowCount - 1) || [];

  const rows = sheet.getRows(2, sheet.rowCount - 1) || [];

  const groupedMap = rows.reduce((acc, row) => {
    const batchName = row.getCell(1).text.trim();
    const candidateId = row.getCell(2).text.trim();

    if (!acc[batchName]) {
      acc[batchName] = [];
    }

    acc[batchName].push({ candidateId });

    return acc;
  }, {} as Record<string, { candidateId: string }[]>);

  const batchWithCandidates = Object.entries(groupedMap).map(
    ([batchName, candidates]) => ({
      batchName,
      candidates,
    })
  );

  const batches = await prisma.batches.findMany({
    where: {
      batch_name: {
        in: batchWithCandidates.map((b) => b.batchName),
      },
    },
    select: {
      id: true,
      batch_name: true,
    }
  })

  console.log("Parsed Batches with Candidates:", batchWithCandidates, batches);

  return {"batches": batches, "parsed": batchWithCandidates};

}
