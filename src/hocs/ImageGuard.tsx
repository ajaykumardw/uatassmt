// Third-party Imports
import { getServerSession } from 'next-auth'

// Type Imports
import type { Locale } from '@configs/i18n'
import type { ChildrenType } from '@core/types'

// Component Imports
import ImageRedirect from '@/components/ImageRedirect'
import { authOptions } from '@/libs/auth'
import prisma from '@/libs/prisma'

export default async function ImageGuard({ children, locale }: ChildrenType & { locale: Locale }) {
  const session = await getServerSession(authOptions)

  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students/auth-image?studentId=${session?.user.id}`);

  const res = await fetch('https://api.ipify.org');
  const ip = await res.text();

  const excludeIps = [
    '127.0.0.1',
    '103.246.170.213'
  ]

  console.log("ips: ", ip);

  if (excludeIps.includes(ip)){
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

  return <>{studentLog && studentLog.auth_image ? children : <ImageRedirect lang={locale} />}</>
}
