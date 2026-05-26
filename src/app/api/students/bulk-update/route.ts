export const dynamic = "force-dynamic";

// import path from "path";

// import fs from "fs/promises";

import { NextResponse } from "next/server";

import { compare } from 'bcrypt'

import { Workbook } from 'exceljs'

import { getServerSession } from "next-auth";

import { authOptions } from "@/libs/auth";

import prisma from "@/libs/prisma";

// const FILE_PATH = path.join(
//   process.cwd(),
//   "storage",
//   "uploads",
//   "corrections",
//   "candidate_id_correction.xlsx"
// );

type MappingRow = {
  row: number;
  old_id: string;
  new_id: string;
};

type LogRow = {
  row: number;
  old_id: string;
  new_id: string;
  status: string;
};

function esc(value: string) {
  return value.replace(/'/g, "''");
}

export async function POST(req: Request) {
  try {

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const password = formData.get("password") as string;

    const session = await getServerSession(authOptions);
    const authUser = session?.user;
    const userId = Number(session?.user?.id);

    if (!authUser || authUser.user_type !== 'AG') {
      return NextResponse.json({
        success: false,
        message: "Unauthorized"
      }, { status: 401 });
    }

    if (!file) {
      return NextResponse.json({
        success: false,
        message: "File is required"
      }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({
        success: false,
        message: "Password is required"
      }, { status: 400 });
    }


    const user = await prisma.users.findFirst({
      where: {
        id: Number(authUser.id),
      },
      select: {
        id: true,
        user_type: true,
        password: true,
      }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        message: "User not found"
      }, { status: 404 });
    }

    const isValidPassword = user.password ? await compare(password, user.password) : false;

    if (!isValidPassword) {
      return NextResponse.json({
        success: false,
        message: "Invalid password"
      }, { status: 403 });
    }

    // ==========================================
    // FILE CHECK
    // ==========================================
    // try {
    //   await fs.access(FILE_PATH);
    // } catch {
    //   return NextResponse.json({
    //     success: false,
    //     message: "File not found"
    //   });
    // }

    // ==========================================
    // LOAD EXCEL
    // ==========================================
    const workbook = new Workbook();

    // await workbook.xlsx.readFile(FILE_PATH);

    await workbook.xlsx.load(await file.arrayBuffer());

    const sheet = workbook.worksheets[0];

    if (!sheet) {
      return NextResponse.json({
        success: false,
        message: "Worksheet not found"
      }, {
        status: 404
      });
    }

    // ==========================================
    // HEADERS
    // ==========================================
    const headerRow = sheet.getRow(1);

    const headers: string[] = [];

    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber] = String(cell.value ?? "")
        .trim()
        .toLowerCase();
    });

    const oldCol = headers.findIndex(
      h => h === "candidate_id"
    );

    const newCol = headers.findIndex(
      h => h === "new_candidate_id"
    );

    if (oldCol === -1 || newCol === -1) {
      return NextResponse.json({
        success: false,
        message:
          "Columns required: candidate_id, new_candidate_id"
      }, { status: 400 });
    }

    // ==========================================
    // READ DATA
    // ==========================================
    const mappings: MappingRow[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const oldId = String(
        row.getCell(oldCol).value ?? ""
      ).trim();

      const newId = String(
        row.getCell(newCol).value ?? ""
      ).trim();

      if (oldId && newId) {
        mappings.push({
          row: rowNumber,
          old_id: oldId,
          new_id: newId
        });
      }
    });

    if (!mappings.length) {
      return NextResponse.json({
        success: false,
        message: "No valid rows found"
      }, { status: 400 });
    }

    const logs: LogRow[] = [];

    // ==========================================
    // VALIDATIONS
    // ==========================================
    const oldIds = mappings.map(x => x.old_id);
    const newIds = mappings.map(x => x.new_id);

    // Duplicate new ids in file
    const duplicateNew = newIds.filter(
      (v, i, arr) => arr.indexOf(v) !== i
    );

    const duplicateSet = new Set(duplicateNew);

    // Existing rows in DB
    const existingOld = await prisma.students.findMany({
      where: {
        candidate_id: {
          in: oldIds
        },
        agency_id: userId
      },
      select: {
        id: true,
        candidate_id: true
      }
    });

    const existingNew = await prisma.students.findMany({
      where: {
        candidate_id: {
          in: newIds
        }
      },
      select: {
        candidate_id: true
      }
    });

    const oldMap = new Map(
      existingOld.map(x => [
        x.candidate_id,
        x.id
      ])
    );

    const existingNewSet = new Set(
      existingNew.map(x => x.candidate_id)
    );

    // ==========================================
    // FILTER VALID ROWS
    // ==========================================
    const validRows: MappingRow[] = [];

    for (const row of mappings) {
      if (duplicateSet.has(row.new_id)) {
        logs.push({
          row: row.row,
          old_id: row.old_id,
          new_id: row.new_id,
          status:
            "Failed: Duplicate New Candidate ID in Excel"
        });
        continue;
      }

      if (!oldMap.has(row.old_id)) {
        logs.push({
          row: row.row,
          old_id: row.old_id,
          new_id: row.new_id,
          status:
            "Failed: Old Candidate ID not found"
        });
        continue;
      }

      // allow if swapping same file ids
      if (
        existingNewSet.has(row.new_id) &&
        !oldIds.includes(row.new_id)
      ) {
        logs.push({
          row: row.row,
          old_id: row.old_id,
          new_id: row.new_id,
          status:
            "Failed: New Candidate ID already exists"
        });
        continue;
      }

      validRows.push(row);
    }

    if (!validRows.length) {
      return NextResponse.json({
        success: false,
        message:
          "No valid rows to update",
        logs
      });
    }

    // ==========================================
    // BULK UPDATE
    // ==========================================
    await prisma.$transaction(async tx => {
      const validOldIds = validRows.map(
        x => x.old_id
      );

      // STEP 1 TEMP UPDATE
      await tx.$executeRawUnsafe(`
        UPDATE students
        SET candidate_id = CONCAT('TEMP_', id)
        WHERE candidate_id IN (${validOldIds
          .map(x => `'${esc(x)}'`)
          .join(",")})
      `);

      // STEP 2 FINAL UPDATE (CASE id)
      const cases = validRows
        .map(row => {
          const id = oldMap.get(
            row.old_id
          );

          return `WHEN ${id} THEN '${esc(
            row.new_id
          )}'`;
        })
        .join(" ");

      const ids = validRows
        .map(row =>
          oldMap.get(row.old_id)
        )
        .join(",");

      await tx.$executeRawUnsafe(`
        UPDATE students
        SET candidate_id = CASE id
          ${cases}
        END
        WHERE id IN (${ids})
      `);
    });

    // ==========================================
    // SUCCESS LOGS
    // ==========================================
    for (const row of validRows) {
      logs.push({
        row: row.row,
        old_id: row.old_id,
        new_id: row.new_id,
        status: "Updated Successfully"
      });
    }

    return NextResponse.json({
      success: true,
      total_rows: mappings.length,
      updated: validRows.length,
      failed:
        mappings.length -
        validRows.length,
      logs
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json({
      success: false,
      message:
        error.message ||
        "Internal Server Error"
    });
  }
}
