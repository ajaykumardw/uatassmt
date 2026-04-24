import fs from "fs/promises";

import { NextResponse } from "next/server";

import { verify } from "jsonwebtoken";

import sharp from "sharp";

import { format } from "date-fns";

import jsPDF from "jspdf";
import autoTable, { type Color, type HAlignType } from "jspdf-autotable";

import prisma from "@/libs/prisma";

import { decrypt } from "@/utils/encryption";

import { getAgencyImagePath, getAgencyUsersFilePath, getSSCImagePath } from "@/configs/customDataConfig";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const batchId = params.id;

  const authHeader = request.headers.get("Authorization");

  const token = authHeader?.split(" ")[1];

  if (!token) {
    return NextResponse.json({
      status: "error",
      statusCode: 401,
      message: "Unauthorized"
    }, { status: 401 });
  }


  try {

    const decoded = verify(token, process.env.NEXTAUTH_SECRET as string) as any;

    if (decoded.user_type !== "U" || decoded.role_id !== 1) {
      return NextResponse.json({
        status: "error",
        statusCode: 403,
        message: "Forbidden: Insufficient permissions"
      }, { status: 403 });
    }

    const batch = await prisma.batches.findUnique({
      where: {
        id: Number(batchId),
        assessor_id: decoded.id
      },
      include: {
        agency: {
          select: {
            id: true,
            company_name: true,
            avatar: true
          }
        },
        qualification_pack: {
          select: {
            qualification_pack_name: true,
            qualification_pack_id: true,
            nsqf_level: true,
            ssc: {
              select: {
                id: true,
                ssc_name: true,
                ssc_image: true,
              }
            }
          }
        },
        students: {
          select: {
            candidate_id: true,
            candidate_name: true,
            father_name: true,
            aadhaar_no: true,
            attendance: true
          },
          orderBy: {
            candidate_name: "asc"
          }
        },
        training_partner: {
          select: {
            id: true,
            company_name: true,
            address: true,
            avatar: true
          }
        },
        training_center: {
          select: {
            address: true
          }
        },
        scheme: {
          select: {
            scheme_name: true,
            scheme_code: true
          }
        },
        sub_scheme: {
          select: {
            scheme_name: true,
            scheme_code: true
          }
        }
      }
    });

    if (!batch) {
      return NextResponse.json({
        status: "error",
        statusCode: 404,
        message: "Batch not found"
      }, { status: 404 });
    }

    const formattedBatch = batch.students.map((s: any) => ({
      ...s,
      aadhaar_no: s.aadhaar_no ? decrypt(s.aadhaar_no) : ""
    }));

    const sscImage = batch.qualification_pack?.ssc?.ssc_image ? getSSCImagePath(batch?.qualification_pack?.ssc?.id, batch.qualification_pack.ssc.ssc_image) : null;
    const agencyImage = batch.agency?.avatar ? getAgencyImagePath(batch.agency.id, batch.agency.avatar) : null;
    const tpImage = batch.training_partner?.avatar ? getAgencyUsersFilePath(batch.training_partner?.id, batch.training_partner?.avatar) : null;

    const file = await generateAttendancePdf({ ...batch, students: formattedBatch, sscImage: sscImage, agencyImage: agencyImage, tpImage: tpImage });

    return new Response(file, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=${batch.batch_name}_assessment_attendance_sheet.pdf`
      }
    });

  } catch (error: any) {

    console.error(error);

    if (error.name === 'TokenExpiredError') {
      return NextResponse.json({
        status: 'Error',
        statusCode: 401,
        message: 'Token expired',
        error: error
      }, { status: 401 });
    }

    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({
        status: 'Error',
        statusCode: 401,
        message: 'Invalid token',
        error: error
      }, { status: 401 });
    }

    return NextResponse.json({
      status: "error",
      statusCode: 500,
      message: "Internal Server Error",
      error: error.message
    }, { status: 500 });
  }
}

const fileToUint8Array = async (filePath: string) => {
  try {
    const input = await fs.readFile(filePath);

    const output = await sharp(input)
      .resize({
        width: 200, // enough for PDF logos
        withoutEnlargement: true
      })
      .flatten({ background: "#ffffff" })
      .jpeg({
        quality: 70,
        mozjpeg: true
      })
      .toBuffer();

    return output;
  } catch (error) {
    console.error("Image optimize error:", error);

    return null;
  }
};

const generateAttendancePdf = async (batch: any) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // const agencyLogo = batch.agencyImage ? await fileToBase64(batch.agencyImage) : null;
  // const tpLogo = batch.tpImage ? await fileToBase64(batch.tpImage) : null;
  // const sscLogo = batch.sscImage ? await fileToBase64(batch.sscImage) : null;

  const [agencyLogo, tpLogo, sscLogo] = await Promise.all([
    batch?.agencyImage ? fileToUint8Array(batch.agencyImage) : null,
    batch?.tpImage ? fileToUint8Array(batch.tpImage) : null,
    batch?.sscImage ? fileToUint8Array(batch.sscImage) : null
  ]);

  const pageWidth = doc.internal.pageSize.getWidth();

  const left = 5;
  const right = 5;

  const colWidths = [13, 29, 33, 52, 43, 30];

  const textColor: Color = [0, 0, 0];
  const fillColor: Color = process.env.NEXT_PUBLIC_PRIMARY_COLOR || [58, 45, 86];
  const lineColor: Color = [0, 0, 0];
  const halign: HAlignType = "center";

  const styles = {
    halign: halign,
    textColor: textColor,
  }

  const students = batch.students || [];

  /*
  -------------------------------------------------------
  STUDENT ROWS
  -------------------------------------------------------
  */
  const rows = students.map((s: any, i: number) => [
    {
      content: i + 1,
      styles: { ...styles }
    },
    {
      content: s?.candidate_id || "",
      styles: { ...styles }
    },
    {
      content: s?.candidate_name || "",
      styles: { ...styles }
    },
    {
      content: s?.father_name || "",
      styles: { ...styles }
    },
    {
      content: s?.aadhaar_no || "",
      styles: { ...styles }
    },
    {
      content: "",
      styles: { ...styles }
    }
  ]);

  // while (rows.length < 60) {
  //   rows.push([rows.length + 1, "", "", "", "", ""]);
  // }

  const drawTitle = () => {
    const topY = 6;

    const imageSize = { width: 22, height: 14 };

    // Left Logo
    // doc.addImage(leftLogo, "PNG", 5, topY, 22, 14);

    if (tpLogo) {
      doc.addImage(tpLogo, "JPEG", 5, topY, imageSize.width, 0);
    }

    if (sscLogo) {
      doc.addImage(sscLogo, "JPEG", imageSize.width + 5, topY, imageSize.width, 0);
    }

    // Right Logo
    // doc.addImage(rightLogo, "PNG", 183, topY, 22, 14);

    if (agencyLogo) {
      doc.addImage(agencyLogo, "JPEG", 183, topY, imageSize.width, 0);
    }

    // // Placeholder Box (remove after real logo)
    // doc.rect(5, topY, 22, 14);
    // doc.rect(183, topY, 22, 14);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);

    doc.text(
      batch?.agency?.company_name || "",
      pageWidth / 2,
      11,
      { align: "center" }
    );

    doc.setFontSize(10);

    doc.text(
      "ASSESSMENT ATTENDANCE SHEET",
      pageWidth / 2,
      17,
      { align: "center" }
    );
  };

  drawTitle();


  // let startY = 20;
  const startY = 20;


  /*
  =======================================================
  1. HEADER TABLE
  =======================================================
  */
  autoTable(doc, {
    startY: startY + 2,
    margin: { left, right },
    theme: "grid",

    styles: {
      fontSize: 7,
      cellPadding: 1.2,
      lineWidth: 0.2,
      lineColor: lineColor,
      valign: "middle"
    },

    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 25 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 },
      6: { cellWidth: 25 },
      7: { cellWidth: 25 }
    },

    body: [
      // [
      //   {
      //     content: "LOGO (PIA/TP/SSC)",
      //     rowSpan: 2,
      //     styles: {
      //       halign: "center",
      //       fontStyle: "bold",
      //       minCellHeight: 12
      //     }
      //   },
      //   {
      //     content:
      //       "Vistaskills Private Limited\nASSESSMENT ATTENDANCE SHEET",
      //     colSpan: 4,
      //     styles: {
      //       halign: "center",
      //       fontStyle: "bold",
      //       fontSize: 8,
      //       minCellHeight: 12
      //     }
      //   },
      //   {
      //     content: "LOGO (Assessment Agency)",
      //     rowSpan: 2,
      //     styles: {
      //       halign: "center",
      //       fontStyle: "bold",
      //       minCellHeight: 12
      //     }
      //   }
      // ],
      // [],

      [
        {
          content: "Batch Id",
          colSpan: 2,

          // styles: { halign: "center", fontStyle: "bold", textColor: [0,0,0] }

          styles: { ...styles, fontStyle: "bold" }
        },
        {
          content: String(batch.batch_name || ""),
          colSpan: 3,
          styles: { ...styles, fontStyle: "bold" }
        },
        {
          content: "Date",
          styles: { ...styles, fontStyle: "bold" }
        },
        {
          content: (format(new Date(), "dd-MM-yyyy") || ""),
          colSpan: 2,
          styles: { ...styles, fontStyle: "bold" }
        }
      ],

      [
        {
          content: "Training Partner",
          colSpan: 2,
          styles: { ...styles, fontStyle: "bold" }
        },
        {
          content: batch.training_partner?.company_name || "",
          colSpan: 6,
          styles: { ...styles, fontStyle: "bold" }
        }
      ],

      [
        {
          content: "Job Role/QP Code",
          colSpan: 2,
          styles: { ...styles, fontStyle: "bold" }
        },
        {
          content: (`${batch.qualification_pack?.qualification_pack_name}${batch.qualification_pack?.qualification_pack_id ? "/" + batch?.qualification_pack?.qualification_pack_id : ""}`) || "",
          colSpan: 4,
          styles: { ...styles, fontStyle: "bold" }
        },
        {
          content: "Level",
          styles: { ...styles, fontStyle: "bold" }
        },
        {
          content: batch.qualification_pack?.nsqf_level || "",
          styles: { ...styles, fontStyle: "bold" }
        }
      ],

      [
        {
          content: "TC Address",
          colSpan: 2,
          styles: { ...styles, fontStyle: "bold" }
        },
        {
          content: batch?.training_center?.address || "",
          colSpan: 6,
          styles: { ...styles, fontStyle: "bold" }
        }
      ],

      [
        {
          content: "Scheme Name",
          colSpan: 2,
          styles: { ...styles, fontStyle: "bold" }
        },
        {
          content: batch?.scheme?.scheme_name || "",
          colSpan: 2,
          styles: { ...styles, fontStyle: "bold" }
        },
        {
          content: "Sub Scheme",
          colSpan: 2,
          styles: { ...styles, fontStyle: "bold" }
        },
        {
          content: batch?.sub_scheme?.scheme_name || "",
          colSpan: 2,
          styles: { ...styles, fontStyle: "bold" }
        }
      ],

      [
        {
          content: "Total Count",
          styles: { ...styles, fontStyle: "bold" }
        },
        {
          content: students?.length || "",
          styles: { ...styles, halign: "center", fontStyle: "bold" }
        },
        {
          content: "Present Count",
          styles: { ...styles, halign: "center", fontStyle: "bold" }
        },
        {
          content: "",
          styles: { ...styles, halign: "center", fontStyle: "bold" }
        },
        {
          content: "Absent Count",
          styles: { ...styles, halign: "center", fontStyle: "bold" }
        },
        {
          content: "",
          styles: { ...styles, halign: "center", fontStyle: "bold" }
        },
        {
          content: "Dropout Count",
          styles: { ...styles, halign: "center", fontStyle: "bold" }
        },
        {
          content: "",
          styles: { ...styles, halign: "center", fontStyle: "bold" }
        }
      ],

      [
        {
          content: "",
          colSpan: 8,
          styles: {
            fillColor: fillColor,
            minCellHeight: 4
          }
        }
      ]
    ]
  });

  /*
  =======================================================
  2. STUDENT TABLE
  =======================================================
  */
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY,
    margin: { left, right },
    theme: "grid",

    styles: {
      fontSize: 7,
      cellPadding: 1.2,
      lineWidth: 0.2,
      lineColor: [0, 0, 0],
      valign: "middle"
    },

    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold"
    },

    showHead: "everyPage",

    columnStyles: {
      0: { cellWidth: colWidths[0], halign: "center" },
      1: { cellWidth: colWidths[1] },
      2: { cellWidth: colWidths[2] },
      3: { cellWidth: colWidths[3] },
      4: { cellWidth: colWidths[4] },
      5: { cellWidth: colWidths[5] }
    },

    head: [
      [
        {
          content: "S. No.",
          styles: { halign: "center" }
        },
        {
          content: "Candidate's ID",
          styles: { halign: "center" }
        },
        {
          content: "Candidate's Name",
          styles: { halign: "center" }
        },
        {
          content: "Father's Name",
          styles: { halign: "center" }
        },
        {
          content: "Aadhar No.",
          styles: { halign: "center" }
        },
        {
          content: "Candidate's Signature",
          styles: { halign: "center" }
        }
      ]
    ],

    body: rows,

    didDrawPage: () => {
      doc.setFontSize(7);

      doc.text(
        `Page ${doc.getCurrentPageInfo().pageNumber}`,
        pageWidth - 18,
        292
      );
    }
  });

  /*
  =======================================================
  3. FOOTER TABLE
  =======================================================
  */
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY,
    margin: { left, right },
    theme: "grid",

    styles: {
      fontSize: 7,
      cellPadding: 1.2,
      lineWidth: 0.2,
      lineColor: [0, 0, 0],
      valign: "middle"
    },

    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 50 },
      2: { cellWidth: 50 },
      3: { cellWidth: 50 }
    },

    body: [
      [
        {
          content: "",
          colSpan: 4,
          styles: {
            fillColor: fillColor,
            minCellHeight: 4
          }
        }
      ],

      [
        {
          content: "Assessor Name",
          styles: { ...styles, fontStyle: "bold" }
        },
        {
          content: "",
          styles: { ...styles, fontStyle: "bold" }
        },
        {
          content: "Center SPOC Name",
          styles: { ...styles, fontStyle: "bold" }
        },
        {
          content: "",
          styles: { ...styles, fontStyle: "bold" }
        }
      ],

      [
        {
          content: "Assessor ID",
          styles: { ...styles, halign: "center", fontStyle: "bold" }
        },
        {
          content: "",
          styles: { ...styles, halign: "center", fontStyle: "bold" }
        },
        {
          content: "SPOC Email ID",
          styles: { ...styles, halign: "center", fontStyle: "bold" }
        },
        {
          content: "",
          styles: { ...styles, halign: "center", fontStyle: "bold" }
        }
      ],

      [
        {
          content: "Assessor Contact No",
          styles: { ...styles, halign: "center", fontStyle: "bold" }
        },
        {
          content: "",
          styles: { ...styles, halign: "center", fontStyle: "bold" }
        },
        {
          content: "SPOC Contact No",
          styles: { ...styles, halign: "center", fontStyle: "bold" }
        },
        {
          content: "",
          styles: { ...styles, halign: "center", fontStyle: "bold" }
        }
      ],

      [
        {
          content: "Assessor Signature",
          styles: { ...styles, fontStyle: "bold", minCellHeight: 10 }
        },
        {
          content: "",
          styles: { ...styles, fontStyle: "bold", minCellHeight: 10 }
        },
        {
          content: "SPOC Signature & Stamp",
          styles: { ...styles, fontStyle: "bold", minCellHeight: 10 }
        },
        {
          content: "",
          styles: { ...styles, fontStyle: "bold", minCellHeight: 10 }
        }
      ]
    ]
  });

  /*
  =======================================================
  OUTPUT
  =======================================================
  */
  const buffer = doc.output("arraybuffer");

  return Buffer.from(buffer);
};

//

// export const generateAttendancePdf = async (batch: any) => {
//   const doc = new jsPDF({
//     orientation: "portrait",
//     unit: "mm",
//     format: "a4"
//   });

//   const pageWidth = doc.internal.pageSize.getWidth();

//   /*
//   -------------------------------------------------------
//   PAGE SETTINGS
//   -------------------------------------------------------
//   */
//   const left = 5;
//   const right = 5;

//   /*
//   -------------------------------------------------------
//   COLUMN WIDTHS
//   -------------------------------------------------------
//   */
//   const colWidths = [13, 21, 33, 52, 43, 38];

//   /*
//   -------------------------------------------------------
//   STUDENTS DATA
//   -------------------------------------------------------
//   */
//   const students = batch.students || [];

//   const rows: any[] = students.map((s: any, i: number) => [
//     i + 1,
//     s?.candidate_id || "",
//     s?.candidate_name || "",
//     s?.father_name || "",
//     s?.aadhaar_no || "",
//     ""
//   ]);

//   /*
//   minimum 30 rows
//   */
//   while (rows.length < 30) {
//     rows.push([
//       rows.length + 1,
//       "",
//       "",
//       "",
//       "",
//       ""
//     ]);
//   }

//   /*
//   -------------------------------------------------------
//   TABLE BODY
//   -------------------------------------------------------
//   */
//   const body: any[] = [
//     /*
//     HEADER
//     */
//     [
//       {
//         content: "LOGO (PIA/TP/SSC)",
//         rowSpan: 2,
//         styles: {
//           halign: "center",
//           valign: "middle",
//           fontStyle: "bold",
//           minCellHeight: 12
//         }
//       },
//       {
//         content:
//           "Vistaskills Private Limited\nASSESSMENT ATTENDANCE SHEET",
//         colSpan: 4,
//         styles: {
//           halign: "center",
//           valign: "middle",
//           fontStyle: "bold",
//           fontSize: 8,
//           minCellHeight: 12
//         }
//       },
//       {
//         content: "LOGO (Assessment Agency)",
//         rowSpan: 2,
//         styles: {
//           halign: "center",
//           valign: "middle",
//           fontStyle: "bold",
//           minCellHeight: 12
//         }
//       }
//     ],
//     [],

//     /*
//     DETAILS
//     */
//     [
//       {
//         content: "Batch Id",
//         colSpan: 2,
//         styles: { fontStyle: "bold", halign: "center" }
//       },
//       {
//         content: String(batch.id || ""),
//         colSpan: 3
//       },
//       {
//         content: "Date",
//         styles: { fontStyle: "bold", halign: "center" }
//       }
//     ],

//     [
//       {
//         content:
//           "Training Partner  " +
//           (batch.training_partner_name || ""),
//         colSpan: 6,
//         styles: { fontStyle: "bold" }
//       }
//     ],

//     [
//       {
//         content: "Job Role/QP Code",
//         colSpan: 2,
//         styles: {
//           fontStyle: "bold",
//           halign: "center"
//         }
//       },
//       {
//         content:
//           batch.qualification_pack?.qp_name || "",
//         colSpan: 3
//       },
//       {
//         content: "Level",
//         styles: {
//           fontStyle: "bold",
//           halign: "center"
//         }
//       }
//     ],

//     [
//       {
//         content:
//           "TC Address  " +
//           (batch.address || ""),
//         colSpan: 6,
//         styles: { fontStyle: "bold" }
//       }
//     ],

//     [
//       {
//         content: "Scheme Name",
//         colSpan: 3,
//         styles: {
//           fontStyle: "bold",
//           halign: "center"
//         }
//       },
//       {
//         content: "Sub Scheme",
//         colSpan: 3,
//         styles: {
//           fontStyle: "bold",
//           halign: "center"
//         }
//       }
//     ],

//     [
//       {
//         content:
//           "Total Count " + students.length,
//         colSpan: 2,
//         styles: {
//           fontStyle: "bold",
//           halign: "center"
//         }
//       },
//       {
//         content: "Present Count",
//         styles: {
//           fontStyle: "bold",
//           halign: "center"
//         }
//       },
//       {
//         content: "Absent Count",
//         colSpan: 2,
//         styles: {
//           fontStyle: "bold",
//           halign: "center"
//         }
//       },
//       {
//         content: "Dropout Count",
//         styles: {
//           fontStyle: "bold",
//           halign: "center"
//         }
//       }
//     ],

//     /*
//     PURPLE BAR
//     */
//     [
//       {
//         content: "",
//         colSpan: 6,
//         styles: {
//           fillColor: [58, 45, 86],
//           minCellHeight: 4
//         }
//       }
//     ],

//     /*
//     STUDENT HEADER
//     */
//     [
//       {
//         content: "S.\nNo.",
//         styles: {
//           fontStyle: "bold",
//           halign: "center"
//         }
//       },
//       {
//         content: "Candidate's ID",
//         styles: {
//           fontStyle: "bold",
//           halign: "center"
//         }
//       },
//       {
//         content: "Candidate's Name",
//         styles: {
//           fontStyle: "bold",
//           halign: "center"
//         }
//       },
//       {
//         content: "Father's Name",
//         styles: {
//           fontStyle: "bold",
//           halign: "center"
//         }
//       },
//       {
//         content: "Aadhar No.",
//         styles: {
//           fontStyle: "bold",
//           halign: "center"
//         }
//       },
//       {
//         content: "Candidate's\nSignature",
//         styles: {
//           fontStyle: "bold",
//           halign: "center"
//         }
//       }
//     ],

//     /*
//     STUDENT ROWS
//     */
//     ...rows,

//     /*
//     FOOTER PURPLE BAR
//     */
//     [
//       {
//         content: "",
//         colSpan: 6,
//         styles: {
//           fillColor: [58, 45, 86],
//           minCellHeight: 4
//         }
//       }
//     ],

//     /*
//     FOOTER
//     */
//     [
//       {
//         content: "Assessor Name",
//         colSpan: 3,
//         styles: { fontStyle: "bold" }
//       },
//       {
//         content: "Center SPOC Name",
//         colSpan: 3,
//         styles: { fontStyle: "bold" }
//       }
//     ],

//     [
//       {
//         content: "Assessor ID",
//         colSpan: 3,
//         styles: { fontStyle: "bold" }
//       },
//       {
//         content: "SPOC Email ID",
//         colSpan: 3,
//         styles: { fontStyle: "bold" }
//       }
//     ],

//     [
//       {
//         content: "Assessor Contact No",
//         colSpan: 3,
//         styles: { fontStyle: "bold" }
//       },
//       {
//         content: "SPOC Contact No",
//         colSpan: 3,
//         styles: { fontStyle: "bold" }
//       }
//     ],

//     [
//       {
//         content: "Assessor Signature",
//         colSpan: 3,
//         styles: {
//           fontStyle: "bold",
//           minCellHeight: 10
//         }
//       },
//       {
//         content: "SPOC Signature & Stamp",
//         colSpan: 3,
//         styles: {
//           fontStyle: "bold",
//           minCellHeight: 10
//         }
//       }
//     ]
//   ];

//   /*
//   -------------------------------------------------------
//   PDF TABLE
//   -------------------------------------------------------
//   */
//   autoTable(doc, {
//     startY: 5,
//     margin: { left, right },
//     theme: "grid",

//     styles: {
//       font: "helvetica",
//       fontSize: 7,
//       cellPadding: 1.2,
//       valign: "middle",
//       lineWidth: 0.2,
//       lineColor: [0, 0, 0],
//       textColor: [0, 0, 0],
//       overflow: "linebreak"
//     },

//     bodyStyles: {
//       minCellHeight: 7
//     },

//     columnStyles: {
//       0: { cellWidth: colWidths[0], halign: "center" },
//       1: { cellWidth: colWidths[1] },
//       2: { cellWidth: colWidths[2] },
//       3: { cellWidth: colWidths[3] },
//       4: { cellWidth: colWidths[4] },
//       5: { cellWidth: colWidths[5] }
//     },

//     body,

//     didDrawPage: () => {
//       doc.setFontSize(7);

//       doc.text(
//         `Page ${doc.getCurrentPageInfo().pageNumber}`,
//         pageWidth - 18,
//         292
//       );
//     }
//   });

//   /*
//   -------------------------------------------------------
//   OUTPUT
//   -------------------------------------------------------
//   */
//   const buffer = doc.output("arraybuffer");

//   return Buffer.from(buffer);
// };



// const generateAttendancePdf = async (batch: any) => {
//   const doc = new jsPDF({
//     orientation: "portrait",
//     unit: "mm",
//     format: "a4"
//   });

//   const pageWidth = doc.internal.pageSize.getWidth();
//   const pageHeight = doc.internal.pageSize.getHeight();

//   /*
//   ---------------------------------------------------
//   HELPERS
//   ---------------------------------------------------
//   */
//   const left = 8;
//   const right = 8;
//   const usableWidth = pageWidth - left - right;

//   const drawCell = (
//     x: number,
//     y: number,
//     w: number,
//     h: number,
//     text = "",
//     align: "left" | "center" = "center",
//     bold = false,
//     size = 8
//   ) => {
//     doc.rect(x, y, w, h);

//     doc.setFont("helvetica", bold ? "bold" : "normal");
//     doc.setFontSize(size);

//     const tx = align === "left" ? x + 2 : x + w / 2;

//     doc.text(String(text), tx, y + h / 2 + 1.5, {
//       align
//     });
//   };

//   const purpleBar = (y: number) => {
//     doc.setFillColor(58, 45, 86);
//     doc.rect(left, y, usableWidth, 5, "F");
//     doc.rect(left, y, usableWidth, 5);
//   };

//   /*
//   ---------------------------------------------------
//   HEADER FUNCTION (repeat every page)
//   ---------------------------------------------------
//   */
//   const drawHeader = () => {
//     let y = 8;

//     const col = usableWidth / 6;

//     drawCell(left, y, col, 12, "LOGO (PIA/TP/SSC)", "center", true, 7);
//     drawCell(
//       left + col,
//       y,
//       col * 4,
//       12,
//       "Vistaskills Private Limited\nASSESSMENT ATTENDANCE SHEET",
//       "center",
//       false,
//       8
//     );
//     drawCell(
//       left + col * 5,
//       y,
//       col,
//       12,
//       "LOGO (Assessment Agency)",
//       "center",
//       true,
//       7
//     );

//     y += 12;

//     drawCell(left, y, usableWidth / 2, 7, `Batch ID : ${batch.id}`, "left", true);
//     drawCell(
//       left + usableWidth / 2,
//       y,
//       usableWidth / 2,
//       7,
//       `Date : `,
//       "left",
//       true
//     );

//     y += 7;

//     drawCell(
//       left,
//       y,
//       usableWidth,
//       7,
//       `Training Partner : ${batch.training_partner_name || ""}`,
//       "left",
//       true
//     );

//     y += 7;

//     drawCell(
//       left,
//       y,
//       usableWidth,
//       7,
//       `Job Role / QP Code : ${batch.qualification_pack?.qp_name || ""}`,
//       "left",
//       true
//     );

//     y += 7;

//     drawCell(
//       left,
//       y,
//       usableWidth,
//       7,
//       `TC Address : ${batch.address || ""}`,
//       "left",
//       true
//     );

//     y += 7;

//     drawCell(
//       left,
//       y,
//       usableWidth / 2,
//       7,
//       `Scheme Name`,
//       "left",
//       true
//     );

//     drawCell(
//       left + usableWidth / 2,
//       y,
//       usableWidth / 2,
//       7,
//       `Sub Scheme`,
//       "left",
//       true
//     );

//     y += 7;

//     drawCell(
//       left,
//       y,
//       usableWidth / 3,
//       7,
//       `Total Count : ${batch.students.length}`,
//       "left",
//       true
//     );

//     drawCell(
//       left + usableWidth / 3,
//       y,
//       usableWidth / 3,
//       7,
//       `Absent Count :`,
//       "left",
//       true
//     );

//     drawCell(
//       left + (usableWidth / 3) * 2,
//       y,
//       usableWidth / 3,
//       7,
//       `Dropout Count :`,
//       "left",
//       true
//     );

//     y += 7;

//     purpleBar(y);

//     return y + 7;
//   };

//   /*
//   ---------------------------------------------------
//   FOOTER
//   ---------------------------------------------------
//   */
//   const drawFooter = (y: number) => {
//     purpleBar(y);
//     y += 5;

//     drawCell(left, y, usableWidth / 2, 7, "Assessor Name", "left", true);
//     drawCell(left + usableWidth / 2, y, usableWidth / 2, 7, "Center SPOC Name", "left", true);

//     y += 7;

//     drawCell(left, y, usableWidth / 2, 7, "Assessor ID", "left", true);
//     drawCell(left + usableWidth / 2, y, usableWidth / 2, 7, "SPOC Email ID", "left", true);

//     y += 7;

//     drawCell(left, y, usableWidth / 2, 7, "Assessor Contact No", "left", true);
//     drawCell(left + usableWidth / 2, y, usableWidth / 2, 7, "SPOC Contact No", "left", true);

//     y += 7;

//     drawCell(left, y, usableWidth / 2, 12, "Assessor Signature", "left", true);
//     drawCell(
//       left + usableWidth / 2,
//       y,
//       usableWidth / 2,
//       12,
//       "SPOC Signature & Stamp",
//       "left",
//       true
//     );
//   };

//   /*
//   ---------------------------------------------------
//   STUDENT DATA
//   ---------------------------------------------------
//   */
//   const rows = batch.students.map((s: any, i: number) => [
//     i + 1,
//     s.candidate_id || "",
//     s.candidate_name || "",
//     s.father_name || "",
//     s.aadhaar_no || "",
//     ""
//   ]);

//   const startY = drawHeader();

//   autoTable(doc, {
//     startY,
//     margin: { left, right },
//     theme: "grid",
//     styles: {
//       fontSize: 7,
//       cellPadding: 1.5,
//       valign: "middle",
//       lineColor: [0, 0, 0],
//       lineWidth: 0.2
//     },
//     headStyles: {
//       fillColor: [255, 255, 255],
//       textColor: [0, 0, 0],
//       fontStyle: "bold"
//     },
//     columnStyles: {
//       0: { cellWidth: 12, halign: "center" },
//       1: { cellWidth: 28 },
//       2: { cellWidth: 42 },
//       3: { cellWidth: 45 },
//       4: { cellWidth: 35 },
//       5: { cellWidth: 30 }
//     },
//     head: [
//       [
//         "S. No.",
//         "Candidate ID",
//         "Candidate Name",
//         "Father's Name",
//         "Aadhar No.",
//         "Candidate Signature"
//       ]
//     ],
//     body: rows,
//     didDrawPage: () => {
//       drawHeader();
//     }
//   });

//   /*
//   ---------------------------------------------------
//   FOOTER ON LAST PAGE
//   ---------------------------------------------------
//   */
//   const finalY =
//     (doc as any).lastAutoTable.finalY + 3;

//   if (finalY + 40 > pageHeight) {
//     doc.addPage();
//     drawHeader();
//     drawFooter(240);
//   } else {
//     drawFooter(finalY);
//   }

//   /*
//   ---------------------------------------------------
//   OUTPUT
//   ---------------------------------------------------
//   */
//   const buffer = doc.output("arraybuffer");

//   return Buffer.from(buffer);
// };

// const generateAttendancePdf = async (batch: any) => {
//   const doc = new jsPDF({
//     orientation: "portrait",
//     unit: "mm",
//     format: "a4"
//   });

//   const pageWidth = 210;
//   const pageHeight = 297;

//   const left = 5;
//   const top = 5;
//   const totalWidth = 200;

//   /*
//   ---------------------------------------------------
//   COLUMN WIDTHS
//   ---------------------------------------------------
//   */
//   const col = [13, 21, 33, 52, 43, 38];

//   const getX = (index: number) => {
//     let x = left;

//     for (let i = 0; i < index; i++) x += col[i];

//     return x;
//   };

//   /*
//   ---------------------------------------------------
//   HELPERS
//   ---------------------------------------------------
//   */
//   const box = (
//     x: number,
//     y: number,
//     w: number,
//     h: number,
//     text = "",
//     align: "center" | "left" = "center",
//     bold = false,
//     size = 8
//   ) => {
//     doc.rect(x, y, w, h);

//     doc.setFont("helvetica", bold ? "bold" : "normal");
//     doc.setFontSize(size);

//     const tx = align === "left" ? x + 2 : x + w / 2;

//     doc.text(String(text), tx, y + h / 2 + 1.5, {
//       align
//     });
//   };

//   const fillRow = (y: number, h: number) => {
//     doc.setFillColor(58, 45, 86);
//     doc.rect(left, y, totalWidth, h, "F");
//     doc.rect(left, y, totalWidth, h);
//   };

//   /*
//   ---------------------------------------------------
//   HEADER DRAWER
//   ---------------------------------------------------
//   */
//   const drawHeader = () => {
//     let y = top;

//     box(getX(0), y, col[0] + col[1], 13, "LOGO (PIA/TP/SSC)", "center", true, 7);

//     box(
//       getX(2),
//       y,
//       col[2] + col[3],
//       13,
//       "Vistaskills Private Limited\nASSESSMENT ATTENDANCE SHEET",
//       "center",
//       true,
//       7
//     );

//     box(
//       getX(4),
//       y,
//       col[4] + col[5],
//       13,
//       "LOGO (Assessment Agency)",
//       "center",
//       true,
//       7
//     );

//     y += 13;

//     box(getX(0), y, col[0] + col[1], 7, "Batch Id", "center", true);
//     box(getX(2), y, col[2] + col[3], 7, batch.id || "");
//     box(getX(4), y, col[4], 7, "Date", "center", true);
//     box(getX(5), y, col[5], 7, "");

//     y += 7;

//     box(
//       getX(0),
//       y,
//       totalWidth,
//       7,
//       `Training Partner  ${batch.training_partner_name || ""}`,
//       "left",
//       true
//     );

//     y += 7;

//     box(getX(0), y, col[0] + col[1], 7, "Job Role/QP Code", "center", true);

//     box(
//       getX(2),
//       y,
//       col[2] + col[3],
//       7,
//       batch.qualification_pack?.qp_name || "",
//       "left"
//     );

//     box(getX(4), y, col[4], 7, "Level", "center", true);
//     box(getX(5), y, col[5], 7, "");

//     y += 7;

//     box(
//       getX(0),
//       y,
//       totalWidth,
//       7,
//       `TC Address  ${batch.address || ""}`,
//       "left",
//       true
//     );

//     y += 7;

//     box(getX(0), y, col[0] + col[1] + col[2], 7, "Scheme Name", "center", true);
//     box(getX(3), y, col[3] + col[4] + col[5], 7, "Sub Scheme", "center", true);

//     y += 7;

//     box(
//       getX(0),
//       y,
//       col[0] + col[1],
//       7,
//       `Total Count ${batch.students.length}`,
//       "center",
//       true
//     );

//     box(getX(2), y, col[2], 7, "Present Count", "center", true);
//     box(getX(3), y, col[3], 7, "Absent Count", "center", true);
//     box(getX(4), y, col[4] + col[5], 7, "Dropout Count", "center", true);

//     y += 7;

//     fillRow(y, 5);

//     y += 5;

//     box(getX(0), y, col[0], 9, "S.\nNo.", "center", true, 7);
//     box(getX(1), y, col[1], 9, "Candidate's ID", "center", true, 7);
//     box(getX(2), y, col[2], 9, "Candidate's Name", "center", true, 7);
//     box(getX(3), y, col[3], 9, "Father's Name", "center", true, 7);
//     box(getX(4), y, col[4], 9, "Aadhar No.", "center", true, 7);
//     box(getX(5), y, col[5], 9, "Candidate's\nSignature", "center", true, 7);

//     return y + 9;
//   };

//   /*
//   ---------------------------------------------------
//   FOOTER DRAWER
//   ---------------------------------------------------
//   */
//   const drawFooter = (y: number) => {
//     fillRow(y, 5);
//     y += 5;

//     box(getX(0), y, col[0] + col[1] + col[2], 7, "Assessor Name", "left", true);
//     box(getX(3), y, col[3] + col[4] + col[5], 7, "Center SPOC Name", "left", true);

//     y += 7;

//     box(getX(0), y, col[0] + col[1] + col[2], 7, "Assessor ID", "left", true);
//     box(getX(3), y, col[3] + col[4] + col[5], 7, "SPOC Email ID", "left", true);

//     y += 7;

//     box(
//       getX(0),
//       y,
//       col[0] + col[1] + col[2],
//       7,
//       "Assessor Contact No",
//       "left",
//       true
//     );

//     box(getX(3), y, col[3] + col[4] + col[5], 7, "SPOC Contact No", "left", true);

//     y += 7;

//     box(
//       getX(0),
//       y,
//       col[0] + col[1] + col[2],
//       10,
//       "Assessor Signature",
//       "left",
//       true
//     );

//     box(
//       getX(3),
//       y,
//       col[3] + col[4] + col[5],
//       10,
//       "SPOC Signature & Stamp",
//       "left",
//       true
//     );
//   };

//   /*
//   ---------------------------------------------------
//   START
//   ---------------------------------------------------
//   */
//   let y = drawHeader();

//   const rowHeight = 7;
//   const footerHeight = 36;

//   for (let i = 0; i < batch.students.length; i++) {
//     /*
//     if page full create next page
//     */
//     if (y + rowHeight + footerHeight > pageHeight - 5) {
//       doc.addPage();
//       y = drawHeader();
//     }

//     const s = batch.students[i];

//     box(getX(0), y, col[0], rowHeight, String(i + 1));

//     box(getX(1), y, col[1], rowHeight, s?.candidate_id || "");

//     box(
//       getX(2),
//       y,
//       col[2],
//       rowHeight,
//       (s?.candidate_name || "").substring(0, 18),
//       "left"
//     );

//     box(
//       getX(3),
//       y,
//       col[3],
//       rowHeight,
//       (s?.father_name || "").substring(0, 26),
//       "left"
//     );

//     box(getX(4), y, col[4], rowHeight, s?.aadhaar_no || "");

//     box(getX(5), y, col[5], rowHeight, "");

//     y += rowHeight;
//   }

//   /*
//   ---------------------------------------------------
//   EMPTY ROWS OPTIONAL (for nice layout)
//   ---------------------------------------------------
//   */
//   while (y + rowHeight + footerHeight <= pageHeight - 5) {
//     box(getX(0), y, col[0], rowHeight, "");
//     box(getX(1), y, col[1], rowHeight, "");
//     box(getX(2), y, col[2], rowHeight, "");
//     box(getX(3), y, col[3], rowHeight, "");
//     box(getX(4), y, col[4], rowHeight, "");
//     box(getX(5), y, col[5], rowHeight, "");

//     y += rowHeight;
//   }

//   /*
//   ---------------------------------------------------
//   FOOTER
//   ---------------------------------------------------
//   */
//   drawFooter(y);

//   /*
//   ---------------------------------------------------
//   OUTPUT
//   ---------------------------------------------------
//   */
//   const buffer = doc.output("arraybuffer");

//   return Buffer.from(buffer);
// };

// const generateAttendancePdf = async (batch: any) => {
//   const doc = new jsPDF({
//     orientation: "portrait",
//     unit: "mm",
//     format: "a4"
//   });

//   const pageWidth = 210;
//   const pageHeight = 297;

//   const left = 5;
//   const top = 5;
//   const totalWidth = 200;

//   /*
//   ---------------------------------------------------
//   COLUMN WIDTHS (same excel style)
//   ---------------------------------------------------
//   */
//   const col = [13, 21, 33, 52, 43, 38]; // total = 200

//   const getX = (index: number) => {
//     let x = left;

//     for (let i = 0; i < index; i++) x += col[i];

//     return x;
//   };

//   /*
//   ---------------------------------------------------
//   HELPERS
//   ---------------------------------------------------
//   */
//   const box = (
//     x: number,
//     y: number,
//     w: number,
//     h: number,
//     text = "",
//     align: "center" | "left" = "center",
//     bold = false,
//     size = 8
//   ) => {
//     doc.rect(x, y, w, h);

//     doc.setFont("helvetica", bold ? "bold" : "normal");
//     doc.setFontSize(size);

//     const tx = align === "left" ? x + 2 : x + w / 2;

//     doc.text(String(text), tx, y + h / 2 + 1.5, {
//       align
//     });
//   };

//   const fillRow = (y: number, h: number) => {
//     doc.setFillColor(58, 45, 86);
//     doc.rect(left, y, totalWidth, h, "F");
//     doc.rect(left, y, totalWidth, h);
//   };

//   let y = top;

//   /*
//   ---------------------------------------------------
//   HEADER
//   ---------------------------------------------------
//   */

//   box(getX(0), y, col[0] + col[1], 13, "LOGO (PIA/TP/SSC)", "center", true, 7);

//   box(
//     getX(2),
//     y,
//     col[2] + col[3],
//     13,
//     "Vistaskills Private Limited\nASSESSMENT ATTENDANCE SHEET",
//     "center",
//     true,
//     7
//   );

//   box(
//     getX(4),
//     y,
//     col[4] + col[5],
//     13,
//     "LOGO (Assessment Agency)",
//     "center",
//     true,
//     7
//   );

//   y += 13;

//   /*
//   ---------------------------------------------------
//   BATCH DETAILS
//   ---------------------------------------------------
//   */

//   box(getX(0), y, col[0] + col[1], 7, "Batch Id", "center", true);
//   box(getX(2), y, col[2] + col[3], 7, batch.id || "");
//   box(getX(4), y, col[4], 7, "Date", "center", true);
//   box(getX(5), y, col[5], 7, "");

//   y += 7;

//   box(getX(0), y, totalWidth, 7, `Training Partner  ${batch.training_partner_name || ""}`, "left", true);

//   y += 7;

//   box(getX(0), y, col[0] + col[1], 7, "Job Role/QP Code", "center", true);
//   box(
//     getX(2),
//     y,
//     col[2] + col[3],
//     7,
//     batch.qualification_pack?.qp_name || "",
//     "left"
//   );
//   box(getX(4), y, col[4], 7, "Level", "center", true);
//   box(getX(5), y, col[5], 7, "");

//   y += 7;

//   box(getX(0), y, totalWidth, 7, `TC Address  ${batch.address || ""}`, "left", true);

//   y += 7;

//   box(getX(0), y, col[0] + col[1] + col[2], 7, "Scheme Name", "center", true);
//   box(getX(3), y, col[3] + col[4] + col[5], 7, "Sub Scheme", "center", true);

//   y += 7;

//   box(getX(0), y, col[0] + col[1], 7, `Total Count ${batch.students.length}`, "center", true);
//   box(getX(2), y, col[2], 7, "Present Count", "center", true);
//   box(getX(3), y, col[3], 7, "Absent Count", "center", true);
//   box(getX(4), y, col[4] + col[5], 7, "Dropout Count", "center", true);

//   y += 7;

//   /*
//   ---------------------------------------------------
//   PURPLE BAR
//   ---------------------------------------------------
//   */

//   fillRow(y, 5);
//   y += 5;

//   /*
//   ---------------------------------------------------
//   TABLE HEADER
//   ---------------------------------------------------
//   */

//   box(getX(0), y, col[0], 9, "S.\nNo.", "center", true, 7);
//   box(getX(1), y, col[1], 9, "Candidate's ID", "center", true, 7);
//   box(getX(2), y, col[2], 9, "Candidate's Name", "center", true, 7);
//   box(getX(3), y, col[3], 9, "Father's Name", "center", true, 7);
//   box(getX(4), y, col[4], 9, "Aadhar No.", "center", true, 7);
//   box(getX(5), y, col[5], 9, "Candidate's\nSignature", "center", true, 7);

//   y += 9;

//   /*
//   ---------------------------------------------------
//   STUDENT ROWS (30)
//   ---------------------------------------------------
//   */

//   for (let i = 0; i < 30; i++) {
//     const s = batch.students[i];

//     box(getX(0), y, col[0], 7, String(i + 1));
//     box(getX(1), y, col[1], 7, s?.candidate_id || "", "center", false, 7);
//     box(
//       getX(2),
//       y,
//       col[2],
//       7,
//       (s?.candidate_name || "").substring(0, 18),
//       "left",
//       false,
//       7
//     );
//     box(
//       getX(3),
//       y,
//       col[3],
//       7,
//       (s?.father_name || "").substring(0, 26),
//       "left",
//       false,
//       7
//     );
//     box(getX(4), y, col[4], 7, s?.aadhaar_no || "", "center", false, 7);
//     box(getX(5), y, col[5], 7, "");

//     y += 7;
//   }

//   /*
//   ---------------------------------------------------
//   FOOTER PURPLE BAR
//   ---------------------------------------------------
//   */

//   fillRow(y, 5);
//   y += 5;

//   /*
//   ---------------------------------------------------
//   FOOTER DETAILS
//   ---------------------------------------------------
//   */

//   box(getX(0), y, col[0] + col[1] + col[2], 7, "Assessor Name", "left", true);
//   box(getX(3), y, col[3] + col[4] + col[5], 7, "Center SPOC Name", "left", true);

//   y += 7;

//   box(getX(0), y, col[0] + col[1] + col[2], 7, "Assessor ID", "left", true);
//   box(getX(3), y, col[3] + col[4] + col[5], 7, "SPOC Email ID", "left", true);

//   y += 7;

//   box(getX(0), y, col[0] + col[1] + col[2], 7, "Assessor Contact No", "left", true);
//   box(getX(3), y, col[3] + col[4] + col[5], 7, "SPOC Contact No", "left", true);

//   y += 7;

//   box(getX(0), y, col[0] + col[1] + col[2], 10, "Assessor Signature", "left", true);
//   box(
//     getX(3),
//     y,
//     col[3] + col[4] + col[5],
//     10,
//     "SPOC Signature & Stamp",
//     "left",
//     true
//   );

//   /*
//   ---------------------------------------------------
//   OUTPUT
//   ---------------------------------------------------
//   */

//   const buffer = doc.output("arraybuffer");

//   return Buffer.from(buffer);
// };

// const generateAttendancePdf = async (batch: any) => {
//   const doc = new jsPDF({
//     orientation: "portrait",
//     unit: "mm",
//     format: "a4"
//   });

//   const pageWidth = doc.internal.pageSize.getWidth();
//   const pageHeight = doc.internal.pageSize.getHeight();

//   /*
//   ---------------------------------------------------
//   HELPERS
//   ---------------------------------------------------
//   */
//   const drawCell = (
//     x: number,
//     y: number,
//     w: number,
//     h: number,
//     text = "",
//     align: "left" | "center" = "center",
//     bold = false,
//     fontSize = 8
//   ) => {
//     doc.rect(x, y, w, h);

//     doc.setFont("helvetica", bold ? "bold" : "normal");
//     doc.setFontSize(fontSize);

//     const tx =
//       align === "left" ? x + 1.5 : x + w / 2;

//     doc.text(String(text), tx, y + h / 2 + 1.5, {
//       align
//     });
//   };

//   /*
//   ---------------------------------------------------
//   TITLE
//   ---------------------------------------------------
//   */
//   doc.setFont("helvetica", "bold");
//   doc.setFontSize(14);

//   doc.text("ASSESSMENT ATTENDANCE SHEET", pageWidth / 2, 10, {
//     align: "center"
//   });

//   /*
//   ---------------------------------------------------
//   TOP INFO TABLE
//   ---------------------------------------------------
//   */

//   let y = 15;

//   drawCell(5, y, 40, 8, "Batch ID", "center", true);
//   drawCell(45, y, 75, 8, batch.id);
//   drawCell(120, y, 35, 8, "Date", "center", true);
//   drawCell(155, y, 50, 8, "");

//   y += 8;

//   drawCell(5, y, 40, 8, "Training Partner", "center", true);
//   drawCell(
//     45,
//     y,
//     160,
//     8,
//     batch.training_partner_name || "",
//     "left"
//   );

//   y += 8;

//   drawCell(5, y, 40, 8, "Job Role", "center", true);
//   drawCell(
//     45,
//     y,
//     75,
//     8,
//     batch.qualification_pack?.qp_name || "",
//     "left"
//   );

//   drawCell(120, y, 35, 8, "Level", "center", true);
//   drawCell(155, y, 50, 8, "");

//   y += 8;

//   drawCell(5, y, 40, 8, "Total Count", "center", true);
//   drawCell(45, y, 25, 8, batch.students.length);

//   drawCell(70, y, 40, 8, "Absent", "center", true);
//   drawCell(110, y, 25, 8, "");

//   drawCell(135, y, 40, 8, "Dropout", "center", true);
//   drawCell(175, y, 30, 8, "");

//   /*
//   ---------------------------------------------------
//   MAIN TABLE HEADER
//   ---------------------------------------------------
//   */

//   y += 12;

//   const cols = {
//     sno: 5,
//     id: 18,
//     name: 48,
//     father: 95,
//     aadhaar: 142,
//     sign: 177
//   };

//   const widths = {
//     sno: 13,
//     id: 30,
//     name: 47,
//     father: 47,
//     aadhaar: 35,
//     sign: 28
//   };

//   const rowHeight = 7;

//   drawCell(cols.sno, y, widths.sno, rowHeight, "S.No", "center", true);
//   drawCell(cols.id, y, widths.id, rowHeight, "Candidate ID", "center", true);
//   drawCell(cols.name, y, widths.name, rowHeight, "Candidate Name", "center", true);
//   drawCell(cols.father, y, widths.father, rowHeight, "Father Name", "center", true);
//   drawCell(cols.aadhaar, y, widths.aadhaar, rowHeight, "Aadhaar", "center", true);
//   drawCell(cols.sign, y, widths.sign, rowHeight, "Sign", "center", true);

//   /*
//   ---------------------------------------------------
//   STUDENT ROWS
//   ---------------------------------------------------
//   */

//   y += rowHeight;

//   for (let i = 0; i < 40; i++) {
//     const student = batch.students[i];

//     drawCell(cols.sno, y, widths.sno, rowHeight, String(i + 1));
//     drawCell(cols.id, y, widths.id, rowHeight, student?.candidate_id || "");
//     drawCell(
//       cols.name,
//       y,
//       widths.name,
//       rowHeight,
//       (student?.candidate_name || "").substring(0, 24),
//       "left"
//     );

//     drawCell(
//       cols.father,
//       y,
//       widths.father,
//       rowHeight,
//       (student?.father_name || "").substring(0, 24),
//       "left"
//     );

//     drawCell(
//       cols.aadhaar,
//       y,
//       widths.aadhaar,
//       rowHeight,
//       student?.aadhaar_no || ""
//     );

//     drawCell(cols.sign, y, widths.sign, rowHeight, "");

//     y += rowHeight;

//     if (y > pageHeight - 35) break;
//   }

//   /*
//   ---------------------------------------------------
//   FOOTER TABLE
//   ---------------------------------------------------
//   */

//   y += 5;

//   drawCell(5, y, 95, 10, "Assessor Name", "left", true);
//   drawCell(100, y, 105, 10, "Center SPOC Name", "left", true);

//   y += 10;

//   drawCell(5, y, 95, 10, "Assessor Signature", "left", true);
//   drawCell(100, y, 105, 10, "SPOC Signature & Stamp", "left", true);

//   /*
//   ---------------------------------------------------
//   OUTPUT
//   ---------------------------------------------------
//   */

//   const arrayBuffer = doc.output("arraybuffer");

//   return Buffer.from(arrayBuffer);
// };
// const generateAttendanceSheetExcel = async (batch: any) => {
//   /*
//   IMPORTANT:
//   use default import typing
//   */
//   const ExcelJS = (await import("exceljs")).default;

//   const workbook = new ExcelJS.Workbook();

//   const worksheet = workbook.addWorksheet("Attendance Sheet", {
//     views: [{ showGridLines: false }]
//   });

//   /*
//   ---------------------------------------------------
//   TYPE SAFE HELPERS
//   ---------------------------------------------------
//   */

//   const border = {
//     top: { style: "thin" as const },
//     left: { style: "thin" as const },
//     bottom: { style: "thin" as const },
//     right: { style: "thin" as const }
//   };

//   const center = {
//     vertical: "middle" as const,
//     horizontal: "center" as const,
//     wrapText: true
//   };

//   const purpleFill = {
//     type: "pattern" as const,
//     pattern: "solid" as const,
//     fgColor: { argb: "3B2F59" }
//   };

//   const bold = {
//     bold: true
//   };

//   const titleFont = {
//     bold: true,
//     size: 14
//   };

//   const applyBorder = (
//     rowStart: number,
//     rowEnd: number,
//     colStart: number,
//     colEnd: number
//   ) => {
//     for (let r = rowStart; r <= rowEnd; r++) {
//       for (let c = colStart; c <= colEnd; c++) {
//         worksheet.getCell(r, c).border = border;
//       }
//     }
//   };

//   /*
//   ---------------------------------------------------
//   TITLE SECTION
//   ---------------------------------------------------
//   */
//   worksheet.mergeCells("A1:A2");
//   worksheet.mergeCells("B1:E2");
//   worksheet.mergeCells("F1:F2");

//   worksheet.getCell("A1").value = "LOGO (PIA/TP/SSC)";
//   worksheet.getCell("B1").value =
//     "Vistaskills Private Limited\nASSESSMENT ATTENDANCE SHEET";
//   worksheet.getCell("F1").value = "LOGO (Assessment Agency)";

//   ["A1", "B1", "F1"].forEach((cell) => {
//     worksheet.getCell(cell).alignment = center;
//     worksheet.getCell(cell).font = titleFont;
//   });

//   applyBorder(1, 2, 1, 6);

//   /*
//   ---------------------------------------------------
//   BATCH INFO
//   ---------------------------------------------------
//   */
//   worksheet.mergeCells("A3:B3");
//   worksheet.mergeCells("C3:E3");

//   worksheet.getCell("A3").value = "Batch Id";
//   worksheet.getCell("C3").value = batch.id;
//   worksheet.getCell("F3").value = "Date";

//   worksheet.mergeCells("A4:F4");
//   worksheet.getCell("A4").value = `Training Partner : ${
//     batch.training_partner_name || ""
//   }`;

//   worksheet.mergeCells("A5:C5");
//   worksheet.mergeCells("D5:E5");

//   worksheet.getCell("A5").value = "Job Role / QP Code";
//   worksheet.getCell("D5").value =
//     batch.qualification_pack?.qp_name || "";
//   worksheet.getCell("F5").value = "Level";

//   worksheet.mergeCells("A6:F6");
//   worksheet.getCell("A6").value = `TC Address : ${batch.address || ""}`;

//   worksheet.mergeCells("A7:C7");
//   worksheet.mergeCells("D7:F7");

//   worksheet.getCell("A7").value = "Scheme Name";
//   worksheet.getCell("D7").value = "Sub Scheme";

//   worksheet.mergeCells("A8:B8");
//   worksheet.mergeCells("C8:D8");
//   worksheet.mergeCells("E8:F8");

//   worksheet.getCell("A8").value = `Total Count : ${batch.students.length}`;
//   worksheet.getCell("C8").value = "Absent Count :";
//   worksheet.getCell("E8").value = "Dropout Count :";

//   applyBorder(3, 8, 1, 6);

//   for (let r = 3; r <= 8; r++) {
//     for (let c = 1; c <= 6; c++) {
//       worksheet.getCell(r, c).alignment = center;
//     }
//   }

//   /*
//   ---------------------------------------------------
//   PURPLE LINE
//   ---------------------------------------------------
//   */
//   for (let c = 1; c <= 6; c++) {
//     worksheet.getCell(9, c).fill = purpleFill;
//     worksheet.getCell(9, c).border = border;
//   }

//   /*
//   ---------------------------------------------------
//   TABLE HEADER
//   ---------------------------------------------------
//   */
//   const headers = [
//     "S. No.",
//     "Candidate's ID",
//     "Candidate's Name",
//     "Father's Name",
//     "Aadhar No.",
//     "Candidate Signature"
//   ];

//   worksheet.addRow(headers);

//   headers.forEach((_, index) => {
//     const cell = worksheet.getCell(10, index + 1);
//     cell.font = bold;
//     cell.alignment = center;
//     cell.border = border;
//   });

//   worksheet.getRow(10).height = 28;

//   /*
//   ---------------------------------------------------
//   STUDENTS (30 ROWS)
//   ---------------------------------------------------
//   */
//   const startRow = 11;

//   for (let i = 0; i < 30; i++) {
//     const student = batch.students[i];

//     worksheet.getCell(startRow + i, 1).value = i + 1;
//     worksheet.getCell(startRow + i, 2).value =
//       student?.candidate_id || "";
//     worksheet.getCell(startRow + i, 3).value =
//       student?.candidate_name || "";
//     worksheet.getCell(startRow + i, 4).value =
//       student?.father_name || "";
//     worksheet.getCell(startRow + i, 5).value =
//       student?.aadhaar_no || "";
//     worksheet.getCell(startRow + i, 6).value = "";

//     for (let c = 1; c <= 6; c++) {
//       worksheet.getCell(startRow + i, c).border = border;
//       worksheet.getCell(startRow + i, c).alignment = center;
//     }

//     worksheet.getRow(startRow + i).height = 24;
//   }

//   /*
//   ---------------------------------------------------
//   FOOTER BAR
//   ---------------------------------------------------
//   */
//   const footerBarRow = 41;

//   for (let c = 1; c <= 6; c++) {
//     worksheet.getCell(footerBarRow, c).fill = purpleFill;
//     worksheet.getCell(footerBarRow, c).border = border;
//   }

//   /*
//   ---------------------------------------------------
//   FOOTER DETAILS
//   ---------------------------------------------------
//   */
//   worksheet.mergeCells("A42:B42");
//   worksheet.mergeCells("D42:F42");

//   worksheet.getCell("A42").value = "Assessor Name";
//   worksheet.getCell("D42").value = "Center SPOC Name";

//   worksheet.mergeCells("A43:B43");
//   worksheet.mergeCells("D43:F43");

//   worksheet.getCell("A43").value = "Assessor ID";
//   worksheet.getCell("D43").value = "SPOC Email ID";

//   worksheet.mergeCells("A44:B44");
//   worksheet.mergeCells("D44:F44");

//   worksheet.getCell("A44").value = "Assessor Contact No";
//   worksheet.getCell("D44").value = "SPOC Contact No";

//   worksheet.mergeCells("A45:B46");
//   worksheet.mergeCells("D45:F46");

//   worksheet.getCell("A45").value = "Assessor Signature";
//   worksheet.getCell("D45").value = "SPOC Signature & Stamp";

//   applyBorder(42, 46, 1, 6);

//   for (let r = 42; r <= 46; r++) {
//     for (let c = 1; c <= 6; c++) {
//       worksheet.getCell(r, c).alignment = center;
//       worksheet.getCell(r, c).font = bold;
//     }
//   }

//   /*
//   ---------------------------------------------------
//   PAGE SETUP
//   ---------------------------------------------------
//   */
//   worksheet.pageSetup = {
//     paperSize: 9,
//     orientation: "landscape",
//     fitToPage: true,
//     fitToWidth: 1,
//     fitToHeight: 1,
//     margins: {
//       left: 0.2,
//       right: 0.2,
//       top: 0.2,
//       bottom: 0.2,
//       header: 0.1,
//       footer: 0.1
//     }
//   };

//   const buffer = await workbook.xlsx.writeBuffer();
//   return buffer;
// };
