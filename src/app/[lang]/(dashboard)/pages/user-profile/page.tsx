import { redirect } from 'next/navigation'

import { getServerSession } from 'next-auth'

import type { Locale } from '@configs/i18n'

import { authOptions } from '@/libs/auth'
import { getLocalizedUrl } from '@/utils/i18n'
import { getProfileRoute } from '@/utils/getProfileRoute'

const ProfilePage = async ({ params }: { params: { lang: Locale } }) => {
  const session = await getServerSession(authOptions)
  const profileRoute = getProfileRoute(session?.user)

  redirect(getLocalizedUrl(profileRoute || '/dashboard', params.lang))
}

export default ProfilePage
