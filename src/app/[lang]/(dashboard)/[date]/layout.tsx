import type { ChildrenType } from '@core/types'

import type { Locale } from '@configs/i18n'

import SecurePageGuard from '@/hocs/securePageGuard'

const Layout = ({ children, params }: ChildrenType & { params: { lang: Locale, date: string } }) => {

  return (
    <SecurePageGuard locale={params.lang} date={params.date}>
      {children}
    </SecurePageGuard>
  )
}

export default Layout;
