import { authOptions } from "@/libs/auth";
import prisma from "@/libs/prisma";
import { getServerSession } from "next-auth";


// GET /api/templates
export async function GET(req: Request) {

    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }


    const whereClause = activeOnly ? { is_active: true, created_by: Number(userId) } : { created_by: Number(userId) };

    const templates = await prisma.certificate_template.findMany({
        where: whereClause,
        orderBy: { created_at: "desc" }
    });

    return Response.json(templates);
}



// POST /api/templates

export async function POST(req: Request) {
    const body = await req.json();

    const template = await prisma.certificate_template.create({
        data: {
            name: body.name,
            config: body.config
        }
    });

    return Response.json(template);
}

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
