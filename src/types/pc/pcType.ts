import type { NOSType } from "../nos/nosType"
import type { QuestionsType } from "../questions/questionsType"

export type PCType = {
  id: number
  agency_id: number
  nos_id: number
  nos: NOSType
  pc_id: string
  pc_name: string
  theory_marks: number
  practical_marks: number
  viva_marks: number
  project_marks?: number
  total_marks: number
  status: number
  created_by: number
  created_at?: string
  updated_at?: string
  deleted_at?: string

  questions: QuestionsType[]
}
