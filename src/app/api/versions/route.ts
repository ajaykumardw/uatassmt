import { NextResponse } from "next/server";

import prisma from '@/libs/prisma';

export async function GET() {

  const versions = await prisma.version.findMany({
    orderBy: {
      version_number: 'asc'
    }
  })

  return NextResponse.json(versions);
}

export async function POST(req: Request) {

  const data = await req.json();
  const {versionNumber, versionName} = data;

  try {

    const result = await prisma.version.create({
      data: {
        version_number: versionNumber,
        version_name: versionName
      },
    });

    return NextResponse.json(
      {
        status: 'Success',
        message: 'Version created successfully',
        data: result
      },
      { status: 201 }
    );

  } catch (error) {
    return NextResponse.json(
      {
        status: 'Error',
        message: 'Internal Server Error',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
