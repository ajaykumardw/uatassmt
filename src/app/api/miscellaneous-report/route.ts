import { type NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { format, getMonth, getYear } from "date-fns";

import prisma from "@/libs/prisma";

import { authOptions } from "@/libs/auth";

type FieldMap = {
  getValue: (row: any, index?: number) => any;
};

/*
|--------------------------------------------------------------------------
| FIELD MAP
| label removed from static object
|--------------------------------------------------------------------------
*/

const FIELD_MAP: Record<string, FieldMap> = {
  sr_no: {
    getValue: (_, index) => (index || 0) + 1
  },

  fy: {
    getValue: (row) => {
      // return row.assessment_start_datetime;
      if (!row.assessment_start_datetime) return "";

      const date = row.assessment_start_datetime;
      const year = getYear(date);
      const month = getMonth(date); // 0 = Jan, 3 = April

      return month >= 3
        ? `${year}-${String(year + 1).slice(-2)}`
        : `${year - 1}-${String(year).slice(-2)}`;
    }
  },

  year: {
    getValue: (row) =>
      row.created_at
        ? format(new Date(row.created_at), "yyyy")
        : ""
  },

  month: {
    getValue: (row) =>
      row.created_at
        ? format(new Date(row.created_at), "MMM-yy")
        : ""
  },

  ssc_sector_skill_council: {
    getValue: (row) =>
      row.qualification_pack?.ssc
        ?.ssc_name || ""
  },

  scheme: {
    getValue: (row) =>
      row.scheme?.scheme_name || ""
  },

  sub_scheme: {
    getValue: (row) =>
      row.sub_scheme?.scheme_name || ""
  },

  batch_type: {
    getValue: () => ""
  },

  // scheduling_batch_date: {
  //   getValue: (row) =>
  //     row.created_at ? format(new Date(row.created_at), 'dd-MMM-yy') : ""
  // },

  scheduling_batch_date: {
    getValue: () => ""
  },

  batch_id: {
    getValue: (row) =>
      row.batch_name || ""
  },

  batch_size: {
    getValue: (row) =>
      row.batch_size || ""
  },

  // batch_start_date: {
  //   getValue: (row) =>
  //     row.assessment_start_datetime ? format(new Date(row.assessment_start_datetime), 'dd-MMM-yy') : ""
  // },

  // batch_end_date: {
  //   getValue: (row) =>
  //     row.assessment_end_datetime ? format(new Date(row.assessment_end_datetime), 'dd-MMM-yy') : ""
  // },

  batch_start_date: {
    getValue: () => ""
  },

  batch_end_date: {
    getValue: () => ""
  },

  month_training_completed: {
    getValue: (row) =>
      row.assessment_end_datetime
        ? format(new Date(
            row.assessment_end_datetime
          ), "MMMM")
        : ""
  },

  assessment_date: {
    getValue: (row) =>
      row.assessment_start_datetime ? format(row.assessment_start_datetime, "dd-MMM-yy") : ""
  },

  actual_assessment_date: {
    getValue: (row) =>
      row.assessment_end_datetime ? format(row.assessment_end_datetime, "dd-MMM-yy") : ""
  },

  exam_mode: {
    getValue: (row) =>
      row.assessment_mode === 1
        ? "Online"
        : "Offline"
  },

  result_status: {
    getValue: () => ""
  },

  state: {
    getValue: (row) =>
      row.training_center?.state
        ?.state_name || ""
  },

  district: {
    getValue: (row) =>
      row.training_center?.city
        ?.city_name || ""
  },

  tc_name_location: {
    getValue: (row) =>
      `${row.training_center?.company_name || ""} ${row.training_center?.address || ""}`.trim()
  },

  tc_address: {
    getValue: (row) =>
      row.training_center?.address || ""
  },

  pincode: {
    getValue: (row) =>
      row.training_center?.pin_code || ""
  },

  nqr_code: {
    getValue: (row) =>
      row.qualification_pack?.nqr_code || ""
  },

  job_role: {
    getValue: (row) =>
      row.qualification_pack
        ?.qualification_pack_name || ""
  },

  version_number: {
    getValue: (row) =>
      row.qualification_pack?.version
        ?.version_number || ""
  },

  job_role_code: {
    getValue: (row) =>
      row.qualification_pack
        ?.qualification_pack_id || ""
  },

  job_role_level: {
    getValue: (row) =>
      row.qualification_pack
        ?.nsqf_level || ""
  },

  pass: { getValue: () => "" },
  fail: { getValue: () => "" },
  absent: { getValue: () => "" },
  drop_out: { getValue: () => "" },
  present_count: { getValue: () => "" },
  pass_percent: { getValue: () => "" },
  average_percent: { getValue: () => "" },

  assessor_name: {
    getValue: (row) =>
      `${row.assessor?.first_name || ""} ${row.assessor?.last_name || ""}`.trim()
  },

  assessor_id: {
    getValue: (row) =>
      row.assessor?.user_name || ""
  },

  assessor_contact_no: {
    getValue: (row) =>
      row.assessor?.mobile_no || ""
  },

  assessor_email_id: {
    getValue: (row) =>
      row.assessor?.email || ""
  },

  training_partner_name: {
    getValue: (row) =>
      row.training_partner
        ?.company_name || ""
  },

  training_center_name: {
    getValue: (row) =>
      row.training_center
        ?.company_name || ""
  },

  tp_spoc_details: {
    getValue: (row) => row.training_partner ? `${row.training_partner?.first_name || ""} ${row.training_partner?.last_name || ""}`.trim() : ""
  },

  tp_spoc_contact_no: {
    getValue: (row) => row.training_partner ? row.training_partner?.mobile_no || "" : ""
  },

  tp_spoc_email_id: {
    getValue: (row) => row.training_partner ? row.training_partner?.email || "" : ""
  },

  tc_spoc_name: {
    getValue: (row) =>
      row.center_spoc_person_name || ""
  },

  tc_spoc_contact_details: {
    getValue: (row) =>
      row.center_spoc_person_phone || ""
  },

  tc_spoc_email_id: {
    getValue: (row) =>
      row.center_spoc_person_email || ""
  },

  invoice_no: { getValue: () => "" },
  revised_invoice: { getValue: () => "" },
  billed_on: { getValue: () => "" },
  invoice_applied_date: { getValue: () => "" },
  amount_per_candidate: { getValue: () => "" },
  amount: { getValue: () => "" },
  less_10_tds: { getValue: () => "" },
  net_amount: { getValue: () => "" },
  amount_received_from_ssc: {
    getValue: () => ""
  },
  payable_to_assessor: {
    getValue: () => ""
  },
  total_assessor_invoice_amount: {
    getValue: () => ""
  },
  amount_paid_to_assessor: {
    getValue: () => ""
  },
  amount_paid_to_team: {
    getValue: () => ""
  },
  lunch_exp: { getValue: () => "" },
  lunch_exp_paid_by: {
    getValue: () => ""
  },
  approval_mail_sent_date: {
    getValue: () => ""
  },
  ssc_result_approval_date: {
    getValue: () => ""
  },
  sip_result_update_date: {
    getValue: () => ""
  },
  sip_result_approved: {
    getValue: () => ""
  },
  hard_copy_receive_yn: {
    getValue: () => ""
  },
  folder_no: {
    getValue: () => ""
  },
};

/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/

export async function POST(
  req: NextRequest
) {
  try {
    const session = await getServerSession(authOptions);

    const agencyId = session?.user?.id;

    const body = await req.json();

    const {
      report_type_id,
      fields,
      from_date,
      to_date,
      ssc_id,
      qp_id
    } = body;

    if (!report_type_id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Report type required"
        },
        { status: 400 }
      );
    }

    if (
      !fields ||
      !Array.isArray(fields) ||
      !fields.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select fields"
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | FETCH FIELD LABELS FROM DB
    |--------------------------------------------------------------------------
    */

    const dbFields =
      await prisma.report_fields.findMany({
        where: {
          field_code: {
            in: fields
          }
        },
        select: {
          field_code: true,
          field_name: true
        }
      });

    const labelMap =
      dbFields.reduce(
        (acc: any, item) => {
          acc[item.field_code] = item.field_name;

          return acc;
        },
        {}
      );

    /*
    |--------------------------------------------------------------------------
    | CHECK REPORT TYPE
    |--------------------------------------------------------------------------
    */

    const report =
      await prisma.report_types.findUnique({
        where: {
          id: Number(report_type_id)
        }
      });

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid report type"
        },
        { status: 404 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | FETCH DATA
    |--------------------------------------------------------------------------
    */

    const rows =
      await prisma.batches.findMany({
        where: {
          deleted_at: null,
          agency_id: agencyId,

          // ✅ SSC filter (relation)
          ...(ssc_id && {
            qualification_pack: {
              is: {
                ssc_id: Number(ssc_id)
              }
            }
          }),

          // ✅ QP filter (scalar field)
          ...(qp_id && {
            qp_id: Number(qp_id)
          }),

          ...(from_date &&
            to_date && {
              created_at: {
                gte: new Date(
                  from_date
                ),
                lte: new Date(
                  to_date +
                    "T23:59:59"
                )
              }
            })
        },

        include: {
          qualification_pack: {
            include: {
              ssc: true,
              version: true
            }
          },

          scheme: true,
          sub_scheme: true,

          training_partner: true,

          training_center: {
            include: {
              state: true,
              city: true
            }
          },

          assessor: true
        },

        orderBy: {
          id: "desc"
        }
      });

    /*
    |--------------------------------------------------------------------------
    | BUILD RESPONSE
    |--------------------------------------------------------------------------
    */

    const data = rows.map(
      (row, index) => {
        const obj: any = {};

        fields.forEach(
          (fieldCode: string) => {
            const field =
              FIELD_MAP[fieldCode];

            const label =
              labelMap[fieldCode] ||
              fieldCode;

            if (field) {
              try {
                obj[label] =
                  field.getValue(
                    row,
                    index
                  ) ?? "";
              } catch {
                obj[label] = "";
              }
            } else {
              obj[label] = "";
            }
          }
        );

        return obj;
      }
    );

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Internal server error"
      },
      { status: 500 }
    );
  }
}
