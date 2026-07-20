// app/api/batch-date-correction/route.ts

export const dynamic = "force-dynamic";

// import path from "path";
// import fs from "fs/promises";

import { NextResponse } from "next/server";

import { compare } from 'bcrypt'

import { Workbook } from "exceljs";

import type { Prisma ,
  batches,
  student_exam_set_results,
  exam_set_results,
  feedback_responses,
  feedback_response_answers
} from "@prisma/client";



import { getServerSession } from "next-auth";

import { format } from "date-fns";

import { authOptions } from "@/libs/auth";

import prisma from "@/libs/prisma";

// const FILE_PATH = path.join(
//   process.cwd(),
//   "storage",
//   "uploads",
//   "corrections",
//   "batch-date-correction.xlsx"
// );

type LogRow = {
  row: number;
  batch_name: string;
  date?: string;
  actual_date?: string;
  status: string;
};

function parseDate(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Date) return value;

  const str = String(value).trim();

  const parts = str.split(/[-/]/);

  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts.map(Number);

    if (!dd || !mm || !yyyy) return null;

    return new Date(yyyy, mm - 1, dd);
  }

  const d = new Date(str);

  return isNaN(d.getTime()) ? null : d;
}

function replaceDateKeepTime(
  oldDate: Date | null,
  newDate: Date
): Date {
  const base = oldDate
    ? new Date(oldDate)
    : new Date();

  base.setFullYear(newDate.getFullYear());
  base.setMonth(newDate.getMonth());
  base.setDate(newDate.getDate());

  return base;
}

function updateAttemptTimeData(
  value: string,
  newDate: Date
): string {
  if (!value) return value;

  try {
    const parsed = JSON.parse(value) as Array<
      [number, string, string]
    >;

    const updated = parsed.map(
      ([flag, start, end]) => {
        const startDt =
          replaceDateKeepTime(
            new Date(start),
            newDate
          );

        const endDt =
          replaceDateKeepTime(
            new Date(end),
            newDate
          );

        const pad = (
          n: number
        ) =>
          String(n).padStart(
            2,
            "0"
          );

        const format = (
          dt: Date
        ) =>
          `${dt.getFullYear()}-${pad(
            dt.getMonth() + 1
          )}-${pad(dt.getDate())} ${pad(
            dt.getHours()
          )}:${pad(
            dt.getMinutes()
          )}:${pad(
            dt.getSeconds()
          )}`;

        return [
          flag,
          format(startDt),
          format(endDt)
        ];
      }
    );

    return JSON.stringify(
      updated
    );
  } catch {
    return value;
  }
}

async function processBatch(
  item: {
    rowNumber: number;
    batchName: string;
    startDate: Date;
    endDate: Date;
    batch: batches;
  }
): Promise<LogRow> {
  const {
    rowNumber,
    batchName,
    startDate,
    endDate,
    batch
  } = item;

  try {

      await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          await tx.batches.update(
            {
              where: {
                id: batch.id
              },
              data: {
                assessment_start_datetime:
                  replaceDateKeepTime(
                    batch.assessment_start_datetime,
                    startDate
                  ),

                assessment_end_datetime:
                  replaceDateKeepTime(
                    batch.assessment_end_datetime,
                    endDate
                  ),

                assessor_assign_datetime:
                  replaceDateKeepTime(
                    batch.assessor_assign_datetime,
                    startDate
                  ),

                created_at:
                  replaceDateKeepTime(
                    batch.created_at,
                    startDate
                  ),

                updated_at:
                  replaceDateKeepTime(
                    batch.updated_at,
                    startDate
                  ),
              }
            }
          );

          const students =
            await tx.students.findMany(
              {
                where: {
                  batch_id:
                    batch.id
                },
                select: {
                  id: true
                }
              }
            );

          const studentIds =
            students.map(
              (x: any) => x.id
            );

          if (
            studentIds.length >
            0
          ) {

            await tx.$executeRaw`
              UPDATE students
              SET
                created_at = CAST(
                  DATE_ADD(DATE(${startDate}), INTERVAL TIME_TO_SEC(TIME(created_at)) SECOND)
                  AS DATETIME
                ),
                updated_at = CAST(
                  DATE_ADD(DATE(${startDate}), INTERVAL TIME_TO_SEC(TIME(updated_at)) SECOND)
                  AS DATETIME
                )
              WHERE batch_id = ${batch.id}
            `

            const examRows:
              student_exam_set_results[] =
              await tx.student_exam_set_results.findMany(
                {
                  where: {
                    student_id:
                      {
                        in: studentIds
                      }
                  }
                }
              );

            for (const item of examRows) {
              await tx.student_exam_set_results.update(
                {
                  where: {
                    id: item.id
                  },
                  data: {
                    exam_appear_date:
                      replaceDateKeepTime(
                        item.exam_appear_date,
                        startDate
                      ),
                  }
                }
              );
            }

            const resultRows:
              exam_set_results[] =
              await tx.exam_set_results.findMany(
                {
                  where: {
                    student_id:
                      {
                        in: studentIds
                      }
                  }
                }
              );

            for (const item of resultRows) {
              await tx.exam_set_results.update(
                {
                  where: {
                    id: item.id
                  },
                  data: {
                    created_at:
                      replaceDateKeepTime(
                        item.created_at,
                        startDate
                      ),
                    updated_at:
                      replaceDateKeepTime(
                        item.updated_at,
                        startDate
                      ),
                      attempt_time_data:
                        updateAttemptTimeData(
                          item.attempt_time_data,
                          startDate
                        )
                  }
                }
              );
            }
          }

          const feedbackRows:
            feedback_responses[] =
            await tx.feedback_responses.findMany(
              {
                where: {
                  batch_id:
                    batch.id
                }
              }
            );

          for (const item of feedbackRows) {
            await tx.feedback_responses.update(
              {
                where: {
                  id: item.id
                },
                data: {
                  submitted_at:
                    replaceDateKeepTime(
                      item.submitted_at,
                      startDate
                    ),
                  created_at:
                    replaceDateKeepTime(
                      item.created_at,
                      startDate
                    ),
                  updated_at:
                    replaceDateKeepTime(
                      item.updated_at,
                      startDate
                    )
                }
              }
            );
          }

          const feedbackIds =
            feedbackRows.map(
              x => x.id
            );

          if (
            feedbackIds.length >
            0
          ) {
            const answerRows:
              feedback_response_answers[] =
              await tx.feedback_response_answers.findMany(
                {
                  where: {
                    feedback_response_id:
                      {
                        in: feedbackIds
                      }
                  }
                }
              );

            for (const item of answerRows) {
              await tx.feedback_response_answers.update(
                {
                  where: {
                    id: item.id
                  },
                  data: {
                    created_at:
                      replaceDateKeepTime(
                        item.created_at,
                        startDate
                      ),
                    updated_at:
                      replaceDateKeepTime(
                        item.updated_at,
                        startDate
                      )
                  }
                }
              );
            }
          }

          await tx.batches.update(
            {
              where: {
                id: batch.id
              },
              data: {
                auto_update: 1
              }
            }
          );
        },
        {
          timeout: 1000 * 60 * 5
        }
      );

    return {
      row: rowNumber,
      batch_name: batchName,
      status: "Updated Successfully"
    };
  } catch (error: any) {
    return {
      row: rowNumber,
      batch_name: batchName,
      status: "Failed : " + error.message
    };
  }
}

