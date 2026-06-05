// Third-party Imports

// Type Imports
import type { Locale } from '@configs/i18n'
import type { ChildrenType } from '@core/types'

// Component Imports
import NotFoundRedirect from '@/components/NotFoundRedirect'

// import prisma from '@/libs/prisma'

export const dynamic = "force-dynamic";

export default async function SecurePageGuard({ children, locale, date }: ChildrenType & { locale: Locale, date: string }) {

  const isToday = (dateStr: string) => {
    const today = new Date();

    const todayStr = `${String(today.getDate()).padStart(2, "0")}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${today.getFullYear()}`;

    return dateStr === todayStr;
  };

  return <>{ date && isToday(date) ? children : <NotFoundRedirect lang={locale} />}</>
}
