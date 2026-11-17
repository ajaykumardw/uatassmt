import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/libs/auth'

import prisma from '@/libs/prisma'

type BulkTranslation = {
  question_id: number
  language_id: number
  question: string
  option1?: string | null
  option2?: string | null
  option3?: string | null
  option4?: string | null
  option5?: string | null
  question_explanation?: string | null
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = Number(session?.user?.id)

  if (!userId) {
    return NextResponse.json({ status: 'Error', statusCode: 401, message: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const translations: BulkTranslation[] = Array.isArray(body.translations) ? body.translations : []

  if (translations.length === 0) {
    return NextResponse.json({
      status: 'Error', statusCode: 400, message: 'translations array is required'
    }, { status: 400 })
  }

  if (translations.length > 1000) {
    return NextResponse.json({
      status: 'Error', statusCode: 400, message: 'Maximum 1000 translations can be saved at once'
    }, { status: 400 })
  }

  const validTranslations = translations.filter(
    t => Number(t.question_id) > 0 && Number(t.language_id) > 0 && typeof t.question === 'string' && t.question.trim()
  )

  if (validTranslations.length === 0) {
    return NextResponse.json({
      status: 'Error', statusCode: 400, message: 'No valid translations found'
    }, { status: 400 })
  }

  const operations = validTranslations.map(t =>
    prisma.question_translations.upsert({
      where: {
        question_id_language_id: {
          question_id: Number(t.question_id),
          language_id: Number(t.language_id),
        }
      },
      update: {
        question: t.question,
        option1: t.option1 ?? null,
        option2: t.option2 ?? null,
        option3: t.option3 ?? null,
        option4: t.option4 ?? null,
        option5: t.option5 ?? null,
        question_explanation: t.question_explanation ?? null,
      },
      create: {
        question_id: Number(t.question_id),
        language_id: Number(t.language_id),
        question: t.question,
        option1: t.option1 ?? null,
        option2: t.option2 ?? null,
        option3: t.option3 ?? null,
        option4: t.option4 ?? null,
        option5: t.option5 ?? null,
        question_explanation: t.question_explanation ?? null,
        created_by: userId,
      }
    })
  )

  const saved = await prisma.$transaction(operations)

  return NextResponse.json({
    status: 'Success',
    statusCode: 200,
    message: `${saved.length} translation(s) saved successfully`,
    data: { saved: saved.length }
  })
}