export async function POST(req: Request) {
  try {

    // try {
    //   await fs.access(FILE_PATH);
    // } catch {
    //   return NextResponse.json({
    //     success: false,
    //     message: "File not found"
    //   });
    // }

    const session = await getServerSession(authOptions);
    const authUser = session?.user;

    if(authUser?.user_type != 'AG' || !authUser.id){
      return NextResponse.json({
        success: false,
        message: "Unauthorized"
      }, { status: 403 });
    }

    const formData = await req.formData();

    const file = formData.get("file") as File;
    const password = formData.get("password") as string;

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

    const buffer = await file.arrayBuffer();

    // const workbook =
    //   new ExcelJS.Workbook();

    const workbook = new Workbook();

    // await workbook.xlsx.readFile(
    //   FILE_PATH
    // );
    await workbook.xlsx.load(buffer);

    const sheet =
      workbook.worksheets[0];

    if (!sheet) {
      return NextResponse.json({
        success: false,
        message:
          "Worksheet not found"
      }, { status: 404 });
    }

    const headerRow =
      sheet.getRow(1);

    const headers: string[] = [];

    headerRow.eachCell(
      (cell, colNumber) => {
        headers[colNumber] = String(
          cell.value ?? ""
        )
          .trim()
          .toLowerCase();
      }
    );

    const batchCol =
      headers.findIndex(
        x => x === "batch_name"
      );

    const dateCol =
      headers.findIndex(
        x => x === "date"
      );

    if (
      batchCol === -1 ||
      dateCol === -1
    ) {
      return NextResponse.json({
        success: false,
        message:
          "Columns required: batch_name, date"
      }, { status: 400 });
    }

    // const logs: LogRow[] = [];
    const LIMIT = 10;
    const logs: LogRow[] = [];

    const jobs: Array<{
      rowNumber: number;
      batchName: string;
      startDate: Date;
      endDate: Date;
      batch: batches;
    }> = [];

    for (
      let rowNumber = 2;
      rowNumber <= sheet.rowCount;
      rowNumber++
    ) {
      const row =
        sheet.getRow(rowNumber);

      const batchName = String(
        row.getCell(batchCol)
          .value ?? ""
      ).trim();

      if (!batchName) continue;

      const startDate =
        parseDate(
          row.getCell(dateCol)
            .value
        );

      const endDate =
        parseDate(
          row.getCell(dateCol)
            .value
        );

      if (
        !startDate ||
        !endDate
      ) {
        logs.push({
          row: rowNumber,
          batch_name:
            batchName,
          status:
            "Invalid Date"
        });

        continue;
      }

      const batch:
        | batches
        | null =
        await prisma.batches.findFirst(
          {
            where: {
              batch_name: batchName,
              agency_id: Number(authUser.id),
              auto_update: 0
            }
          }
        );

      if (!batch) {
        logs.push({
          row: rowNumber,
          batch_name:
            batchName,
          date: format(startDate, "dd-MM-yyyy"),
          status:
            "Failed: Batch Not Found / Already Updated"
        });

        continue;
      }

      jobs.push({
        rowNumber,
        batchName,
        startDate,
        endDate,
        batch
      });

      if (jobs.length >= LIMIT) {
        break;
      }


      // await prisma.$transaction(
      //   async (tx: Prisma.TransactionClient) => {
      //     await tx.batches.update(
      //       {
      //         where: {
      //           id: batch.id
      //         },
      //         data: {
      //           assessment_start_datetime:
      //             replaceDateKeepTime(
      //               batch.assessment_start_datetime,
      //               startDate
      //             ),

      //           assessment_end_datetime:
      //             replaceDateKeepTime(
      //               batch.assessment_end_datetime,
      //               endDate
      //             ),

      //           assessor_assign_datetime:
      //             replaceDateKeepTime(
      //               batch.assessor_assign_datetime,
      //               startDate
      //             ),

      //           created_at:
      //             replaceDateKeepTime(
      //               batch.created_at,
      //               startDate
      //             ),

      //           updated_at:
      //             replaceDateKeepTime(
      //               batch.updated_at,
      //               startDate
      //             ),
      //         }
      //       }
      //     );

      //     const students =
      //       await tx.students.findMany(
      //         {
      //           where: {
      //             batch_id:
      //               batch.id
      //           },
      //           select: {
      //             id: true
      //           }
      //         }
      //       );

      //     const studentIds =
      //       students.map(
      //         (x: any) => x.id
      //       );

      //     if (
      //       studentIds.length >
      //       0
      //     ) {

      //       await prisma.$executeRaw`
      //         UPDATE students
      //         SET
      //           created_at = CAST(
      //             DATE_ADD(DATE(${startDate}), INTERVAL TIME_TO_SEC(TIME(created_at)) SECOND)
      //             AS DATETIME
      //           ),
      //           updated_at = CAST(
      //             DATE_ADD(DATE(${startDate}), INTERVAL TIME_TO_SEC(TIME(updated_at)) SECOND)
      //             AS DATETIME
      //           )
      //         WHERE batch_id = ${batch.id}
      //       `

      //       const examRows:
      //         student_exam_set_results[] =
      //         await tx.student_exam_set_results.findMany(
      //           {
      //             where: {
      //               student_id:
      //                 {
      //                   in: studentIds
      //                 }
      //             }
      //           }
      //         );

      //       for (const item of examRows) {
      //         await tx.student_exam_set_results.update(
      //           {
      //             where: {
      //               id: item.id
      //             },
      //             data: {
      //               exam_appear_date:
      //                 replaceDateKeepTime(
      //                   item.exam_appear_date,
      //                   startDate
      //                 ),
      //             }
      //           }
      //         );
      //       }

      //       const resultRows:
      //         exam_set_results[] =
      //         await tx.exam_set_results.findMany(
      //           {
      //             where: {
      //               student_id:
      //                 {
      //                   in: studentIds
      //                 }
      //             }
      //           }
      //         );

      //       for (const item of resultRows) {
      //         await tx.exam_set_results.update(
      //           {
      //             where: {
      //               id: item.id
      //             },
      //             data: {
      //               created_at:
      //                 replaceDateKeepTime(
      //                   item.created_at,
      //                   startDate
      //                 ),
      //               updated_at:
      //                 replaceDateKeepTime(
      //                   item.updated_at,
      //                   startDate
      //                 ),
      //                 attempt_time_data:
      //                   updateAttemptTimeData(
      //                     item.attempt_time_data,
      //                     startDate
      //                   )
      //             }
      //           }
      //         );
      //       }
      //     }

      //     const feedbackRows:
      //       feedback_responses[] =
      //       await tx.feedback_responses.findMany(
      //         {
      //           where: {
      //             batch_id:
      //               batch.id
      //           }
      //         }
      //       );

      //     for (const item of feedbackRows) {
      //       await tx.feedback_responses.update(
      //         {
      //           where: {
      //             id: item.id
      //           },
      //           data: {
      //             submitted_at:
      //               replaceDateKeepTime(
      //                 item.submitted_at,
      //                 startDate
      //               ),
      //             created_at:
      //               replaceDateKeepTime(
      //                 item.created_at,
      //                 startDate
      //               ),
      //             updated_at:
      //               replaceDateKeepTime(
      //                 item.updated_at,
      //                 startDate
      //               )
      //           }
      //         }
      //       );
      //     }

      //     const feedbackIds =
      //       feedbackRows.map(
      //         x => x.id
      //       );

      //     if (
      //       feedbackIds.length >
      //       0
      //     ) {
      //       const answerRows:
      //         feedback_response_answers[] =
      //         await tx.feedback_response_answers.findMany(
      //           {
      //             where: {
      //               feedback_response_id:
      //                 {
      //                   in: feedbackIds
      //                 }
      //             }
      //           }
      //         );

      //       for (const item of answerRows) {
      //         await tx.feedback_response_answers.update(
      //           {
      //             where: {
      //               id: item.id
      //             },
      //             data: {
      //               created_at:
      //                 replaceDateKeepTime(
      //                   item.created_at,
      //                   startDate
      //                 ),
      //               updated_at:
      //                 replaceDateKeepTime(
      //                   item.updated_at,
      //                   startDate
      //                 )
      //             }
      //           }
      //         );
      //       }
      //     }

      //     await tx.batches.update(
      //       {
      //         where: {
      //           id: batch.id
      //         },
      //         data: {
      //           auto_update: 1
      //         }
      //       }
      //     );
      //   },
      //   {
      //     timeout: 1000 * 60 * 5
      //   }
      // );

      // logs.push({
      //   row: rowNumber,
      //   batch_name:
      //     batchName,
      //   status:
      //     "Updated Successfully"
      // });
    }


    const results = await Promise.allSettled(
      jobs.map(job => processBatch(job))
    )

    results.forEach((result: any, index: number) => {
      const item = jobs[index];

      if (result.status === "fulfilled") {
        logs.push({
          row: item.rowNumber,
          batch_name: item.batchName,
          date: format(item.startDate, "dd-MM-yyyy"),
          actual_date: item?.batch?.assessment_start_datetime
            ? format(item.batch.assessment_start_datetime, "dd-MM-yyyy")
            : undefined,
          status: "Updated Successfully"
        });
      } else {
        logs.push({
          row: item.rowNumber,
          batch_name: item.batchName,
          date: format(item.startDate, "dd-MM-yyyy"),
          actual_date: item?.batch?.assessment_start_datetime
            ? format(item.batch.assessment_start_datetime, "dd-MM-yyyy")
            : undefined,
          status: "Failed: " + result.reason
        });
      }
    });

    return NextResponse.json({
      success: true,
      total:
        logs.length,
      processed: jobs.length,
      logs
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Server Error"
      },
      { status: 500 }
    );
  }
}

