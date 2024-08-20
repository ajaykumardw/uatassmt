// Third-party Imports

import { SpeedInsights } from '@vercel/speed-insights/next';

import 'react-perfect-scrollbar/dist/css/styles.css'

// Type Imports
import type { ChildrenType } from '@core/types'
import type { Locale } from '@configs/i18n'

// Component Imports

// Config Imports
import { i18n } from '@configs/i18n'

// Style Imports
import '@/app/globals.css'

// Generated Icon CSS Imports
import '@assets/iconify-icons/generated-icons.css'

// export const metadata = {
//   title: 'Vuexy - MUI Next.js Admin Dashboard Template',
//   description:
//     'Vuexy - MUI Next.js Admin Dashboard Template - is the most developer friendly & highly customizable Admin Dashboard Template based on MUI v5.'
// }

export const metadata = {
  title: "Assessment - Dream Weavers' LMS software",
  description:
    "Assessment - Dream Weavers' Next.js LMS Dashboard offers a highly customizable solution designed to streamline the management of learning management systems with an intuitive and flexible interface."
}

const RootLayout = ({ children, params }: ChildrenType & { params: { lang: Locale } }) => {
  // Vars
  const direction = i18n.langDirection[params.lang]

  return (
    <html id='__next' lang={params.lang} dir={direction}>
      <body className='flex is-full min-bs-full flex-auto flex-col'>
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}

export default RootLayout
