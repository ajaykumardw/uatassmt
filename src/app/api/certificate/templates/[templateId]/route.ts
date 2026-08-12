import fs from "fs";
import path from "path";

import { NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import sharp from "sharp";

import prisma from "@/libs/prisma";
import { authOptions } from "@/libs/auth";

import generateTemplateHtml from "@/libs/generateTemplateHtml";

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

  const fileName = `${Date.now()}-${crypto.randomUUID()}.webp`;

  const filePath = path.join(UPLOAD_DIR, fileName);

  await sharp(buffer)
    .resize({
      width: Math.round(width),
      height: Math.round(height),
      fit: fit
    })
    .webp({ quality })
    .toFile(filePath);

  return `/storage/uploads/templates/${fileName}`;
};

// ================= GET SINGLE =================
export async function GET(
  _req: Request,
  { params }: { params: { templateId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const templateId = Number(params.templateId);

    if (!templateId || Number.isNaN(templateId)) {
      return NextResponse.json(
        { success: false, message: "Valid template ID is required" },
        { status: 400 }
      );
    }

    const template = await prisma.certificate_template.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      return NextResponse.json(
        { success: false, message: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: template }, { status: 200 });
  } catch (error: any) {
    console.error("GET TEMPLATE ERROR:", error);

    return NextResponse.json(
      { success: false, message: "An error occurred", error: error.message },
      { status: 500 }
    );
  }
}

// ================= UPDATE =================
export async function PUT(
  req: Request,
  { params }: { params: { templateId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const templateId = Number(params.templateId);

    if (!templateId || Number.isNaN(templateId)) {
      return NextResponse.json(
        { success: false, message: "Valid template ID is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.certificate_template.findUnique({
      where: { id: templateId }
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Template not found" },
        { status: 404 }
      );
    }

    const formData = await req.formData();

    const templateName = formData.get("name") as string;

    if (!templateName) {
      return NextResponse.json(
        { success: false, message: "Template name is required" },
        { status: 400 }
      );
    }

    const templateString = formData.get("template") as string;

    if (!templateString) {
      return NextResponse.json(
        { success: false, message: "Template missing" },
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
      if (key.startsWith("files[") && value instanceof File) {
        const fileKey = key.replace("files[", "").replace("]", "");

        const element = template.elements.find((el: any) => el.fileKey === fileKey);

        const finalWidth = Math.round((element?.width || 300) * (element?.scaleX || 1));
        const finalHeight = Math.round((element?.height || 300) * (element?.scaleY || 1));

        const url = await saveFile(value, finalWidth, finalHeight, 100);

        uploadedFiles[fileKey] = url;
      }
    }

    // ================= UPDATE TEMPLATE CONFIG =================
    if (template.background) {
      template.background.url = backgroundUrl || template.background.url || "";
    }

    template.elements = template.elements.map((el: any) => {
      if (el.type === "image" && el.fileKey && uploadedFiles[el.fileKey]) {
        return { ...el, src: uploadedFiles[el.fileKey] };
      }

      return el;
    });

    // ================= GENERATE HTML =================
    let html = generateTemplateHtml(template);

    const resolvedBackground = template.background?.url || backgroundUrl || "";

    html = html.replaceAll("{{background}}", resolvedBackground);

    Object.entries(uploadedFiles).forEach(([fileKey, url]) => {
      html = html.replaceAll(`{{${fileKey}}}`, url);
    });

    // keep existing (not re-uploaded) image urls in html
    template.elements.forEach((el: any) => {
      if (el.type === "image" && el.fileKey && el.src && !uploadedFiles[el.fileKey]) {
        html = html.replaceAll(`{{${el.fileKey}}}`, el.src);
      }
    });

    // ================= SAVE DB =================
    const updatedTemplate = await prisma.certificate_template.update({
      where: { id: templateId },
      data: {
        name: templateName,
        config: template,
        html
      }
    });

    return NextResponse.json(
      { success: true, message: "Template updated", data: updatedTemplate },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("PUT TEMPLATE ERROR:", error);

    return NextResponse.json(
      { success: false, message: "An error occurred", error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { templateId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized"
        },
        { status: 401 }
      );
    }

    const templateId = Number(params.templateId);

    if (!templateId || Number.isNaN(templateId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid template ID is required"
        },
        { status: 400 }
      );
    }

    const { id: userId, user_type: userType } = session.user;

    // Restrict AG users to their own agency templates
    const agencyFilter =
      userType === "AG"
        ? { agency_id: Number(userId) }
        : {};

    // Use transaction for atomicity
    const [, activatedTemplate] = await prisma.$transaction([
      prisma.certificate_template.updateMany({
        where: {
          ...agencyFilter,
          is_active: true
        },
        data: {
          is_active: false
        }
      }),

      prisma.certificate_template.update({
        where: {
          id: templateId
        },
        data: {
          is_active: true
        }
      })
    ]);

    return NextResponse.json(
      {
        success: true,
        message: "Template activated successfully",
        template: activatedTemplate
      },
      { status: 200 }
    );
  } catch (error: any) {

    console.error("PATCH TEMPLATE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "An error occurred",
        error: error.message
      },
      { status: 500 }
    );
  }
}
