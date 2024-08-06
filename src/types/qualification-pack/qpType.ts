// Type Imports

import type { NOSType } from "../nos/nosType"
import type { SSCType } from "../sectorskills/sscType"

export type QPType = {
  id: number
  ssc_id: number
  ssc: SSCType,
  qualification_pack_id: string
  qualification_pack_name: string
  nqr_code: string
  nsqf_level: string
  version_id: number
  total_marks: number
  total_theory_marks: number
  total_viva_marks: number
  total_practical_marks: number
  isTheoryCutoffAvailable?: boolean
  isVivaCutoffAvailable?: boolean
  isPracticalCutoffAvailable?: boolean
  isOverallCutoffAvailable?: boolean
  theory_cutoff_marks?: number
  viva_cutoff_marks?: number
  practical_cutoff_marks?: number
  overall_cutoff_marks?: number
  nos_cutoff_marks?: number
  weighted_available?: number
  status: number
  created_by: number
  created_at?: string
  updated_at?: string
  deleted_at?: string
  nos: NOSType[]
}
