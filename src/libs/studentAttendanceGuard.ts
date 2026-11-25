import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { verify, type JwtPayload } from 'jsonwebtoken'

import { authOptions } from '@/libs/auth'
import prisma from '@/libs/prisma'

type HeaderReader = {
  get(name: string): string | null
}

export type AttendanceStudent = {
  id: number
  batch_id: number
  attendance: number | null
  image: string | null
  id_front_image: string | null
  id_back_image: string | null
}

export function isExcludedIp(source: HeaderReader) {
  let ip =
    source.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    source.get('x-real-ip')?.trim() ||
    '0.0.0.0'

  if (ip === '::1') ip = '127.0.0.1'
  if (ip.startsWith('::ffff:')) ip = ip.split('::ffff:')[1]

  const excludeIps = process.env.EXCLUDE_IPS
    ? process.env.EXCLUDE_IPS.split(',').map(item => item.trim()).filter(Boolean)
    : []

  return excludeIps.includes(ip)
}

const hasImage = (value?: string | null) => typeof value === 'string' ? value.trim().length > 0 : Boolean(value)

export async function getStudentAttendanceState(studentId: number) {
  if (!Number.isFinite(studentId) || studentId <= 0) {
    return { allowed: false, student: null }
  }

  const student = await prisma.students.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      batch_id: true,
      attendance: true,
      image: true,
      id_front_image: true,
      id_back_image: true
    }
  })

  const allowed =
    !!student &&
    student.attendance === 1 &&
    hasImage(student.image) &&
    hasImage(student.id_front_image) &&
    hasImage(student.id_back_image)

  return { allowed, student: student as AttendanceStudent | null }
}

export async function enforceStudentAttendance(req: Request) {
  if (isExcludedIp(req.headers)) {
    return { ok: true as const, student: null, studentId: null }
  }

  const authHeader = req.headers.get('authorization')
  let studentId: number | null = null

  if (authHeader) {
    try {
      const token = authHeader.split(' ')[1]
      const decoded = verify(token, process.env.NEXTAUTH_SECRET as string) as JwtPayload

      if (!decoded.candidate_id) {
        return {
          ok: false as const,
          response: NextResponse.json(
            { status: 'Error', statusCode: 403, message: 'Forbidden: Insufficient permissions' },
            { status: 403 }
          )
        }
      }

      studentId = Number(decoded.id)
    } catch {
      return {
        ok: false as const,
        response: NextResponse.json(
          { status: 'Error', statusCode: 401, message: 'Invalid or expired token' },
          { status: 401 }
        )
      }
    }
  } else {
    const session = await getServerSession(authOptions)

    studentId = Number(session?.user.id)
  }

  if (!studentId || !Number.isFinite(studentId)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { status: 'Error', statusCode: 401, message: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  const state = await getStudentAttendanceState(studentId)

  if (!state.allowed) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          status: 'Error',
          statusCode: 403,
          code: 'ATTENDANCE_REQUIRED',
          message: 'Attendance is not marked or capture is incomplete'
        },
        { status: 403 }
      )
    }
  }

  return { ok: true as const, student: state.student as AttendanceStudent, studentId }
}
