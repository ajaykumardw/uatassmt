import type { Locale } from '@configs/i18n'


import 'react-perfect-scrollbar/dist/css/styles.css'

// Component Imports
import Providers from '@components/Providers'
import BlankLayout from '@layouts/BlankLayout'


// Style Imports
import '@/app/globals.css'


// Generated Icon CSS Imports
import '@assets/iconify-icons/generated-icons.css'

// Config Imports
import { i18n } from '@configs/i18n'

// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'

export const metadata = {
  title: 'CBIL Report',
  description: 'Get CBIL Report by filling the form and clicking the submit button. The report will be generated and downloaded as a PDF file.',
}

export default function RootLayout({
  children,
  params
}: {
  children: React.ReactNode,
  params: { lang: Locale }
}) {

  const direction = i18n.langDirection[params.lang]
  const systemMode = getSystemMode()

  return (
    <html id='__next' lang="en">
      <body className="flex is-full min-bs-full flex-auto flex-col">
        <Providers direction={direction}>
          <BlankLayout systemMode={systemMode}>{children}</BlankLayout>
        </Providers>
      </body>
    </html>
  )
}