// export async function GET() {
//   try {
//     try {
//       await fs.access(FILE_PATH);
//     } catch {
//       return NextResponse.json({
//         success: false,
//         message: "File not found"
//       });
//     }

//     const workbook =
//       new ExcelJS.Workbook();

//     await workbook.xlsx.readFile(
//       FILE_PATH
//     );

//     const sheet =
//       workbook.worksheets[0];

//     if (!sheet) {
//       return NextResponse.json({
//         success: false,
//         message:
//           "Worksheet not found"
//       });
//     }

//     const headerRow =
//       sheet.getRow(1);

//     const headers: string[] = [];

//     headerRow.eachCell(
//       (cell, colNumber) => {
//         headers[colNumber] = String(
//           cell.value ?? ""
//         )
//           .trim()
//           .toLowerCase();
//       }
//     );

//     const batchCol =
//       headers.findIndex(
//         x => x === "batch_name"
//       );

//     const dateCol =
//       headers.findIndex(
//         x => x === "date"
//       );

//     if (
//       batchCol === -1 ||
//       dateCol === -1
//     ) {
//       return NextResponse.json({
//         success: false,
//         message:
//           "Columns required: batch_name, date"
//       });
//     }

//     const logs: LogRow[] = [];

//     for (
//       let rowNumber = 2;
//       rowNumber <= sheet.rowCount;
//       rowNumber++
//     ) {
//       const row =
//         sheet.getRow(rowNumber);

