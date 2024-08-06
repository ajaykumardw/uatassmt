import type { PCType } from "../pc/pcType"
import type { SSCType } from "../sectorskills/sscType"

export type NOSType = {
  id: number
  agency_id: number
  ssc_id: number
  ssc: SSCType,
  nos_id: string
  nos_name: string
  isTheoryCutoffAvailable?: boolean
  isVivaCutoffAvailable?: boolean
  isPracticalCutoffAvailable?: boolean
  isOverallCutoffAvailable?: boolean
  isWeightedAvailable?: boolean
  theory_cutoff_marks?: number
  viva_cutoff_marks?: number
  practical_cutoff_marks?: number
  overall_cutoff_marks?: number
  weighted_available?: number
  status: number
  created_by: number
  created_at?: string
  updated_at?: string
  deleted_at?: string

  pc: PCType[]
}
