// Type Imports
// import type { ThemeColor } from '@core/types'

import type { role, users } from '@prisma/client'

export type UsersType = users & {
  role: role
}
