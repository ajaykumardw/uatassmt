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
  const studentImage = session;

  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students/auth-image?studentId=${session?.user.id}`);

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


  // if (!res.ok) {
  //   throw new Error('Failed to fetch userData')
  // }
  // const resData = await res.json();

  console.log("student image fetch api:", studentLog);

  console.log("student image from Guard:", studentImage);

  return <>{studentLog && studentLog.auth_image ? children : <ImageRedirect lang={locale} />}</>
}
