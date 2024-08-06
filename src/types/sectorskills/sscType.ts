// Type Imports
import type { ThemeColor } from '@core/types'
import type { QPType } from '../qualification-pack/qpType'
import type { NOSType } from '../nos/nosType'

export type SSCType = {
  id: number
  fullName: string
  ssc_name: string
  ssc_code: string
  ssc_username: string
  password: string
  status: number
  avatar: string
  avatarColor?: ThemeColor
  created_by: number,
  deleted_at: string,
  created_at: string
  updated_at: string,
  qualification_packs: QPType[]
  nos: NOSType[]
}
