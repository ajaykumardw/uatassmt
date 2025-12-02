// Third-party Imports
import { getServerSession } from 'next-auth'

import { headers } from 'next/headers'

// Type Imports
import type { Locale } from '@configs/i18n'
import type { ChildrenType } from '@core/types'

// Component Imports
import ImageRedirect from '@/components/ImageRedirect'
import { authOptions } from '@/libs/auth'
import prisma from '@/libs/prisma'

export default async function ImageGuard({ children, locale }: ChildrenType & { locale: Locale }) {
  const session = await getServerSession(authOptions)

  // Get client IP from headers
  let ip =
    headers().get('x-forwarded-for')?.split(',')[0] || // first IP in the chain
    headers().get('x-real-ip') ||                       // fallback
    '0.0.0.0'

  // Normalize localhost and IPv4-mapped IPv6
  if (ip === '::1') ip = '127.0.0.1'
  if (ip.startsWith('::ffff:')) ip = ip.split('::ffff:')[1]

  console.log("Client IP:", ip)

  // IP whitelist for bypass
  const excludeIps = [
    '127.0.0.1',       // localhost dev
    '103.246.170.213'  // example production IP
  ]

  if (excludeIps.includes(ip)) {

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
