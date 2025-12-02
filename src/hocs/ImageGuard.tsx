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

export default async function ImageGuard({ children, locale }: ChildrenType & { locale: Locale }) {
  const session = await getServerSession(authOptions)

  // 1️⃣ Get client IP
  const ip =
    headers().get('x-forwarded-for')?.split(',')[0] ||
    headers().get('x-real-ip') ||
    '0.0.0.0'

    console.log("ips: ", ip);

  // 2️⃣ IPs allowed to bypass CAPTCHA
  const allowedIPs = [
    '127.0.0.1',        // local dev
    '::1',       // IPv6 localhost
    '103.246.170.213',     // example
  ]

  // 3️⃣ If IP allowed → bypass the auth image requirement
  if (allowedIPs.includes(ip)) {

    return <>{children}</>

  }

  // 4️⃣ Otherwise continue with normal logic
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
