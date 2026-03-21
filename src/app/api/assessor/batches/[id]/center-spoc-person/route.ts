import { type NextRequest, NextResponse } from "next/server";

import { verify, type JwtPayload } from 'jsonwebtoken';

import { Prisma } from "@prisma/client";

import prisma from '@/libs/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {

    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
    
        return NextResponse.json({
            status: 'Error',
            statusCode: 401,
            message: "Missing token"
        }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    try {

        const decoded = verify(token, process.env.NEXTAUTH_SECRET as string) as JwtPayload;
        
        if (decoded.user_type !== 'U' || decoded.role_id !== 1) {
        
            return NextResponse.json({
                status: 'Error',
                statusCode: 403,
                message: 'Forbidden: Insufficient permissions'
            }, { status: 403 });
        }

        const batchId = Number(params.id);

        const batch = await prisma.batches.findFirst({
            where: {
                id: batchId,
                assessor_id: Number(decoded.id),
            },
            select: {
                center_spoc_person_name: true,
                center_spoc_person_email: true,
                center_spoc_person_phone: true,
                training_center: {
                    select: {
                        first_name: true,
                        last_name: true,
                        email: true,
                        mobile_no: true,
                    }
                }
            }
        });
        
        if (!batch) {
            
            return NextResponse.json({
                status: 'Error',
                statusCode: 404,
                message: 'Batch not found'
            }, { status: 404 });
        }

        batch.center_spoc_person_name = batch.center_spoc_person_name || `${batch.training_center.first_name} ${batch.training_center.last_name}`;
        batch.center_spoc_person_email = batch.center_spoc_person_email || batch.training_center.email;
        batch.center_spoc_person_phone = batch.center_spoc_person_phone || batch.training_center.mobile_no;

        const cleanBatch = {
            center_spoc_person_name:
                batch.center_spoc_person_name ||
                `${batch.training_center?.first_name ?? ""} ${batch.training_center?.last_name ?? ""}`.trim(),

            center_spoc_person_email:
                batch.center_spoc_person_email || batch.training_center?.email,

            center_spoc_person_phone:
                batch.center_spoc_person_phone || batch.training_center?.mobile_no,
            };

        return NextResponse.json({
            status: 'Success',
            statusCode: 200,
            data: cleanBatch,
        }, { status: 200 });
    } catch (error) {
        console.error("Error in GET /assessor/batches/[id]/center-spoc-person:", error);
        
        return NextResponse.json({
            status: 'Error',
            statusCode: 500,
            message: 'Internal Server Error'
        }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {

        return NextResponse.json({
            status: 'Error',
            statusCode: 401,
            message: "Missing token"
        }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    try {

        const decoded = verify(token, process.env.NEXTAUTH_SECRET as string) as JwtPayload;
        
        if (decoded.user_type !== 'U' || decoded.role_id !== 1) {
        
            return NextResponse.json({
                status: 'Error',
                statusCode: 403,
                message: 'Forbidden: Insufficient permissions'
            }, { status: 403 });
        }
        
        const batchId = Number(params.id);

        const { center_spoc_person_name, center_spoc_person_email, center_spoc_person_phone } = await req.json();

        const updatedBatch = await prisma.batches.update({
            where: {
                id: batchId,
                assessor_id: Number(decoded.id),
            },
            data: {
                center_spoc_person_name,
                center_spoc_person_email,
                center_spoc_person_phone,
            },
            select: {
                center_spoc_person_name: true,
                center_spoc_person_email: true,
                center_spoc_person_phone: true,
            }
        });

        if (!updatedBatch) {
            
            return NextResponse.json({
                status: 'Error',
                statusCode: 404,
                message: 'Batch not found or no permission to update'
            }, { status: 404 });
        }

        return NextResponse.json({
            status: 'Success',
            statusCode: 200,
            message: 'Center SPOC person details updated successfully',
            data: updatedBatch
        }, { status: 200 });
    } catch (error: any) {

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

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return NextResponse.json({
                status: 'Error',
                statusCode: 400,
                message: error.message,
                error: error
            }, { status: 400 });
        }

        console.error("Error in POST /assessor/batches/[id]/center-spoc-person:", error);
        
        return NextResponse.json({
            status: 'Error',
            statusCode: 500,
            message: 'Internal Server Error'
        }, { status: 500 });
    }
}
