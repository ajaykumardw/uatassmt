'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { QuestionTranslationType } from '@/types/questions/questionsType'

export type QuestionTranslationPreviewEntry = {
  languageId: number
  loading: boolean
  error?: string
  data?: QuestionTranslationType
}

type PreviewEntries = Record<number, QuestionTranslationPreviewEntry>

const useQuestionTranslationPreview = () => {
  const [translationPreview, setTranslationPreview] = useState<PreviewEntries>({})
  const entriesRef = useRef<PreviewEntries>({})

  useEffect(() => {
    entriesRef.current = translationPreview
  }, [translationPreview])

  const fetchTranslation = useCallback(async (questionId: number, languageId: number) => {
    const normalizedQuestionId = Number(questionId)
    const normalizedLanguageId = Number(languageId)

    setTranslationPreview(prev => ({
      ...prev,
      [normalizedQuestionId]: { languageId: normalizedLanguageId, loading: true }
    }))

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/question-translations?questionId=${normalizedQuestionId}&languageId=${normalizedLanguageId}`
      )

      if (!res.ok) throw new Error('Failed to load translation')

      const result = await res.json()
      const data = result.data as QuestionTranslationType | null

      setTranslationPreview(prev => {
        if (prev[normalizedQuestionId]?.languageId !== normalizedLanguageId) {
          return prev
        }

        return {
          ...prev,
          [normalizedQuestionId]: {
            languageId: normalizedLanguageId,
            loading: false,
            data: data || undefined
          }
        }
      })
    } catch (error) {
      setTranslationPreview(prev => {
        if (prev[normalizedQuestionId]?.languageId !== normalizedLanguageId) {
          return prev
        }

        return {
          ...prev,
          [normalizedQuestionId]: {
            languageId: normalizedLanguageId,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to load translation'
          }
        }
      })
    }
  }, [])

  const toggleLanguage = useCallback((questionId: number, languageId: number) => {
    const normalizedQuestionId = Number(questionId)
    const normalizedLanguageId = Number(languageId)
    const currentLanguageId = entriesRef.current[normalizedQuestionId]?.languageId

    if (normalizedLanguageId === 1 || currentLanguageId === normalizedLanguageId) {
      setTranslationPreview(prev => {
        const next = { ...prev }

        delete next[normalizedQuestionId]

        return next
      })

      return
    }

    void fetchTranslation(normalizedQuestionId, normalizedLanguageId)
  }, [fetchTranslation])

  const revealTranslations = useCallback((questionIds: number | number[], languageIds: number[]) => {
    const ids = Array.isArray(questionIds) ? questionIds : [questionIds]
    const languageId = languageIds.map(Number).find(id => id !== 1)

    if (!languageId) return

    ids.forEach(questionId => {
      void fetchTranslation(Number(questionId), languageId)
    })
  }, [fetchTranslation])

  return { translationPreview, toggleLanguage, revealTranslations }
}

export default useQuestionTranslationPreview
