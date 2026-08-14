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
    getValue: (row) => row.batch_type || ""
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

  pass: {
    getValue: (row) => row._master?.pass ?? ""
  },
  fail: {
    getValue: (row) => row._master?.fail ?? ""
  },
  absent: {
    getValue: (row) => row._master?.absent ?? ""
  },
  drop_out: { getValue: () => "" },
  present_count: {
    getValue: (row) => row._master?.present ?? ""
  },
  pass_percent: {
    getValue: (row) => row._master?.passPercent ?? ""
  },
  average_percent: {
    getValue: (row) => row._master?.avgPercent ?? ""
  },

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
      row.center_spoc_person_name ||
      [row.training_center?.first_name, row.training_center?.last_name].filter(Boolean).join(" ") ||
      ""
  },

  tc_spoc_contact_details: {
    getValue: (row) =>
      row.center_spoc_person_phone ||
      row.training_center?.mobile_no ||
      ""
  },

  tc_spoc_email_id: {
    getValue: (row) =>
      row.center_spoc_person_email ||
      row.training_center?.email ||
      ""
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

  // ──────────────────────────────────────────────
  // NCVET DCF Report fields
  // ──────────────────────────────────────────────
  dcf_ab_name: {
    getValue: (row) => row.agency?.company_name || ""
  },
  dcf_month: {
    getValue: (row) => row.assessment_end_datetime ? format(new Date(row.assessment_end_datetime), "MMMM") : ""
  },
  dcf_year: {
    getValue: (row) => row.assessment_end_datetime ? format(new Date(row.assessment_end_datetime), "yyyy") : ""
  },
  dcf_batch_id: {
    getValue: (row) => row.batch_name || ""
  },
  dcf_sidh_batch: {
    getValue: (row) => row.is_sidh_batch || ""
  },
  dcf_training_mode: {
    getValue: (row) => row.assessment_mode === 1 ? "Online" : row.assessment_mode === 2 ? "Offline" : ""
  },
  dcf_tc_name: {
    getValue: (row) => row.training_center?.company_name || ""
  },
  dcf_tc_address: {
    getValue: (row) => {
      const tc = row.training_center

      if (!tc) return ""

      return [tc.address, tc.city?.city_name, tc.state?.state_name, tc.pin_code].filter(Boolean).join(", ")
    }
  },
  dcf_empanelment: {
    getValue: () => "Direct Empanelment by AB"
  },
  dcf_state: {
    getValue: (row) => row.training_center?.state?.state_name || ""
  },
  dcf_district: {
    getValue: (row) => row.training_center?.city?.city_name || ""
  },
  dcf_pincode: {
    getValue: (row) => row.training_center?.pin_code || ""
  },
  dcf_nqr_code: {
    getValue: (row) => row.qualification_pack?.nqr_code || ""
  },
  dcf_nsqf_level: {
    getValue: (row) => row.qualification_pack?.nsqf_level || ""
  },
  dcf_sector: {
    getValue: (row) => row.qualification_pack?.ssc?.sector || row.qualification_pack?.ssc?.ssc_name || ""
  },
  dcf_sub_sector: {
    getValue: (row) => row.qualification_pack?.sub_sector || ""
  },
  dcf_category: {
    getValue: () => "NOS"
  },
  dcf_qp_name: {
    getValue: (row) => row.qualification_pack?.qualification_pack_name || ""
  },
  dcf_version: {
    getValue: (row) => row.qualification_pack?.version?.version_number || ""
  },
  dcf_qual_type: {
    getValue: (row) => row.qualification_pack?.qualification_type || row.qualification_pack?.version?.version_type || ""
  },
  dcf_training_type: {
    getValue: (row) => row.training_type || ""
  },
  dcf_training_segment: {
    getValue: () => "General Batch (Mix of All categories)"
  },
  dcf_funding: {
    getValue: (row) => row.funding_type || ""
  },
  dcf_scheme_name: {
    getValue: (row) => row.scheme?.scheme_name || ""
  },
  dcf_certified_trainer: {
    getValue: () => ""
  },
  dcf_trainer_id: {
    getValue: () => ""
  },
  dcf_language: {
    getValue: () => ""
  },
  dcf_training_start_date: {
    getValue: (row) => row.batch_start_date ? format(new Date(row.batch_start_date), "dd-MM-yyyy") : ""
  },
  dcf_training_end_date: {
    getValue: (row) => row.batch_end_date ? format(new Date(row.batch_end_date), "dd-MM-yyyy") : ""
  },
  dcf_industry_training: {
    getValue: () => ""
  },
  dcf_feedback_collected: {
    getValue: () => ""
  },
  dcf_total_enrolled: {
    getValue: (row) => row._dcf?.totalEnrolled ?? row._count?.students ?? 0
  },
  dcf_women_enrolled: {
    getValue: () => ""
  },
  dcf_pwd_enrolled: {
    getValue: () => ""
  },
  dcf_completed_training: {
    getValue: (row) => row._dcf?.totalEnrolled ?? row._count?.students ?? 0
  },
  dcf_ojt_sent: {
    getValue: () => ""
  },
  dcf_apaar_id_count: {
    getValue: () => ""
  },
  dcf_assessment_request_date: {
    getValue: () => ""
  },
  dcf_assessment_proposed_date: {
    getValue: () => ""
  },
  dcf_assessment_conducted: {
    getValue: () => "Yes"
  },
  dcf_not_conducted_reason: {
    getValue: () => ""
  },
  dcf_aa_name: {
    getValue: (row) => row.assessor ? `${row.assessor.first_name || ""} ${row.assessor.last_name || ""}`.trim() : ""
  },
  dcf_aa_allotment_date: {
    getValue: (row) => row.assessor_assign_datetime ? format(new Date(row.assessor_assign_datetime), "dd-MM-yyyy") : ""
  },
  dcf_assessment_mode: {
    getValue: (row) => {
      if (row.assessment_mode === 1) { return "ONLINE" }
      if (row.assessment_mode === 2) { return "OFFLINE" }

      return ""
    }
  },
  dcf_preferred_language: {
    getValue: () => ""
  },
  dcf_assessment_language: {
    getValue: () => ""
  },
  dcf_scheduled_date: {
    getValue: (row) => row.assessment_start_datetime ? format(new Date(row.assessment_start_datetime), "dd-MM-yyyy") : ""
  },
  dcf_learners_assessed: {
    getValue: (row) => row._dcf?.assessedCount ?? 0
  },
  dcf_actual_start_date: {
    getValue: (row) => row.assessment_start_datetime ? format(new Date(row.assessment_start_datetime), "dd-MM-yyyy") : ""
  },
  dcf_actual_end_date: {
    getValue: (row) => row.assessment_end_datetime ? format(new Date(row.assessment_end_datetime), "dd-MM-yyyy") : ""
  },
  dcf_assessors_deployed: {
    getValue: (row) => row.assessor ? 1 : 0
  },
  dcf_assessor_id: {
    getValue: (row) => row.assessor?.user_name || ""
  },
  dcf_proctoring_mode: {
    getValue: () => ""
  },
  dcf_learners_passed: {
    getValue: (row) => row._dcf?.passedCount ?? 0
  },
  dcf_avg_marks: {
    getValue: (row) => row._dcf?.avgMarks ?? ""
  },
  dcf_result_received_date: {
    getValue: () => ""
  },
  dcf_result_published_date: {
    getValue: () => ""
  },
  dcf_certificate_issued_date: {
    getValue: () => ""
  },
  dcf_digilocker_date: {
    getValue: () => ""
  },
  dcf_abc_upload_date: {
    getValue: () => ""
  },
  dcf_placements_conducted: {
    getValue: () => ""
  },
  dcf_learners_placed: {
    getValue: () => ""
  },
  dcf_avg_salary: {
    getValue: () => ""
  },
  dcf_self_employed: {
    getValue: () => ""
  },
  dcf_avg_income: {
    getValue: () => ""
  },
  dcf_remarks: {
    getValue: () => ""
  },

  /*
  |--------------------------------------------------------------------------
  | MONTHLY REPORT (AA Monitoring sheet)
  |--------------------------------------------------------------------------
  */

  mon_ab_name: {
    getValue: (row) => row.agency?.company_name || ""
  },
  mon_batch_id: {
    getValue: (row) => row.batch_name || ""
  },
  mon_sidh_batch: {
    getValue: (row) => row.is_sidh_batch || ""
  },
  mon_nsqf_aligned: {
    getValue: (row) => row.is_nsqf_aligned || ""
  },
  mon_month: {
    getValue: (row) => row.assessment_end_datetime ? format(new Date(row.assessment_end_datetime), "MMMM") : ""
  },
  mon_year: {
    getValue: (row) => row.assessment_end_datetime ? format(new Date(row.assessment_end_datetime), "yyyy") : ""
  },
  mon_allocation_date: {
    getValue: (row) => row.batch_allocated_date ? format(new Date(row.batch_allocated_date), "dd-MM-yyyy") : ""
  },
  mon_batch_status: {
    getValue: (row) => row.batch_acceptance || ""
  },
  mon_state: {
    getValue: (row) => row.training_center?.state?.state_name || ""
  },
  mon_district: {
    getValue: (row) => row.training_center?.city?.city_name || ""
  },
  mon_center_address: {
    getValue: (row) => {
      const tc = row.training_center

      if (!tc) return ""

      return [tc.address, tc.city?.city_name, tc.state?.state_name, tc.pin_code].filter(Boolean).join(", ")
    }
  },
  mon_funding_type: {
    getValue: (row) => row.funding_type || ""
  },
  mon_scheme_name: {
    getValue: (row) => row.scheme?.scheme_name || ""
  },
  mon_training_type: {
    getValue: (row) => row.training_type || ""
  },
  mon_qual_type: {
    getValue: (row) => row.qualification_pack?.qualification_type || ""
  },
  mon_sector: {
    getValue: (row) => row.qualification_pack?.ssc?.sector || row.qualification_pack?.ssc?.ssc_name || ""
  },
  mon_level: {
    getValue: (row) => row.qualification_pack?.nsqf_level || ""
  },
  mon_nqr_code: {
    getValue: (row) => row.qualification_pack?.nqr_code || ""
  },
  mon_qp_name: {
    getValue: (row) => row.qualification_pack?.qualification_pack_name || ""
  },
  mon_assessment_mode: {
    getValue: (row) => {
      if (row.assessment_mode === 1) { return "Online" }
      if (row.assessment_mode === 2) { return "Offline" }

      return ""
    }
  },
  mon_assessment_language: {
    getValue: () => ""
  },
  mon_awarding_entity: {
    getValue: (row) => row.qualification_pack?.ssc?.ssc_name || ""
  },
  mon_awarding_entity_type: {
    getValue: (row) => row.qualification_pack?.ssc?.type_of_awarding_body || ""
  },
  mon_scheduled_start_date: {
    getValue: (row) => row.assessment_start_datetime ? format(new Date(row.assessment_start_datetime), "dd-MM-yyyy") : ""
  },
  mon_actual_start_date: {
    getValue: (row) => row.assessment_start_datetime ? format(new Date(row.assessment_start_datetime), "dd-MM-yyyy") : ""
  },
  mon_actual_end_date: {
    getValue: (row) => row.assessment_end_datetime ? format(new Date(row.assessment_end_datetime), "dd-MM-yyyy") : ""
  },
  mon_toa_certified_assessor: {
    getValue: () => ""
  },
  mon_assessors_deployed: {
    getValue: (row) => row.assessor ? 1 : 0
  },
  mon_assessor_id: {
    getValue: (row) => row.assessor?.user_name || ""
  },
  mon_assessor_language_efficiency: {
    getValue: () => ""
  },
  mon_proctoring_mode: {
    getValue: () => ""
  },
  mon_candidates_scheduled: {
    getValue: (row) => row._count?.students ?? 0
  },
  mon_candidates_assessed: {
    getValue: (row) => row._dcf?.assessedCount ?? 0
  },
  mon_candidates_passed: {
    getValue: (row) => row._dcf?.passedCount ?? 0
  },
  mon_avg_marks: {
    getValue: (row) => row._dcf?.avgMarks ?? ""
  },
  mon_result_analysed: {
    getValue: () => ""
  },
  mon_result_submission_date: {
    getValue: () => ""
  },
  mon_result_correction: {
    getValue: () => ""
  },
  mon_assessment_link: {
    getValue: () => ""
  },
  mon_videos_reviewed: {
    getValue: () => ""
  },
  mon_remarks: {
    getValue: () => ""
  },

  /*
  |--------------------------------------------------------------------------
  | ANNUAL REPORT (Assessment Strategy sheet)
  |--------------------------------------------------------------------------
  */

  ann_ab_name: {
    getValue: (row) => row.agency?.company_name || ""
  },
  ann_sector: {
    getValue: (row) => row.ssc?.sector || row.ssc?.ssc_name || ""
  },
  ann_nqr_code: {
    getValue: (row) => row.nqr_code || ""
  },
  ann_qp_name: {
    getValue: (row) => row.qualification_pack_name || ""
  },
  ann_awarding_entity: {
    getValue: (row) => row.ssc?.ssc_name || ""
  },
  ann_awarding_entity_type: {
    getValue: (row) => row.ssc?.type_of_awarding_body || ""
  },
  ann_level: {
    getValue: (row) => row.nsqf_level || ""
  },
  ann_pc_count: {
    getValue: (row) => row._qpStats?.pcCount ?? 0
  },
  ann_qb_questions: {
    getValue: (row) => row._qpStats?.questionCount ?? 0
  },
  ann_qb_consultation: {
    getValue: (row) => row._qpStats?.qbConsultation ?? "No"
  },
  ann_qb_languages: {
    getValue: () => ""
  },
  ann_sample_paper: {
    getValue: () => ""
  },
  ann_toa_assessors: {
    getValue: (row) => row._qpStats?.toaAssessors ?? 0
  },
  ann_batches_assessed: {
    getValue: (row) => row._count?.batches ?? 0
  },
  ann_feedback_mechanism: {
    getValue: () => "Yes"
  },
  ann_feedback_batches: {
    getValue: (row) => row._qpStats?.feedbackBatches ?? 0
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

    const isAnnualReport =
      report.code === "annual_report";

    let rows: any[] = [];

    if (isAnnualReport) {
      // QP-wise: every qualification pack the agency worked on (has batches for this agency)
      rows =
        await prisma.qualification_packs.findMany({
          where: {
            deleted_at: null,

            // ✅ SSC filter
            ...(ssc_id && {
              ssc_id: Number(ssc_id)
            }),

            // ✅ QP filter
            ...(qp_id && {
              id: Number(qp_id)
            }),

            // ✅ QP must have at least one completed batch for this agency (worked on it)
            batches: {
              some: {
                deleted_at: null,
                agency_id: agencyId,
                batch_completed: 1,
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
              }
            }
          },

          include: {
            ssc: true,
            version: true,
            _count: {
              select: {
                batches: {
                  where: {
                    deleted_at: null,
                    agency_id: agencyId,
                    batch_completed: 1,
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
                  }
                }
              }
            }
          },

          orderBy: {
            id: "desc"
          }
        }) as any[];
    } else {
      // Batch-wise: default for all other report types
      rows =
        await prisma.batches.findMany({
          where: {
            deleted_at: null,
            agency_id: agencyId,
            batch_completed: 1,

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

            assessor: true,
            agency: true,
            _count: {
              select: { students: true }
            }
          },

          orderBy: {
            id: "desc"
          }
        }) as any[];
    }

    if (isAnnualReport && rows.length) {
      // qualification_packs has no agency relation — attach it manually
      const agency =
        await prisma.users.findUnique({
          where: { id: Number(agencyId) },
          select: { id: true, company_name: true }
        });

      // PC + question counts per QP
      const qpIds = rows.map(r => r.id);

      const nosRows =
        await prisma.nos.findMany({
          where: {
            qualification_packs: {
              some: { id: { in: qpIds } }
            }
          },
          select: {
            id: true,
            qualification_packs: { select: { id: true } }
          }
        });

      const nosIds = nosRows.map(n => n.id);

      const pcGroups =
        await prisma.pc.groupBy({
          by: ["nos_id"],
          _count: { id: true },
          where: { nos_id: { in: nosIds } }
        });

      const questionGroups =
        await prisma.questions.groupBy({
          by: ["qp_id"],
          _count: { id: true },
          where: { qp_id: { in: qpIds }, status: 1 }
        });

      const pcCountByQp = new Map<number, number>();

      for (const n of nosRows) {
        const count = pcGroups.find(g => g.nos_id === n.id)?._count?.id || 0;

        for (const qp of n.qualification_packs) {
          pcCountByQp.set(qp.id, (pcCountByQp.get(qp.id) || 0) + count);
        }
      }

      const questionCountByQp = new Map<number, number>();

      for (const g of questionGroups) {
        questionCountByQp.set(g.qp_id, g._count?.id || 0);
      }

      // QB consultation source (AB/Industry/None) per QP, from its exam sets
      const examSetGroups =
        await prisma.exam_sets.groupBy({
          by: ["qp_id"],
          _count: { id: true },
          where: {
            qp_id: { in: qpIds },
            qb_consultation: { in: ["AB", "Industry"] }
          }
        });

      const qbConsultationByQp = new Map<number, string>();

      for (const g of examSetGroups) {
        qbConsultationByQp.set(g.qp_id, g._count?.id ? "Yes" : "No");
      }

      for (const id of qpIds) {
        if (!qbConsultationByQp.has(id)) qbConsultationByQp.set(id, "No");
      }

      // TOA certified assessor count per QP (job role contains QP & not expired)
      const toaAssessors =
        await prisma.users.findMany({
          where: {
            master_id: Number(agencyId),
            role_id: 1,
            status: 1,
            is_deleted: 0
          },
          select: {
            id: true,
            user_additional_data: true
          }
        });

      const toaCountByQp = new Map<number, number>();
      const now = new Date();

      for (const assessor of toaAssessors) {
        const uad = assessor.user_additional_data;

        if (!uad) continue;
        if (!uad.assessor_certificate) continue;

        let jobRoles: number[] = [];
        let jobValidUpto: string[] = [];

        try {
          jobRoles = JSON.parse(String(uad.job_roles || "[]"));
          jobValidUpto = JSON.parse(String(uad.job_valid_upto || "[]"));
        } catch {
          continue;
        }

        jobRoles.forEach((qpId, index) => {
          const expiry = jobValidUpto[index] ? new Date(jobValidUpto[index]) : null;

          if (expiry && expiry >= now) {
            toaCountByQp.set(qpId, (toaCountByQp.get(qpId) || 0) + 1);
          }
        });
      }

      // Batches with feedback collected, per QP
      const feedbackBatches = await prisma.$queryRawUnsafe<
        { qp_id: number; count: bigint }[]
      >(`
        SELECT b.qp_id, COUNT(DISTINCT fr.batch_id) AS count
        FROM feedback_responses fr
        JOIN batches b ON b.id = fr.batch_id
        WHERE b.deleted_at IS NULL
          AND b.agency_id = ${Number(agencyId)}
          AND b.batch_completed = 1
          AND b.qp_id IN (${qpIds.join(",")})
          ${from_date && to_date
            ? `AND b.created_at BETWEEN '${from_date}' AND '${to_date}T23:59:59'`
            : ""}
        GROUP BY b.qp_id
      `);

      const feedbackBatchesByQp = new Map<number, number>();

      for (const fb of feedbackBatches) {
        feedbackBatchesByQp.set(Number(fb.qp_id), Number(fb.count));
      }

      for (const row of rows as any[]) {
        row.agency = agency;
        row._qpStats = {
          pcCount: pcCountByQp.get(row.id) || 0,
          questionCount: questionCountByQp.get(row.id) || 0,
          toaAssessors: toaCountByQp.get(row.id) || 0,
          feedbackBatches: feedbackBatchesByQp.get(row.id) || 0,
          qbConsultation: qbConsultationByQp.get(row.id) || "No"
        };
      }
    }

    /*
    |--------------------------------------------------------------------------
    | COMPUTE DCF STATS PER BATCH (skip for annual/QP-wise report)
    |--------------------------------------------------------------------------
    */

    if (!isAnnualReport) {
      const dcfBatchIds = rows.map(r => r.id)

      const dcfExamRows = await prisma.$queryRawUnsafe<
        { batch_id: number; assessed: bigint; total_correct: number | null; total_incorrect: number | null }[]
      >(`
        SELECT s.batch_id,
               COUNT(DISTINCT s.id) AS assessed,
               COALESCE(SUM(sr.correct), 0) AS total_correct,
               COALESCE(SUM(sr.incorrect), 0) AS total_incorrect
        FROM student_exam_set_results sr
        JOIN students s ON s.id = sr.student_id
        WHERE s.batch_id IN (${dcfBatchIds.join(",")})
        GROUP BY s.batch_id
      `)

      const dcfStatsMap = new Map<number, { assessed: number; totalCorrect: number; totalIncorrect: number }>()

      for (const r of dcfExamRows) {
        dcfStatsMap.set(Number(r.batch_id), {
          assessed: Number(r.assessed),
          totalCorrect: Number(r.total_correct || 0),
          totalIncorrect: Number(r.total_incorrect || 0)
        })
      }

      // Attach DCF stats to each row
      for (const row of rows as any[]) {
        const stats = dcfStatsMap.get(row.id)
        const total = row._count?.students ?? 0
        const assessed = stats?.assessed ?? 0
        const totalCorrect = stats?.totalCorrect ?? 0
        const totalIncorrect = stats?.totalIncorrect ?? 0
        const totalAttempts = totalCorrect + totalIncorrect

        row._dcf = {
          totalEnrolled: total,
          assessedCount: assessed,
          passedCount: totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * assessed) : 0,
          avgMarks: totalAttempts > 0 ? ((totalCorrect / totalAttempts) * 100).toFixed(2) : ""
        }
      }
    }

    /*
    |--------------------------------------------------------------------------
    | COMPUTE MASTER SHEET STATS PER BATCH (Pass/Fail/Absent/Percentages)
    |--------------------------------------------------------------------------
    */

    if (!isAnnualReport) {
      const masterBatchIds = rows.map(r => r.id)

      const resultGroups =
        await prisma.students.groupBy({
          by: ["batch_id", "result"],
          _count: { id: true },
          where: {
            batch_id: { in: masterBatchIds }
          }
        })

      const resultCountMap =
        new Map<number, { pass: number; fail: number; absent: number }>()

      for (const g of resultGroups) {
        const entry =
          resultCountMap.get(g.batch_id) || { pass: 0, fail: 0, absent: 0 }

        if (g.result === 1) {
          entry.pass = g._count.id
        } else if (g.result === 2) {
          entry.fail = g._count.id
        } else {
          entry.absent += g._count.id
        }

        resultCountMap.set(g.batch_id, entry)
      }

      const studentExamRows = await prisma.$queryRawUnsafe<
        { batch_id: number; correct: number | null; total_questions: number | null }[]
      >(`
        SELECT s.batch_id,
               SUM(sr.correct) AS correct,
               SUM(sr.total_questions) AS total_questions
        FROM student_exam_set_results sr
        JOIN students s ON s.id = sr.student_id
        WHERE s.batch_id IN (${masterBatchIds.join(",")})
        GROUP BY s.batch_id, sr.student_id
      `)

      const perBatchPercentages =
        new Map<number, number[]>()

      for (const r of studentExamRows) {
        if (!r.total_questions) continue

        const percentage =
          (Number(r.correct || 0) / Number(r.total_questions)) * 100

        if (!perBatchPercentages.has(r.batch_id)) {
          perBatchPercentages.set(r.batch_id, [])
        }

        perBatchPercentages.get(r.batch_id)!.push(percentage)
      }

      for (const row of rows as any[]) {
        const counts =
          resultCountMap.get(row.id) || { pass: 0, fail: 0, absent: 0 }

        const present = counts.pass + counts.fail

        const percentages = perBatchPercentages.get(row.id)

        const avgPercent =
          percentages && percentages.length > 0
            ? (percentages.reduce((sum, p) => sum + p, 0) / percentages.length).toFixed(2)
            : ""

        row._master = {
          pass: counts.pass,
          fail: counts.fail,
          absent: counts.absent,
          present: present,
          passPercent: present > 0 ? ((counts.pass / present) * 100).toFixed(2) : "",
          avgPercent
        }
      }
    }

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