//       const batchName = String(
//         row.getCell(batchCol)
//           .value ?? ""
//       ).trim();

//       if (!batchName) continue;

//       const startDate =
//         parseDate(
//           row.getCell(dateCol)
//             .value
//         );

//       const endDate =
//         parseDate(
//           row.getCell(dateCol)
//             .value
//         );

//       if (
//         !startDate ||
//         !endDate
//       ) {
//         logs.push({
//           row: rowNumber,
//           batch_name:
//             batchName,
//           status:
//             "Invalid Date"
//         });

//         continue;
//       }

//       const batch:
//         | batches
//         | null =
//         await prisma.batches.findFirst(
//           {
//             where: {
//               batch_name: batchName,
//               auto_update: 0
//             }
//           }
//         );

//       if (!batch) {
//         logs.push({
//           row: rowNumber,
//           batch_name:
//             batchName,
//           status:
//             "Batch Not Found"
//         });

//         continue;
//       }

//       await prisma.$transaction(
//         async (tx: Prisma.TransactionClient) => {
//           await tx.batches.update(
//             {
//               where: {
//                 id: batch.id
//               },
//               data: {
//                 assessment_start_datetime:
//                   replaceDateKeepTime(
//                     batch.assessment_start_datetime,
//                     startDate
//                   ),

//                 assessment_end_datetime:
//                   replaceDateKeepTime(
//                     batch.assessment_end_datetime,
//                     endDate
//                   ),

//                 assessor_assign_datetime:
//                   replaceDateKeepTime(
//                     batch.assessor_assign_datetime,
//                     startDate
//                   ),

//                 created_at:
//                   replaceDateKeepTime(
//                     batch.created_at,
//                     startDate
//                   ),

//                 updated_at:
//                   replaceDateKeepTime(
//                     batch.updated_at,
//                     startDate
//                   ),
//               }
//             }
//           );

//           const students =
//             await tx.students.findMany(
//               {
//                 where: {
//                   batch_id:
//                     batch.id
//                 },
//                 select: {
//                   id: true
//                 }
//               }
//             );

//           const studentIds =
//             students.map(
//               (x: any) => x.id
//             );

//           if (
//             studentIds.length >
//             0
//           ) {

//             await prisma.$executeRaw`
//               UPDATE students
//               SET
//                 created_at = CAST(
//                   DATE_ADD(DATE(${startDate}), INTERVAL TIME_TO_SEC(TIME(created_at)) SECOND)
//                   AS DATETIME
//                 ),
//                 updated_at = CAST(
//                   DATE_ADD(DATE(${startDate}), INTERVAL TIME_TO_SEC(TIME(updated_at)) SECOND)
//                   AS DATETIME
//                 )
//               WHERE batch_id = ${batch.id}
//             `

//             const examRows:
//               student_exam_set_results[] =
//               await tx.student_exam_set_results.findMany(
//                 {
//                   where: {
//                     student_id:
//                       {
//                         in: studentIds
//                       }
//                   }
//                 }
//               );

//             for (const item of examRows) {
//               await tx.student_exam_set_results.update(
//                 {
//                   where: {
//                     id: item.id
//                   },
//                   data: {
//                     exam_appear_date:
//                       replaceDateKeepTime(
//                         item.exam_appear_date,
//                         startDate
//                       ),
//                   }
//                 }
//               );
//             }

//             const resultRows:
//               exam_set_results[] =
//               await tx.exam_set_results.findMany(
//                 {
//                   where: {
//                     student_id:
//                       {
//                         in: studentIds
//                       }
//                   }
//                 }
//               );

//             for (const item of resultRows) {
//               await tx.exam_set_results.update(
//                 {
//                   where: {
//                     id: item.id
//                   },
//                   data: {
//                     created_at:
//                       replaceDateKeepTime(
//                         item.created_at,
//                         startDate
//                       ),
//                     updated_at:
//                       replaceDateKeepTime(
//                         item.updated_at,
//                         startDate
//                       ),
//                       attempt_time_data:
//                         updateAttemptTimeData(
//                           item.attempt_time_data,
//                           startDate
//                         )
//                   }
//                 }
//               );
//             }
//           }

//           const feedbackRows:
//             feedback_responses[] =
//             await tx.feedback_responses.findMany(
//               {
//                 where: {
//                   batch_id:
//                     batch.id
//                 }
//               }
//             );

