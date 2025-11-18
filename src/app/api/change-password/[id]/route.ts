import { NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { hash } from 'bcrypt';

import prisma from '@/libs/prisma';

import { authOptions } from '@/libs/auth';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);

  if (!id || isNaN(id)) {
    return NextResponse.json(
      { status: 'Error', message: 'Invalid user ID' },
      { status: 400 }
    );
  }

  const session = await getServerSession(authOptions);

  if (session?.user?.user_type !== 'AG') {
    return NextResponse.json(
      { status: 'Error', message: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { newPassword, userType } = await req.json();

  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json(
      { status: 'Error', message: 'Password must be at least 6 characters' },
      { status: 400 }
    );
  }

  if (!userType) {
    return NextResponse.json(
      { status: 'Error', message: 'userType is required' },
      { status: 400 }
    );
  }

  try {
    const hashedPassword = await hash(newPassword, 10);

    const updateMap: Record<
      string,
      { model: any; field: string }
    > = {
      candidate: { model: prisma.students, field: 'password' },
      ssc: { model: prisma.sector_skill_councils, field: 'ssc_pwd' },
      user: { model: prisma.users, field: 'password' },
    };

    const selected = updateMap[userType] ?? updateMap['user'];

    // 🔍 1. Check if the user exists
    const existingUser = await selected.model.findUnique({
      where: { id },
      select: { id: true }, // small, efficient lookup
    });

    if (!existingUser) {
      return NextResponse.json(
        { status: 'Error', message: 'User not found' },
        { status: 404 }
      );
    }

    // 🔑 2. Update password
    await selected.model.update({
      where: { id },
      data: { [selected.field]: hashedPassword },
    });

    return NextResponse.json({
      status: 'Success',
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Password update error:', error);

    return NextResponse.json(
      { status: 'Error', message: 'Failed to update password' },
      { status: 500 }
    );
  }
}
