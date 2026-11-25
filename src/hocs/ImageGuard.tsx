// Third-party Imports
import { headers } from 'next/headers'

import { getServerSession } from 'next-auth'

// Type Imports
import type { Locale } from '@configs/i18n'
import type { ChildrenType } from '@core/types'

// Component Imports
import ImageRedirect from '@/components/ImageRedirect'
import { authOptions } from '@/libs/auth'
import prisma from '@/libs/prisma'
import { getStudentAttendanceState, isExcludedIp } from '@/libs/studentAttendanceGuard'

export const dynamic = "force-dynamic";

export default async function ImageGuard({ children, locale }: ChildrenType & { locale: Locale }) {
  const session = await getServerSession(authOptions)

  if (isExcludedIp(headers())) {
    return <>{children}</>
  }

  const studentLog = await prisma.log_sessions.findFirst({
    where: {
      user_id: Number(session?.user.id),
      unique_session_id: session?.user.sessionId
    },
    select: {
      id: true,
      auth_image: true
    }
  })

  const attendanceState = await getStudentAttendanceState(Number(session?.user.id))

  return <>{studentLog && attendanceState.allowed ? children : <ImageRedirect lang={locale} />}</>
}
