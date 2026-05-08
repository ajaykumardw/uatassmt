import { NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import prisma from "@/libs/prisma";
import { authOptions } from "@/libs/auth";

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
