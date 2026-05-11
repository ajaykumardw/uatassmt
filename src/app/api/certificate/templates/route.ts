import fs from "fs";
import path from "path";

import { type NextRequest, NextResponse } from "next/server";

import sharp from "sharp";

import { format } from "date-fns";
import { getServerSession } from "next-auth";

import prisma from "@/libs/prisma";

import generateTemplateHtml from "@/libs/generateTemplateHtml";

import { authOptions } from "@/libs/auth";
import { agencyImagePath } from "@/configs/customDataConfig";


// GET /api/templates
export async function GET(req: NextRequest) {
  try {

    // ================= SESSION =================
    const session =
      await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized"
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userType = session.user.user_type;
    const agencyId = session.user.agency_id;

    // ================= QUERY =================
    const searchParams =
      req.nextUrl.searchParams;

    const page =
      Number(searchParams.get("page")) || 1;

    const limit =
      Number(searchParams.get("limit")) || 10;

    const search =
      searchParams.get("search") || "";

    const skip =
      (page - 1) * limit;

    // ================= WHERE =================
    const where: any = {};


    if (userType === "AG") {
      where.agency_id = Number(userId);
    } else {
      where.created_by = Number(userId);
    }

    const agencyData = await prisma.users.findUnique({
      where: {
        id: Number(agencyId)
      },
      select: {
        id: true,
        company_name: true,
        first_name: true,
        last_name: true,
        avatar: true,
        sign_image: true
      }
    });

    const mappedAgencyData = agencyData
      ? {
          id: agencyData.id,
          agency_name:
            agencyData.company_name || '',
          head_name:
            `${agencyData.first_name} ${agencyData.last_name}`.trim(),
          agency_logo: agencyData.avatar ? agencyImagePath(agencyData.id, agencyData.avatar) : null,
          agency_stamp: agencyData.sign_image ? agencyImagePath(agencyData.id, `sign/${agencyData.sign_image}`) : null,
          avatar: agencyData.avatar,
          sign_image: agencyData.sign_image,
          issue_date: format(new Date(), "dd/MM/yyyy"),
          certificate_no: `CERT-${agencyData.id.toString().padStart(4, "0")}`,
          system_identification_no: "SDISDDUGKY/2025-26/UP2019CR26944/66CC1C829381F/Can_3228297"
        }
      : null;

    if (search) {
      where.name = {
        contains: search
      };
    }

    // ================= FETCH =================
    const [templates, total] =
      await Promise.all([

        prisma.certificate_template.findMany({
          where,

          orderBy: {
            created_at: "desc"
          },

          skip,
          take: limit,

          select: {
            id: true,
            name: true,
            is_active: true,
            created_at: true,
            updated_at: true,

            // preview ke liye
            config: true,
            html: true
          }
        }),

        prisma.certificate_template.count({
          where
        })
      ]);

    // ================= RESPONSE =================
    return NextResponse.json({
      success: true,

      data: templates,
      agency: mappedAgencyData,

      pagination: {
        total,
        page,
        limit,
        totalPages:
          Math.ceil(total / limit)
      }
    });

  } catch (error: any) {

    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Internal server error"
      },
      { status: 500 }
    );
  }
}

const UPLOAD_DIR = path.join(process.cwd(), "storage/uploads/templates");

// ================= CREATE DIR =================
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ================= SAVE FILE =================
const saveFile = async (
  file: File,
  width: number,
  height: number,
  quality = 80,
  fit: "fill" | "contain" = "contain"
) => {

  const bytes = await file.arrayBuffer();

  const buffer = Buffer.from(bytes);

  const fileName =
    `${Date.now()}-${crypto.randomUUID()}.webp`;

  const filePath =
    path.join(UPLOAD_DIR, fileName);

  await sharp(buffer)
    .resize({
      width: Math.round(width),
      height: Math.round(height),
      fit: fit
    })
    .webp({
      quality
    })
    .toFile(filePath);

  return `/storage/uploads/templates/${fileName}`;
};

// ================= POST =================
export async function POST(req: NextRequest) {
  try {

    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const agencyId = session.user.agency_id;

    // ================= FORM DATA =================
    const formData = await req.formData();

    const templateName = formData.get("name") as string;

    if (!templateName) {
      return NextResponse.json(
        {
          success: false,
          message: "Template name is required"
        },
        { status: 400 }
       );
    }

    const templateString =
      formData.get("template") as string;

    if (!templateString) {
      return NextResponse.json(
        {
          success: false,
          message: "Template missing"
        },
        { status: 400 }
      );
    }

    const template = JSON.parse(templateString);

    // ================= BACKGROUND =================
    let backgroundUrl = "";

    const bgFile = formData.get("background") as File;

    if (bgFile) {
      backgroundUrl = await saveFile(bgFile, template.width, template.height, 100, "fill");
    }

    // ================= FILE MAP =================
    const uploadedFiles: Record<string, string> = {};

    for (const [key, value] of formData.entries()) {

      // files[signature_1]
      if (
        key.startsWith("files[") &&
        value instanceof File
      ) {

        const fileKey = key
          .replace("files[", "")
          .replace("]", "");

          // ================= FIND ELEMENT =================
        const element =
          template.elements.find(
            (el: any) =>
              el.fileKey === fileKey
          );

        // fallback
        const finalWidth = Math.round(
          (element?.width || 300) *
          (element?.scaleX || 1)
        );

        const finalHeight = Math.round(
          (element?.height || 300) *
          (element?.scaleY || 1)
        );

        // ================= QR SPECIAL =================
        // const quality =
        //   element?.type === "qr"
        //     ? 100
        //     : 80;

        const quality = 100;

        const url = await saveFile(value, finalWidth, finalHeight, quality);

        uploadedFiles[fileKey] = url;
      }
    }

    // ================= UPDATE TEMPLATE CONFIG =================

    // background inject
    if (template.background) {
      template.background.url = backgroundUrl;
    }

    // images inject
    template.elements = template.elements.map((el: any) => {

      if (
        el.type === "image" &&
        el.fileKey &&
        uploadedFiles[el.fileKey]
      ) {
        return {
          ...el,
          src: uploadedFiles[el.fileKey]
        };
      }

      return el;
    });

    // ================= GENERATE HTML =================
    let html = generateTemplateHtml(template);

    // background replace
    html = html.replaceAll(
      "{{background}}",
      backgroundUrl || ""
    );

    // image replace
    Object.entries(uploadedFiles).forEach(
      ([fileKey, url]) => {

        html = html.replaceAll(
          `{{${fileKey}}}`,
          url
        );
      }
    );

    // ================= SAVE DB =================
    const savedTemplate =
      await prisma.certificate_template.create({
        data: {
          name:
            templateName || `Template ${Date.now()}`,

          config: template,

          html,

          agency_id: Number(agencyId),
          created_by: Number(userId),

          is_active: false
        }
      });

    return NextResponse.json({
      success: true,
      message: "Template saved",
      data: savedTemplate
    });

  } catch (error: any) {

    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "Internal server error"
      },
      { status: 500 }
    );
  }
}

// // POST /api/templates

// export async function POST(req: Request) {
//     const body = await req.json();

//     const template = await prisma.certificate_template.create({
//         data: {
//             name: body.name,
//             config: body.config
//         }
//     });

//     return Response.json(template);
// }

// PATCH /api/templates/active
export async function PATCH(req: Request) {
    const { id } = await req.json();

    // deactivate all
    await prisma.certificate_template.updateMany({
        data: { is_active: false }
    });

    // activate selected
    await prisma.certificate_template.update({
        where: { id },
        data: { is_active: true }
    });

    return Response.json({ success: true });
}
