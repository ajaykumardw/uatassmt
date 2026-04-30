// app/api/reports/assessment-summary/route.ts

import { type NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { format, startOfDay, endOfDay } from "date-fns";

import prisma from "@/libs/prisma";

import { authOptions } from "@/libs/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const session = await getServerSession(authOptions);
    const user_id = Number(session?.user.id);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const sectorId = searchParams.get("sectorId");

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { success: false, message: "From Date and To Date are required" },
        { status: 400 }
      );
    }

    const where: any = {
      deleted_at: null,
      agency_id: user_id,
      assessor_id: { not: null },
      assessment_start_datetime: {
        gte: startOfDay(new Date(fromDate)),
        lte: endOfDay(new Date(toDate)),
      },
    };

    // ✅ FIX: correct relation filter
    if (sectorId) {
      where.qualification_pack = {
        is: {
          ssc_id: Number(sectorId),
        },
      };
    }

    const batches = await prisma.batches.findMany({
      where,
      include: {
        students: true,
        training_center: {
          select: {
            state_id: true,
            city_id: true,
          },
        },
        qualification_pack: {
          include: {
            ssc: true,
          },
        },
      },
    });

    const grouped: Record<string, any> = {};

    for (const batch of batches) {
      const sector =
        batch.qualification_pack?.ssc?.ssc_name || "N/A";

      if (!grouped[sector]) {
        grouped[sector] = {
          sector,
          from_date: null,
          to_date: null,
          min_date: null,
          max_date: null,
          total_batches_assessed: 0,
          total_candidates: 0,
          total_candidates_assessed: 0,
          states: new Set<number>(),
          districts: new Set<number>(),
        };
      }

      // ✅ FIX: count only completed batches
      // if (batch.batch_completed === 1) {
      //   grouped[sector].total_batches_assessed += 1;
      // }

      grouped[sector].total_batches_assessed += 1;

      grouped[sector].total_candidates += batch.students.length;

      const currentDate = batch.assessment_start_datetime;

      if (currentDate) {
        if (
          !grouped[sector].min_date ||
          currentDate < grouped[sector].min_date
        ) {
          grouped[sector].min_date = currentDate;
        }

        if (
          !grouped[sector].max_date ||
          currentDate > grouped[sector].max_date
        ) {
          grouped[sector].max_date = currentDate;
        }
      }

      // ✅ FIX: store IDs (not objects)
      if (batch.training_center?.state_id) {
        grouped[sector].states.add(batch.training_center.state_id);
      }

      if (batch.training_center?.city_id) {
        grouped[sector].districts.add(batch.training_center.city_id);
      }

      for (const student of batch.students) {
        if (student.attendance === 1) {
          grouped[sector].total_candidates_assessed += 1;
        }
      }
    }

    const result = Object.values(grouped).map((item: any) => ({
      sector: item.sector,
      from_date: item.min_date
        ? format(item.min_date, "dd-MM-yyyy")
        : null,
      to_date: item.max_date
        ? format(item.max_date, "dd-MM-yyyy")
        : null,
      total_batches_assessed: item.total_batches_assessed,
      total_candidates: item.total_candidates,
      total_candidates_assessed: item.total_candidates_assessed,
      total_states: item.states.size,
      total_districts: item.districts.size,
      percentage:
        item.total_candidates > 0
          ? Number(
              (
                (item.total_candidates_assessed /
                  item.total_candidates) *
                100
              ).toFixed(2)
            )
          : 0,
    }));

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