//           for (const item of feedbackRows) {
//             await tx.feedback_responses.update(
//               {
//                 where: {
//                   id: item.id
//                 },
//                 data: {
//                   submitted_at:
//                     replaceDateKeepTime(
//                       item.submitted_at,
//                       startDate
//                     ),
//                   created_at:
//                     replaceDateKeepTime(
//                       item.created_at,
//                       startDate
//                     ),
//                   updated_at:
//                     replaceDateKeepTime(
//                       item.updated_at,
//                       startDate
//                     )
//                 }
//               }
//             );
//           }

//           const feedbackIds =
//             feedbackRows.map(
//               x => x.id
//             );

//           if (
//             feedbackIds.length >
//             0
//           ) {
//             const answerRows:
//               feedback_response_answers[] =
//               await tx.feedback_response_answers.findMany(
//                 {
//                   where: {
//                     feedback_response_id:
//                       {
//                         in: feedbackIds
//                       }
//                   }
//                 }
//               );

//             for (const item of answerRows) {
//               await tx.feedback_response_answers.update(
//                 {
//                   where: {
//                     id: item.id
//                   },
//                   data: {
//                     created_at:
//                       replaceDateKeepTime(
//                         item.created_at,
//                         startDate
//                       ),
//                     updated_at:
//                       replaceDateKeepTime(
//                         item.updated_at,
//                         startDate
//                       )
//                   }
//                 }
//               );
//             }
//           }

//           await tx.batches.update(
//             {
//               where: {
//                 id: batch.id
//               },
//               data: {
//                 auto_update: 1
//               }
//             }
//           );
//         },
//         {
//           timeout: 1000 * 60 * 5
//         }
//       );

//       logs.push({
//         row: rowNumber,
//         batch_name:
//           batchName,
//         status:
//           "Updated Successfully"
//       });
//     }

//     return NextResponse.json({
//       success: true,
//       total:
//         logs.length,
//       logs
//     });
//   } catch (error) {
//     console.error(error);

//     return NextResponse.json(
//       {
//         success: false,
//         message:
//           "Server Error"
//       },
//       { status: 500 }
//     );
//   }
// }


// app/api/batch-date-correction/route.ts

// import { NextResponse } from 'next/server'
// import path from 'path'
// import fs from 'fs/promises'
// import ExcelJS from 'exceljs'
// import prisma from '@/libs/prisma'
// import { Prisma } from '@prisma/client'

// const FILE_PATH = path.join(
//   process.cwd(),
//   'storage',
//   'uploads',
//   'corrections',
//   'batch-date-correction.xlsx'
// )

// type LogRow = {
//   row: number
//   batch_name: string
//   status: string
// }

// type ExcelRow = {
//   row: number
//   batch_name: string
//   date: Date
// }

// function parseDate(value: unknown): Date | null {
//   if (!value) return null

//   if (value instanceof Date) return value

//   const str = String(value).trim()

//   const parts = str.split(/[-/]/)

//   if (parts.length === 3) {
//     const [dd, mm, yyyy] = parts.map(Number)

//     if (!dd || !mm || !yyyy) return null

//     return new Date(yyyy, mm - 1, dd)
//   }

//   const d = new Date(str)

//   return isNaN(d.getTime()) ? null : d
// }

// function replaceDateKeepTime(
//   oldDate: Date | null,
//   newDate: Date
// ): Date {
//   const base = oldDate
//     ? new Date(oldDate)
//     : new Date()

//   base.setFullYear(newDate.getFullYear())
//   base.setMonth(newDate.getMonth())
//   base.setDate(newDate.getDate())

//   return base
// }

// function updateAttemptTimeData(
//   value: string | null,
//   newDate: Date
// ): string | null {
//   if (!value) return value

//   try {
//     const parsed = JSON.parse(value) as Array<
//       [number, string, string]
//     >

//     const updated = parsed.map(
//       ([flag, start, end]) => {
//         const startDt =
//           replaceDateKeepTime(
//             new Date(start),
//             newDate
//           )

//         const endDt =
//           replaceDateKeepTime(
//             new Date(end),
//             newDate
//           )

//         const pad = (
//           n: number
//         ) =>
//           String(n).padStart(
//             2,
//             '0'
//           )

//         const format = (
//           dt: Date
//         ) =>
//           `${dt.getFullYear()}-${pad(
//             dt.getMonth() + 1
//           )}-${pad(dt.getDate())} ${pad(
//             dt.getHours()
//           )}:${pad(
//             dt.getMinutes()
//           )}:${pad(
//             dt.getSeconds()
//           )}`

//         return [
//           flag,
//           format(startDt),
//           format(endDt)
//         ]
//       }
//     )

//     return JSON.stringify(
//       updated
//     )
//   } catch {
//     return value
//   }
// }

// async function processBatch(
//   item: ExcelRow
// ): Promise<LogRow> {
//   const {
//     row,
//     batch_name,
//     date
//   } = item

//   try {
//     const batch =
//       await prisma.batches.findFirst(
//         {
//           where: {
//             batch_name,
//             auto_update: 0
//           }
//         }
//       )

//     if (!batch) {
//       return {
//         row,
//         batch_name,
//         status:
//           'Batch Not Found / Already Updated'
//       }
//     }

//     await prisma.$transaction(
//       async (
//         tx: Prisma.TransactionClient
//       ) => {

//         // update batch
//         await tx.batches.update(
//           {
//             where: {
//               id: batch.id
//             },
//             data: {
//               assessment_start_datetime:
//                 replaceDateKeepTime(
//                   batch.assessment_start_datetime,
//                   date
//                 ),

//               assessment_end_datetime:
//                 replaceDateKeepTime(
//                   batch.assessment_end_datetime,
//                   date
//                 ),

