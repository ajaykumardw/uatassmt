import { format } from "date-fns";

import {
  type exam_set_results,
} from "@prisma/client";

import prisma from "@/libs/prisma";

import { decrypt } from "@/utils/encryption";
import getValidImage from "@/utils/getValidImage";
import {
  agencyImagePath,
  agencyUsersFilePath,
  sscImagePath
} from "@/configs/customDataConfig";

// ======================================================
// HELPERS
// ======================================================

const sortByNosAndPc = (data: any[]) => {
  return [...data].sort((a: any, b: any) => {
    const aQuestion = a.questions || a.question;
    const bQuestion = b.questions || b.question;

    const aPc = aQuestion?.pc_questions?.[0];
    const bPc = bQuestion?.pc_questions?.[0];

    const aNos = aPc?.pc?.nos?.nos_name || "";
    const bNos = bPc?.pc?.nos?.nos_name || "";

    const nosCompare = aNos.localeCompare(bNos, undefined, {
      numeric: true,
      sensitivity: "base"
    });

    if (nosCompare !== 0) return nosCompare;

    const aPcName = aPc?.pc?.pc_name || "";
    const bPcName = bPc?.pc?.pc_name || "";

    return aPcName.localeCompare(bPcName, undefined, {
      numeric: true,
      sensitivity: "base"
    });
  });
};

const groupBy = <T, K extends keyof T>(
  arr: T[],
  key: K
): Record<string, T[]> => {
  return arr.reduce((acc, item) => {
    const val = String(item[key]);

    if (!acc[val]) acc[val] = [];

    acc[val].push(item);

    return acc;
  }, {} as Record<string, T[]>);
};

// ======================================================
// MAIN
// ======================================================

