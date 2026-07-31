// Type Imports
import type { ThemeColor } from '@core/types'
import type { QPType } from '../qualification-pack/qpType'
import type { NOSType } from '../nos/nosType'
import type { UsersType } from '../users/usersType'

export type SSCType = {
  id: number
  fullName: string
  ssc_name: string
  ssc_code: string
  ssc_username: string
  ssc_image: string
  password: string
  status: number
  avatar: string
  avatarColor?: ThemeColor
  created_by: number,
  deleted_at: string,
  created_at: string
  updated_at: string,
  sector?: string,
  sub_sector?: string,
  qualification_packs: QPType[]
  nos: NOSType[]
  agency: UsersType
}
