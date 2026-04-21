import { NextResponse } from "next/server";

import prisma from "@/libs/prisma";

export async function GET() {
  try {
    const reports = await prisma.report_types.findMany({
      orderBy: {
        id: "asc"
      },
      include: {
        fields: {
          orderBy: {
            sort_order: "asc"
          },
          include: {
            reportField: true
          }
        }
      }
    });

    const formatted = reports.map((report) => ({
      id: report.id,
      name: report.name,
      code: report.code,

      fields: report.fields.map((item) => ({
        id: item.reportField.id,
        field_name: item.reportField.field_name,
        field_code: item.reportField.field_code,
        is_default: item.is_default,
        is_required: item.is_required,
        sort_order: item.sort_order
      }))
    }));

    return NextResponse.json({
      success: true,
      data: formatted
    });

  } catch (error) {

    console.log("error in report type api:", error)

    return NextResponse.json({
      success: false,
      message: "Failed to fetch reports"
    }, { status: 500 });
  }
}