export const generateBatchResultData = async (
  batchId: number
) => {
  // ======================================================
  // BATCH
  // ======================================================

  const batch = await prisma.batches.findUnique({
    where: { id: batchId },
    select: {
      batch_name: true,
      theory_exam_set_id: true,
      assessment_start_datetime: true,

      scheme: {
        select: {
          scheme_name: true
        }
      },

      sub_scheme: {
        select: {
          scheme_name: true
        }
      },

      qualification_pack: {
        select: {
          qualification_pack_name: true,

          total_theory_marks: true,
          total_practical_marks: true,
          total_viva_marks: true,
          total_project_marks: true,
          total_marks: true,

          theory_cutoff_marks: true,
          practical_cutoff_marks: true,
          viva_cutoff_marks: true,
          overall_cutoff_marks: true,

          ssc: {
            select: {
              id: true,
              ssc_image: true
            }
          }
        }
      },

      agency: {
        select: {
          id: true,
          avatar: true,
          first_name: true,
          last_name: true,
          company_name: true,
          sign_image: true,
        }
      },

      training_partner: {
        select: {
          id: true,
          avatar: true,
          company_name: true
        }
      },
      training_center: {
        select: {
          id: true,
          company_name: true,
          first_name: true,
          last_name: true,
          sign_image: true
        }
      },
      center_spoc_person_name: true,
    }
  });

  if (!batch) throw new Error("Batch not found");

  if (!batch.theory_exam_set_id) {
    throw new Error("Theory exam set missing");
  }

  const examSetId = batch.theory_exam_set_id;

  // ======================================================
  // STUDENTS
  // ======================================================

  const students = await prisma.students.findMany({
    where: {
      batch_id: batchId,
      attendance: 1
    },
    select: {
      id: true,
      candidate_id: true,
      candidate_name: true,
      aadhaar_no: true
    }
  });

  const studentIds = students.map((x) => x.id);

  // ======================================================
  // FETCH EVERYTHING ONCE
  // ======================================================

  const [questionsRaw, allResults, allAttempts] =
    await Promise.all([
      prisma.exam_sets_questions.findMany({
        where: {
          exam_set_id: examSetId
        },
        include: {
          questions: {
            include: {
              pc_questions: {
                include: {
                  pc: {
                    include: {
                      nos: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          id: "asc"
        }
      }),

      prisma.exam_set_results.findMany({
        where: {
          exam_set_id: examSetId,
          student_id: {
            in: studentIds
          }
        }
      }),

      prisma.student_question_attempts.findMany({
        where: {
          student_id: {
            in: studentIds
          }
        },
        include: {
          question: {
            include: {
              pc_questions: {
                include: {
                  pc: {
                    include: {
                      nos: true
                    }
                  }
                }
              }
            }
          }
        }
      })
    ]);

  const questions = sortByNosAndPc(questionsRaw);

  const resultsByStudent = groupBy(
    allResults,
    "student_id"
  );

  const attemptsByStudent = groupBy(
    allAttempts,
    "student_id"
  );

  // ======================================================
  // ASSETS
  // ======================================================

  const validSSC =
    batch.qualification_pack.ssc?.ssc_image &&
    getValidImage(
      batch.qualification_pack.ssc.ssc_image,
      `ssc/${batch.qualification_pack.ssc.id}`
    );

  const validAgency =
    batch.agency?.avatar &&
    getValidImage(
      batch.agency.avatar,
      `agency/${batch.agency.id}`
    );

  const validTP =
    batch.training_partner?.avatar &&
    getValidImage(
      batch.training_partner.avatar,
      `agency/users/${batch.training_partner.id}`
    );

  const validAgencySign = batch.agency?.sign_image &&
    getValidImage(
      batch.agency.sign_image,
      `agency/${batch.agency.id}/sign`
    );

  const validTCSign = batch.training_center?.sign_image &&
    getValidImage(
      batch.training_center.sign_image,
      `agency/users/${batch.training_center.id}/sign`
    );

  const assets = {
    ssc_image:
      validSSC &&
      batch.qualification_pack.ssc
        ? sscImagePath(
            batch.qualification_pack.ssc.id,
            validSSC
          )
        : null,

    agency_image:
      validAgency && batch.agency
        ? agencyImagePath(
            batch.agency.id,
            validAgency
          )
        : null,

    tp_image:
      validTP && batch.training_partner
        ? agencyUsersFilePath(
            batch.training_partner.id,
            validTP
          )
        : null,

    agency_sign:
      validAgencySign && batch.agency
        ? agencyImagePath(
            batch.agency.id,
            `sign/${validAgencySign}`
          )
        : null,

    tc_sign:
      validTCSign && batch.training_center
        ? agencyUsersFilePath(
            batch.training_center.id,
            `sign/${validTCSign}`
          )
        : null
  };

  // ======================================================
  // BUILD RESULT
  // ======================================================

  const candidates = students.map((student) => {
    const studentResults: exam_set_results[] =
      resultsByStudent[String(student.id)] || [];

    const studentAttempts =
      attemptsByStudent[String(student.id)] || [];

    const resultMap = new Map(
      studentResults.map((r) => [
        r.question_id,
        r
      ])
    );

    const practicalAttempts =
      sortByNosAndPc(
        studentAttempts.filter(
          (x: any) =>
            x.question.question_type ===
            "practical"
        )
      );

    const vivaAttempts =
      sortByNosAndPc(
        studentAttempts.filter(
          (x: any) =>
            x.question.question_type ===
            "viva"
        )
      );

    // ======================================================
    // THEORY REPORT
    // ======================================================

    const report = questions.map(
      (item: any, index: number) => {
        const question = item.questions;

        const result = resultMap.get(
          question.id
        );

        const pcData =
          question.pc_questions?.[0];

        const options: Record<
          number,
          string | null
        > = {
          1: question.option1,
          2: question.option2,
          3: question.option3,
          4: question.option4,
          5: question.option5
        };

        const marks = Number(
          item.marks ||
            question.marks ||
            0
        );

        const obtained =
          result?.student_answer ===
          question.answer
            ? marks
            : 0;

        return {
          sr_no: index + 1,
          nos_name:
            pcData?.pc?.nos?.nos_name ||
            "",
          pc_name:
            pcData?.pc?.pc_name || "",
          question:
            question.question,
          correct_answer:
            options[
              question.answer || 0
            ] || "--",
          candidate_response:
            result?.student_answer
              ? options[
                  result.student_answer
                ] || "--"
              : "--",
          max_marks: marks,
          obtained_marks:
            obtained
        };
      }
    );

    // ======================================================
    // PRACTICAL
    // ======================================================

    const practical_report =
      practicalAttempts.map(
        (
          item: any,
          index: number
        ) => ({
          sr_no: index + 1,
          nos_name:
            item.question
              .pc_questions?.[0]?.pc
              ?.nos?.nos_name ||
            "",
          pc_name:
            item.question
              .pc_questions?.[0]?.pc
              ?.pc_name || "",
          question:
            item.question
              .question,
          max_marks: Number(
            item.max_marks || 0
          ),
          obtained_marks:
            Number(
              item.obtained_marks ||
                0
            )
        })
      );

    // ======================================================
    // VIVA
    // ======================================================

    const viva_report =
      vivaAttempts.map(
        (
          item: any,
          index: number
        ) => ({
          sr_no: index + 1,
          nos_name:
            item.question
              .pc_questions?.[0]?.pc
              ?.nos?.nos_name ||
            "",
          pc_name:
            item.question
              .pc_questions?.[0]?.pc
              ?.pc_name || "",
          question:
            item.question
              .question,
          max_marks: Number(
            item.max_marks || 0
          ),
          obtained_marks:
            Number(
              item.obtained_marks ||
                0
            )
        })
      );

    const nosMap = new Map();

    const allRows = [
      ...report,
      ...practical_report,
      ...viva_report
    ];

    for (const row of allRows) {

      const nosName = row.nos_name || "N/A";

      if (!nosMap.has(nosName)) {
        nosMap.set(nosName, {
          nos_name: nosName,
          total_marks: 0,
          obtained_marks: 0
        });
      }

      const item = nosMap.get(nosName);

      item.total_marks += Number(row.max_marks || 0);
      item.obtained_marks += Number(row.obtained_marks || 0);
    }

    const summary_report = Array.from(nosMap.values()).map((item, index) => ({
      sr_no: index + 1,
      nos_name: item.nos_name,
      total_marks: item.total_marks,
      obtained_marks: item.obtained_marks
    }));

    // ======================================================
    // TOTALS
    // ======================================================


    const totalTheoryMarks = Number(
      batch.qualification_pack.total_theory_marks
    );

    const totalPracticalMarks = Number(
      batch.qualification_pack.total_practical_marks
    )

    const totalVivaMarks = Number(
      batch.qualification_pack.total_viva_marks
    )

    const totalProjectMarks = Number(
      batch.qualification_pack.total_project_marks
    )

    const totalMarks = Number(
      batch.qualification_pack.total_marks
    );

    const obtainedProjectMarks = 0;

    const obtainedTheoryMarks = report.reduce(
      (sum, row) => sum + Number(row.obtained_marks || 0),
      0
    );

    const obtainedPracticalMarks = practical_report.reduce(
      (sum, row) => sum + Number(row.obtained_marks || 0),
      0
    );

    const obtainedVivaMarks = viva_report.reduce(
      (sum, row) => sum + Number(row.obtained_marks || 0),
      0
    );

    const theoryPercentage = totalTheoryMarks > 0 ? (obtainedTheoryMarks / totalTheoryMarks) * 100 : 0;
    const practicalPercentage = totalPracticalMarks > 0 ? (obtainedPracticalMarks / totalPracticalMarks) * 100 : 0;
    const vivaPercentage = totalVivaMarks > 0 ? (obtainedVivaMarks / totalVivaMarks) * 100 : 0;
    const projectPercentage = totalProjectMarks > 0 ? (obtainedProjectMarks / totalProjectMarks) * 100 : 0;

    const theoryCutoff =
      Number(batch.qualification_pack.theory_cutoff_marks) || 0;

    const practicalCutoff =
      Number(batch.qualification_pack.practical_cutoff_marks) || 0;

    const vivaCutoff =
      Number(batch.qualification_pack.viva_cutoff_marks) || 0;

    const projectCutoff =
      Number(batch.qualification_pack.overall_cutoff_marks) || 0;

    const theoryResultStatus =
      theoryPercentage >= theoryCutoff ? "PASS" : "FAIL";

    const practicalResultStatus =
      practicalPercentage >= practicalCutoff ? "PASS" : "FAIL";

    const vivaResultStatus =
      vivaPercentage >= vivaCutoff ? "PASS" : "FAIL";

    const projectResultStatus =
      projectPercentage >= projectCutoff ? "PASS" : "FAIL";

    const obtainedMarks = obtainedTheoryMarks + obtainedPracticalMarks + obtainedVivaMarks + obtainedProjectMarks;

    const overallCutoff =
      Number(batch.qualification_pack.overall_cutoff_marks) || 0;

    const overallPercentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

    const overallResultStatus =
      overallPercentage >= overallCutoff ? "PASS" : "FAIL";

    return {
      candidate: {
        name:
          student.candidate_name.toUpperCase(),

        candidate_id:
          student.candidate_id,

        aadhaar:
          student.aadhaar_no
            ? decrypt(
                student.aadhaar_no
              )
            : null,

        assessment_date:
          batch.assessment_start_datetime
            ? format(
                batch.assessment_start_datetime,
                "dd-MMM-yyyy"
              )
            : null,

        batch:
          batch.batch_name,

        scheme:
          batch.scheme
            .scheme_name,

        sub_scheme:
          batch.sub_scheme
            .scheme_name,

        qp: batch
          .qualification_pack
          .qualification_pack_name,

        partner:
          batch
            .training_partner
            ?.company_name ||
          "",

        agency_name:
          batch.agency
            ?.company_name ||
          "",

        agency_head_name: `${batch.agency?.first_name || ""} ${
          batch.agency?.last_name || ""
        }`.trim(),

        center_manager_name: batch?.center_spoc_person_name ? batch.center_spoc_person_name : `${batch.training_center?.first_name || ""} ${batch.training_center?.last_name || ""}`.trim(),

        total_marks: totalMarks,
        obtained_marks: obtainedMarks,
        percentage: overallPercentage.toFixed(2),
        result_status: overallResultStatus,
        total_theory_marks: totalTheoryMarks,
        obtained_theory_marks: obtainedTheoryMarks,
        theory_percentage: theoryPercentage.toFixed(2),
        theory_result_status: theoryResultStatus,
        total_practical_marks: totalPracticalMarks,
        obtained_practical_marks: obtainedPracticalMarks,
        practical_percentage: practicalPercentage.toFixed(2),
        practical_result_status: practicalResultStatus,
        total_viva_marks: totalVivaMarks,
        obtained_viva_marks: obtainedVivaMarks,
        viva_percentage: vivaPercentage.toFixed(2),
        viva_result_status: vivaResultStatus,
        total_project_marks: totalProjectMarks,
        obtained_project_marks: obtainedProjectMarks,
        project_percentage: projectPercentage.toFixed(2),
        project_result_status: projectResultStatus,
        summary_report: summary_report,
      },

      report,
      practical_report,
      viva_report
    };
  });

  return {
    candidates,
    assets
  };
};
