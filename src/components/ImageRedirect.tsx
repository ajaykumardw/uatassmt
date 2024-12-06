'use client'

// Next Imports
import { redirect } from 'next/navigation'

// Type Imports
import type { Locale } from '@configs/i18n'


const ImageRedirect = ({ lang }: { lang: Locale }) => {

  const login = `/${lang}/capture`

  return redirect(login)
}

export default ImageRedirect
