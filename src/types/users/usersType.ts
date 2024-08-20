// Type Imports
// import type { ThemeColor } from '@core/types'

import type { role, users, users_additional_data } from '@prisma/client'

export type UsersType = users & {
  role: role,
  user_additional_data: users_additional_data
}
