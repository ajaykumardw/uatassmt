import { getServerSession } from 'next-auth'

// Type Imports
import type { Locale } from '@configs/i18n'
import type { ChildrenType } from '@core/types'

// Component Imports
import ImageRedirect from '@/components/ImageRedirect'
import { authOptions } from '@/libs/auth'
import prisma from '@/libs/prisma'

export default async function ImageGuard({ children, locale }: ChildrenType & { locale: Locale }) {
  // Get the current session
  const session = await getServerSession(authOptions)

  // If no session exists or session data is incomplete, redirect or show an error
  if (!session?.user?.id || !session?.user?.sessionId) {
    console.log("Session is missing user id or session id, redirecting...");
    return <ImageRedirect lang={locale} />
  }

  // Retrieve the student log from the database, checking for authentication image
  const studentLog = await prisma.log_sessions.findFirst({
    where: {
      user_id: Number(session.user.id),
      unique_session_id: session.user.sessionId,
    },
    select: {
      id: true,
      auth_image: true,
    },
  })

  // If the student log doesn't exist or no auth image is present, show the redirect
  if (!studentLog || !studentLog.auth_image) {
    console.log("No student log or auth image missing, redirecting...");
    // return <ImageRedirect lang={locale} />
    return <ImageRedirect lang={locale} />
  }

  // Otherwise, render the children components
  return <>{children}</>
}
