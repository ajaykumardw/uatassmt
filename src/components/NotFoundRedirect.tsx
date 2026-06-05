'use client'

// Next Imports
import { redirect } from 'next/navigation'

// Type Imports
import type { Locale } from '@configs/i18n'


const NotFoundRedirect = ({ lang }: { lang: Locale }) => {

  const login = `/${lang}/not-found`

  return redirect(login)
}

export default NotFoundRedirect