//               assessor_assign_datetime:
//                 replaceDateKeepTime(
//                   batch.assessor_assign_datetime,
//                   date
//                 ),

//               created_at:
//                 replaceDateKeepTime(
//                   batch.created_at,
//                   date
//                 ),

//               updated_at:
//                 replaceDateKeepTime(
//                   batch.updated_at,
//                   date
//                 )
//             }
//           }
//         )

//         const students =
//           await tx.students.findMany(
//             {
//               where: {
//                 batch_id:
//                   batch.id
//               },
//               select: {
//                 id: true
//               }
//             }
//           )

//         const studentIds =
//           students.map(
//             x => x.id
//           )

//         if (
//           studentIds.length >
//           0
//         ) {

//           await tx.students.updateMany(
//             {
//               where: {
//                 id:
//                   {
//                     in: studentIds
//                   }
//               },
//               data: {
//                 created_at:
//                   replaceDateKeepTime(
//                   batch.updated_at,
//                   date
//                 ),
 //                 updated_at:
//                   date
//               }
//             }
//           )

//           // FAST BULK UPDATE
//           await tx.student_exam_set_results.updateMany(
//             {
//               where: {
//                 student_id:
//                   {
//                     in: studentIds
//                   }
//               },
//               data: {
//                 exam_appear_date:
//                   date
//               }
//             }
//           )

//           const resultRows =
//             await tx.exam_set_results.findMany(
//               {
//                 where: {
//                   student_id:
//                     {
//                       in: studentIds
//                     }
//                 }
//               }
//             )

//           // only loop JSON rows
//           await Promise.all(
//             resultRows.map(
//               item =>
//                 tx.exam_set_results.update(
//                   {
//                     where: {
//                       id: item.id
//                     },
//                     data: {
//                       created_at:
//                         replaceDateKeepTime(
//                           item.created_at,
//                           date
//                         ),
//                       updated_at:
//                         replaceDateKeepTime(
//                           item.updated_at,
//                           date
//                         ),
//                       attempt_time_data:
//                         updateAttemptTimeData(
//                           item.attempt_time_data,
//                           date
//                         ) ?? item.attempt_time_data
//                     }
//                   }
//                 )
//             )
//           )
//         }

//         const feedbackRows =
//           await tx.feedback_responses.findMany(
//             {
//               where: {
//                 batch_id:
//                   batch.id
//               },
//               select: {
//                 id: true,
//                 submitted_at:
//                   true,
//                 created_at:
//                   true,
//                 updated_at:
//                   true
//               }
//             }
//           )

//         await Promise.all(
//           feedbackRows.map(
//             item =>
//               tx.feedback_responses.update(
//                 {
//                   where: {
//                     id: item.id
//                   },
//                   data: {
//                     submitted_at:
//                       replaceDateKeepTime(
//                         item.submitted_at,
//                         date
//                       ),
//                     created_at:
//                       replaceDateKeepTime(
//                         item.created_at,
//                         date
//                       ),
//                     updated_at:
//                       replaceDateKeepTime(
//                         item.updated_at,
//                         date
//                       )
//                   }
//                 }
//               )
//           )
//         )

//         const feedbackIds =
//           feedbackRows.map(
//             x => x.id
//           )

//         if (
//           feedbackIds.length >
//           0
//         ) {
//           const answers =
//             await tx.feedback_response_answers.findMany(
//               {
//                 where: {
//                   feedback_response_id:
//                     {
//                       in: feedbackIds
//                     }
//                 },
//                 select: {
//                   id: true,
//                   created_at:
//                     true,
//                   updated_at:
//                     true
//                 }
//               }
//             )

//           await Promise.all(
//             answers.map(
//               item =>
//                 tx.feedback_response_answers.update(
//                   {
//                     where: {
//                       id: item.id
//                     },
//                     data: {
//                       created_at:
//                         replaceDateKeepTime(
//                           item.created_at,
//                           date
//                         ),
//                       updated_at:
//                         replaceDateKeepTime(
//                           item.updated_at,
//                           date
//                         )
//                     }
//                   }
//                 )
//             )
//           )
//         }

//         await tx.batches.update(
//           {
//             where: {
//               id: batch.id
//             },
//             data: {
//               auto_update: 1
//             }
//           }
//         )
//       },
//       {
//         timeout:
//           1000 * 60 * 5
//       }
//     )

//     return {
//       row,
//       batch_name,
//       status:
//         'Updated Successfully'
//     }
//   } catch (
//     error: any
//   ) {
//     return {
//       row,
//       batch_name,
//       status:
//         'Failed : ' +
//         error.message
//     }
//   }
// }

// async function runInChunks(
//   rows: ExcelRow[],
//   chunkSize = 5
// ) {
//   const logs: LogRow[] = []

//   for (
//     let i = 0;
//     i < rows.length;
//     i += chunkSize
//   ) {
//     const chunk =
//       rows.slice(
//         i,
//         i + chunkSize
//       )

//     const result =
//       await Promise.all(
//         chunk.map(
//           processBatch
//         )
//       )

//     logs.push(...result)
//   }

//   return logs
// }

// export async function GET() {
//   try {
//     try {
//       await fs.access(
//         FILE_PATH
//       )
//     } catch {
//       return NextResponse.json(
//         {
//           success: false,
//           message:
//             'Excel file not found'
//         }
//       )
//     }

//     const workbook =
//       new ExcelJS.Workbook()

//     await workbook.xlsx.readFile(
//       FILE_PATH
//     )

//     const sheet =
//       workbook
//         .worksheets[0]

//     if (!sheet) {
//       return NextResponse.json(
//         {
//           success: false,
//           message:
//             'Sheet not found'
//         }
//       )
//     }

//     const headerRow =
//       sheet.getRow(1)

