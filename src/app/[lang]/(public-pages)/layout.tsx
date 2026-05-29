
// MUI Imports
import Button from '@mui/material/Button'

// Type Imports
import type { Locale } from '@configs/i18n'

// Config Imports
import { i18n } from '@configs/i18n'

// Component Imports
import Providers from '@components/Providers'
import BlankLayout from '@layouts/BlankLayout'


// Type Imports
import type { ChildrenType } from '@core/types'

// Context Imports
// import { IntersectionProvider } from '@/contexts/intersectionContext'

// Component Imports
import FrontLayout from '@components/layout/front-pages'
import ScrollToTop from '@core/components/scroll-to-top'

// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'

type Props = ChildrenType & {
  params: { lang: Locale }
}

export const metadata = {
  title: 'Skill Lens',
  description:
    'Skill Lens Portal'
}

const Layout = ({ children, params }: Props) => {
  // Vars
  const direction = i18n.langDirection[params.lang]
  const systemMode = getSystemMode()

  return (
    <Providers direction={direction}>
      <BlankLayout systemMode={systemMode}>
        <FrontLayout mode={systemMode}>
          {children}
          <ScrollToTop className='mui-fixed'>
            <Button
              variant='contained'
              className='is-10 bs-10 rounded-full p-0 min-is-0 flex items-center justify-center'
            >
              <i className='tabler-arrow-up' />
            </Button>
          </ScrollToTop>
        </FrontLayout>
      </BlankLayout>
    </Providers>

    // <IntersectionProvider>
    // </IntersectionProvider>
  )
}

export default Layout
