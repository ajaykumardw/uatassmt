import Typography from '@mui/material/Typography'

import type { QuestionTranslationPreviewEntry } from '@/hooks/useQuestionTranslationPreview'

type TranslationField =
  | 'question'
  | 'option1'
  | 'option2'
  | 'option3'
  | 'option4'
  | 'option5'
  | 'question_explanation'

type Language = {
  full_name: string
  short_name: string
}

type Props = {
  entry?: QuestionTranslationPreviewEntry
  field: TranslationField
  languageMap: Record<number, Language>
  showLanguageLabel?: boolean
}

const TranslatedQuestionPreview = ({ entry, field, languageMap, showLanguageLabel = false }: Props) => {
  if (!entry) {
    return null
  }

  if (entry.loading) {
    return showLanguageLabel ? (
      <Typography variant='caption' color='text.secondary' className='mts-1'>
        Loading translation...
      </Typography>
    ) : null
  }

  if (entry.error) {
    return showLanguageLabel ? (
      <Typography variant='caption' color='error' className='mts-1'>
        {entry.error}
      </Typography>
    ) : null
  }

  const value = entry.data?.[field]?.trim()

  if (!value) {
    return null
  }

  const language = languageMap[entry.languageId]

  return (
    <div className='flex flex-col gap-0.5 mts-1'>
      {showLanguageLabel && (
        <Typography variant='caption' className='font-semibold text-textSecondary'>
          {language?.full_name || language?.short_name || `Language ${entry.languageId}`}
        </Typography>
      )}
      <Typography variant='body2' color='text.secondary' className='whitespace-pre-wrap'>
        {value}
      </Typography>
    </div>
  )
}

export default TranslatedQuestionPreview
