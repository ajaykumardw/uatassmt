// app/api/reports/assessment-summary/route.ts

import { type NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { startOfDay, endOfDay } from "date-fns";

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
        {
          success: "Error",
          statusCode: 401,
          message: "Unauthorized"
        },
        { status: 401 }
      );
    }

    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const sectorId = searchParams.get("sectorId");
    const assessorId = searchParams.get("assessorId");

    const where: any = {
      deleted_at: null,

      // batch_completed: 1

      assessor_id: {
        not: null
      },
      agency_id: user_id
    };

    if (!fromDate || !toDate) {
      return NextResponse.json(
        {
          success: "Error",
          statusCode: 400,
          message: "From Date and To Date are required"
        },
        { status: 400 }
      );
    }

    // Date filter
    if (fromDate && toDate) {
      // where.assessment_start_datetime = {};
      // if (fromDate) where.assessment_start_datetime.gte = new Date(fromDate);
      // if (toDate) where.assessment_start_datetime.lte = new Date(toDate);

      where.assessment_start_datetime = {
        gte: startOfDay(new Date(fromDate)),
        lte: endOfDay(new Date(toDate))
      };

    }

    // Assessor filter
    if (assessorId) {
      where.assessor_id = Number(assessorId);
    }

    // Sector filter
    if (sectorId) {
      where.qualification_pack = {
        ssc_id: Number(sectorId)
      };
    }

    const batches = await prisma.batches.findMany({
      where,
      include: {
        assessor: true,
        students: true,
        training_center: {
          select: {
            state_id: true,
            state: {
              select: {
                state_id: true,
                state_name: true
              }
            },
            city: {
              select: {
                city_id: true,
                city_name: true
              }
            }
          }
        },
        qualification_pack: {
          include: {
            ssc: true
          },
        }
      },
      orderBy: [
        {
          qualification_pack: {
            ssc: {
              ssc_name: "asc"
            }
          }
        },
        {
          batch_name: "asc"
        }
      ]
    });

    // const grouped: Record<string, any> = {};

    // for (const batch of batches) {
    //   const sector =
    //     batch.qualification_pack?.ssc?.ssc_name || "N/A";

    //   const assessorId = batch?.assessor?.user_name || "unassigned";

    //   const assessor =
    //     `${batch.assessor?.first_name || ""} ${batch.assessor?.last_name || ""}`.trim() ||
    //     "Unassigned";

    //   const key = `${sector}_${assessor}`;

    //   if (!grouped[key]) {
    //     grouped[key] = {
    //       sector,
    //       assessor_id: assessorId,
    //       assessor_name: assessor,
    //       q_from_date: fromDate ? format(new Date(fromDate), "dd-MM-yyyy") || null : null,
    //       q_to_date: toDate ? format(new Date(toDate), "dd-MM-yyyy") || null : null,
    //       from_date: null,
    //       to_date: null,
    //       min_date: null,
    //       max_date: null,
    //       total_batches_assessed: 0,
    //       total_candidates: 0,
    //       total_candidates_assessed: 0,
    //       states: new Set(),
    //       districts: new Set()
    //     };
    //   }

    //   grouped[key].total_batches_assessed += batch.batch_completed === 1 ? 1 : 1;
    //   grouped[key].total_candidates += batch.students.length;

    //   const currentDate = batch.assessment_start_datetime;

    //   if (currentDate) {
    //     if (
    //       !grouped[key].min_date ||
    //       currentDate < grouped[key].min_date
    //     ) {
    //       grouped[key].min_date = currentDate;
    //     }

    //     if (
    //       !grouped[key].max_date ||
    //       currentDate > grouped[key].max_date
    //     ) {
    //       grouped[key].max_date = currentDate;
    //     }
    //   }

    //   if (batch.training_center?.state) {
    //     grouped[key].states.add(batch.training_center.state);
    //   }

    //   if (batch.training_center?.city) {
    //     grouped[key].districts.add(batch.training_center.city);
    //   }

    //   for (const student of batch.students) {
    //     if (student.attendance === 1) {
    //       grouped[key].total_candidates_assessed += 1;
    //     }

    //     // if (student.state) grouped[key].states.add(student.state);
    //     // if (student.city) grouped[key].districts.add(student.city);
    //   }
    // }

    // const result = Object.values(grouped).map((item: any) => ({
    //   sector: item.sector,
    //   assessor_id: item.assessor_id,
    //   assessor_name: item.assessor_name,
    //   q_from_date: item.q_from_date,
    //   q_to_date: item.q_to_date,
    //   from_date: item.min_date
    //     ? format(item.min_date, "dd-MM-yyyy")
    //     : null,

    //   to_date: item.max_date
    //     ? format(item.max_date, "dd-MM-yyyy")
    //     : null,
    //   total_batches_assessed: item.total_batches_assessed,
    //   total_candidates: item.total_candidates,
    //   total_candidates_assessed: item.total_candidates_assessed,
    //   total_states: item.states.size,
    //   total_districts: item.districts.size,
    //   percentage:
    //     item.total_candidates > 0
    //       ? Number(
    //           (
    //             (item.total_candidates_assessed /
    //               item.total_candidates) *
    //             100
    //           ).toFixed(2)
    //         )
    //       : 0
    // }));

    const result = batches.map((batch) => {
      const sector =
        batch.qualification_pack?.ssc?.ssc_name || "N/A";

      const totalCandidates = batch.students.length;

      let assessed = 0;
      let pass = 0;
      let fail = 0;

      for (const student of batch.students) {
        if (student.attendance === 1) {
          assessed++;

          if (student.result == "pass") {
            pass++;
          } else if (student.result == "fail") {
            fail++;
          }
        }
      }

      const percentage =
        totalCandidates > 0
          ? Number(((pass / totalCandidates) * 100).toFixed(2))
          : 0;

      return {
        sector,
        batch_id: batch.batch_name,
        total_candidates: totalCandidates,
        total_candidates_assessed: assessed,
        total_pass_candidates: pass,
        total_fail_candidates: fail,
        percentage
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong"
      },
      { status: 500 }
    );
  }
}
