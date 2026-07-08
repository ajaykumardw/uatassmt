import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/libs/auth'

import prisma from '@/libs/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const questionId = searchParams.get('questionId') ? Number(searchParams.get('questionId')) : null
  const languageId = searchParams.get('languageId') ? Number(searchParams.get('languageId')) : null

  if (!questionId) {
    return NextResponse.json({
      status: 'Error', statusCode: 400, message: 'questionId is required'
    }, { status: 400 })
  }

  const where: any = { question_id: questionId }

  if (languageId) where.language_id = languageId

  const translations = await prisma.question_translations.findMany({
    where,
    select: {
      language_id: true,
      question: true,
      option1: true,
      option2: true,
      option3: true,
      option4: true,
      option5: true,
      question_explanation: true,
    }
  })

  return NextResponse.json({
    status: 'Success',
    statusCode: 200,
    data: languageId ? (translations[0] || null) : translations
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = Number(session?.user?.id)

  if (!userId) {
    return NextResponse.json({ status: 'Error', statusCode: 401, message: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { question_id, language_id, question, option1, option2, option3, option4, option5, question_explanation } = body

  if (!question_id || !language_id) {
    return NextResponse.json({
      status: 'Error', statusCode: 400, message: 'question_id and language_id are required'
    }, { status: 400 })
  }

  const existing = await prisma.question_translations.findUnique({
    where: {
      question_id_language_id: {
        question_id: Number(question_id),
        language_id: Number(language_id),
      }
    }
  })

  if (existing) {
    await prisma.question_translations.update({
      where: { id: existing.id },
      data: {
        question,
        option1: option1 ?? null,
        option2: option2 ?? null,
        option3: option3 ?? null,
        option4: option4 ?? null,
        option5: option5 ?? null,
        question_explanation: question_explanation ?? null,
      }
    })
  } else {
    await prisma.question_translations.create({
      data: {
        question_id: Number(question_id),
        language_id: Number(language_id),
        question,
        option1: option1 ?? null,
        option2: option2 ?? null,
        option3: option3 ?? null,
        option4: option4 ?? null,
        option5: option5 ?? null,
        question_explanation: question_explanation ?? null,
        created_by: userId,
      }
    })
  }

  return NextResponse.json({
    status: 'Success',
    statusCode: 200,
    message: 'Translation saved successfully'
  })
}