//     const headers: string[] =
//       []

//     headerRow.eachCell(
//       (
//         cell,
//         colNumber
//       ) => {
//         headers[
//           colNumber
//         ] = String(
//           cell.value ??
//             ''
//         )
//           .trim()
//           .toLowerCase()
//       }
//     )

//     const batchCol =
//       headers.findIndex(
//         x =>
//           x ===
//           'batch_name'
//       )

//     const dateCol =
//       headers.findIndex(
//         x =>
//           x ===
//           'date'
//       )

//     if (
//       batchCol ===
//         -1 ||
//       dateCol === -1
//     ) {
//       return NextResponse.json(
//         {
//           success: false,
//           message:
//             'Columns required: batch_name, date'
//         }
//       )
//     }

//     const rows: ExcelRow[] =
//       []
//     const logs: LogRow[] =
//       []

//     for (
//       let rowNumber = 2;
//       rowNumber <=
//       sheet.rowCount;
//       rowNumber++
//     ) {
//       const row =
//         sheet.getRow(
//           rowNumber
//         )

//       const batch_name =
//         String(
//           row.getCell(
//             batchCol
//           ).value ??
//             ''
//         ).trim()

//       if (!batch_name)
//         continue

//       const date =
//         parseDate(
//           row.getCell(
//             dateCol
//           ).value
//         )

//       if (!date) {
//         logs.push({
//           row: rowNumber,
//           batch_name,
//           status:
//             'Invalid Date'
//         })

//         continue
//       }

//       rows.push({
//         row: rowNumber,
//         batch_name,
//         date
//       })
//     }

//     const processed =
//       await runInChunks(
//         rows,
//         5
//       )

//     logs.push(
//       ...processed
//     )

//     return NextResponse.json(
//       {
//         success: true,
//         total:
//           logs.length,
//         logs
//       }
//     )
//   } catch (
//     error
//   ) {
//     console.error(
//       error
//     )

//     return NextResponse.json(
//       {
//         success: false,
//         message:
//           'Server Error'
//       },
//       {
//         status: 500
//       }
//     )
//   }
// }



// app/api/batch-date-correction/route.ts

// import { NextResponse } from 'next/server'
// import path from 'path'
// import fs from 'fs/promises'
// import ExcelJS from 'exceljs'
// import prisma from '@/libs/prisma'
// import { Prisma } from '@prisma/client'

// const FILE_PATH = path.join(
//   process.cwd(),
//   'storage',
//   'uploads',
//   'corrections',
//   'batch-date-correction.xlsx'
// )

// type LogRow = {
//   row: number
//   batch_name: string
//   status: string
// }

// type ExcelRow = {
//   row: number
//   batch_name: string
//   date: Date
// }

// /* ---------------- DATE PARSER ---------------- */

// function parseDate(value: unknown): Date | null {
//   if (!value) return null
//   if (value instanceof Date) return value

//   const str = String(value).trim()
//   const parts = str.split(/[-/]/)

//   if (parts.length === 3) {
//     const [dd, mm, yyyy] = parts.map(Number)
//     if (!dd || !mm || !yyyy) return null
//     return new Date(yyyy, mm - 1, dd)
//   }

//   const d = new Date(str)
//   return isNaN(d.getTime()) ? null : d
// }

// /* ---------------- MAIN API ---------------- */

// export async function GET() {
//   try {
//     await fs.access(FILE_PATH)

//     const workbook = new ExcelJS.Workbook()
//     await workbook.xlsx.readFile(FILE_PATH)

//     const sheet = workbook.worksheets[0]
//     if (!sheet) {
//       return NextResponse.json({
//         success: false,
//         message: 'Sheet not found'
//       })
//     }

//     /* ---------------- READ EXCEL ---------------- */

//     const headerRow = sheet.getRow(1)
//     const headers: string[] = []

//     headerRow.eachCell((cell, i) => {
//       headers[i] = String(cell.value ?? '')
//         .trim()
//         .toLowerCase()
//     })

//     const batchCol = headers.findIndex(h => h === 'batch_name')
//     const dateCol = headers.findIndex(h => h === 'date')

//     if (batchCol === -1 || dateCol === -1) {
//       return NextResponse.json({
//         success: false,
//         message: 'batch_name and date columns required'
//       })
//     }

//     const rows: ExcelRow[] = []
//     const logs: LogRow[] = []

//     for (let i = 2; i <= sheet.rowCount; i++) {
//       const row = sheet.getRow(i)

//       const batch_name = String(row.getCell(batchCol).value ?? '').trim()
//       const date = parseDate(row.getCell(dateCol).value)

//       if (!batch_name) continue

//       if (!date) {
//         logs.push({
//           row: i,
//           batch_name,
//           status: 'Invalid Date'
//         })
//         continue
//       }

//       rows.push({ row: i, batch_name, date })
//     }

//     /* ---------------- GROUP BY DATE (IMPORTANT OPTIMIZATION) ---------------- */

//     const grouped = new Map<string, ExcelRow[]>()

//     for (const r of rows) {
//       const key = r.date.toISOString().split('T')[0]
//       if (!grouped.has(key)) grouped.set(key, [])
//       grouped.get(key)!.push(r)
//     }

//     /* ---------------- PROCESS EACH DATE GROUP ---------------- */

//     for (const [dateKey, group] of grouped) {
//       const date = new Date(dateKey)

//       const batchNames = group.map(g => g.batch_name)

//       // 1. Fetch all batches in ONE query
//       const batches = await prisma.batches.findMany({
//         where: {
//           batch_name: { in: batchNames },
//           auto_update: 0
//         },
//         select: { id: true, batch_name: true }
//       })

//       const batchIds = batches.map(b => b.id)

//       if (batchIds.length === 0) continue

