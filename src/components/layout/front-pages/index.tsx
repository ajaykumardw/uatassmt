// Type Imports
import type { ChildrenType, SystemMode } from '@core/types'

// Component Imports
import Footer from '@components/layout/front-pages/Footer'
import Header from '@components/layout/front-pages/Header'

// Util Imports
import { frontLayoutClasses } from '@layouts/utils/layoutClasses'

const FrontLayout = ({ children, mode }: ChildrenType & { mode: SystemMode }) => {
  // Vars

  return (
    <div className={frontLayoutClasses.root}>
      <Header mode={mode} />
      {children}
      <Footer mode={mode} />
    </div>
  )
}

export default FrontLayout
