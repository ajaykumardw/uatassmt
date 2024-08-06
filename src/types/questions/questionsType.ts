import type { PCType } from "../pc/pcType"

export type QuestionsType = {
  id: number
  agency_id: number
  question_level: string
  question_type: string
  question: string
  option1: string
  option2: string
  option3: string
  option4: string
  option5: string
  answer: number
  marks: number
  question_explanation: string
  status: number
  created_by: number
  created_at?: string
  updated_at?: string
  deleted_at?: string
  pc: PCType[]
}
