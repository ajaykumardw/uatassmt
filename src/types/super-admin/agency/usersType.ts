// Type Imports
import type { role } from '@prisma/client'

import type { ThemeColor } from '@core/types'

export type UsersType = {
  id: number
  email: string
  user_name: string
  password: string
  status: number | string
  avatar: string
  company_name: string
  user_type: string
  first_name: string
  last_name: string
  gender: string
  date_of_birth: string

  // contact: string
  fullName: string
  currentPlan: string
  avatarColor?: ThemeColor
  billing: string
  batch_id: number,
  urn_no: number,
  mobile_no: string,
  landline_no: number,
  application_no: number,
  zone: string,
  country_id: number
  state_id: number,
  city_id: number,

  pin_code: number,

  // location: string,
  address: string,
  time_zone: string,
  course_status: string,
  expiry_date: string,
  is_master: string,
  master_id: number,
  role_id: number,
  role: role,
  created_by: number,
  is_deleted: string,
  device_id: number,
  deactive_date: string,
  modified_on: string,
  created_on: string
}