//       // 2. Update batches (bulk)
//       await prisma.batches.updateMany({
//         where: {
//           id: { in: batchIds }
//         },
//         data: {
//           auto_update: 1
//         }
//       })

//       /* ---------------- STUDENTS ---------------- */

//       const students = await prisma.students.findMany({
//         where: { batch_id: { in: batchIds } },
//         select: { id: true }
//       })

//       const studentIds = students.map(s => s.id)

//       if (studentIds.length > 0) {

//         // bulk update student created_at and updated_at
//         // await prisma.students.updateMany({
//         //   where: {
//         //     id: { in: studentIds }
//         //   },
//         //   data: {
//         //     created_at: date,
//         //     updated_at: date
//         //   }
//         // })

//         await prisma.$executeRaw`
//           UPDATE students
//           SET created_at = DATE_ADD(DATE(${date}), INTERVAL TIME_TO_SEC(TIME(created_at)) SECOND),
//               updated_at = DATE_ADD(DATE(${date}), INTERVAL TIME_TO_SEC(TIME(updated_at)) SECOND)
//           WHERE id IN (${Prisma.join(studentIds)})
//         `

//         // 3. bulk update exam appear date
//         // await prisma.student_exam_set_results.updateMany({
//         //   where: {
//         //     student_id: { in: studentIds }
//         //   },
//         //   data: {
//         //     exam_appear_date: date
//         //   }
//         // })

//         await prisma.$executeRaw`
//           UPDATE student_exam_set_results
//           SET exam_appear_date = DATE_ADD(DATE(${date}), INTERVAL TIME_TO_SEC(TIME(exam_appear_date)) SECOND)
//           WHERE student_id IN (${Prisma.join(studentIds)})
//         `

//         // 4. RAW SQL for exam_set_results (FASTEST PART)
//         await prisma.$executeRaw`
//           UPDATE exam_set_results
//           SET
//             created_at = DATE_ADD(DATE(${date}), INTERVAL TIME_TO_SEC(TIME(created_at)) SECOND),
//             updated_at = DATE_ADD(DATE(${date}), INTERVAL TIME_TO_SEC(TIME(updated_at)) SECOND)
//           WHERE student_id IN (${Prisma.join(studentIds)})
//         `

//         // OPTIONAL: JSON update placeholder (fast no-op or DB-side handling)
//         await prisma.$executeRaw`
//           UPDATE exam_set_results e
//           JOIN (
//             SELECT
//               id,
//               JSON_ARRAYAGG(
//                 JSON_ARRAY(
//                   jt.flag,
//                   DATE_ADD(DATE(${date}), INTERVAL TIME_TO_SEC(TIME(jt.start)) SECOND),
//                   DATE_ADD(DATE(${date}), INTERVAL TIME_TO_SEC(TIME(jt.end)) SECOND)
//                 )
//               ) AS new_json
//             FROM exam_set_results e2
//             JOIN JSON_TABLE(e2.attempt_time_data, '$[*]'
//               COLUMNS (
//                 flag INT PATH '$[0]',
//                 start DATETIME PATH '$[1]',
//                 end DATETIME PATH '$[2]'
//               )
//             ) jt
//             WHERE e2.student_id IN (${Prisma.join(studentIds)})
//             GROUP BY e2.id
//           ) x ON x.id = e.id
//           SET e.attempt_time_data = x.new_json,
//               e.created_at = DATE_ADD(DATE(${date}), INTERVAL TIME_TO_SEC(TIME(e.created_at)) SECOND),
//               e.updated_at = DATE_ADD(DATE(${date}), INTERVAL TIME_TO_SEC(TIME(e.updated_at)) SECOND)
//         `
//       }

//       /* ---------------- FEEDBACK ---------------- */

//       const feedbacks = await prisma.feedback_responses.findMany({
//         where: { batch_id: { in: batchIds } },
//         select: { id: true }
//       })

//       const feedbackIds = feedbacks.map(f => f.id)

//       if (feedbackIds.length > 0) {
//         // 5. bulk update feedback responses
//         await prisma.$executeRaw`
//           UPDATE feedback_responses
//           SET
//             submitted_at = DATE_ADD(DATE(${date}), INTERVAL TIME_TO_SEC(TIME(submitted_at)) SECOND),
//             created_at = DATE_ADD(DATE(${date}), INTERVAL TIME_TO_SEC(TIME(created_at)) SECOND),
//             updated_at = DATE_ADD(DATE(${date}), INTERVAL TIME_TO_SEC(TIME(updated_at)) SECOND)
//           WHERE batch_id IN (${Prisma.join(batchIds)})
//         `

//         // 6. child answers update (JOIN = FASTEST)
//         await prisma.$executeRaw`
//           UPDATE feedback_response_answers f
//           INNER JOIN feedback_responses r
//             ON f.feedback_response_id = r.id
//           SET
//             f.created_at = DATE_ADD(DATE(${date}), INTERVAL TIME_TO_SEC(TIME(f.created_at)) SECOND),
//             f.updated_at = DATE_ADD(DATE(${date}), INTERVAL TIME_TO_SEC(TIME(f.updated_at)) SECOND)
//           WHERE r.batch_id IN (${Prisma.join(batchIds)})
//         `
//       }

//       /* ---------------- LOGS ---------------- */

//       group.forEach(g => {
//         logs.push({
//           row: g.row,
//           batch_name: g.batch_name,
//           status: 'Updated Successfully'
//         })
//       })
//     }

//     return NextResponse.json({
//       success: true,
//       total: logs.length,
//       logs
//     })
//   } catch (error) {
//     console.error(error)

//     return NextResponse.json(
//       {
//         success: false,
//         message: 'Server Error'
//       },
//       { status: 500 }
//     )
//   }
// }
