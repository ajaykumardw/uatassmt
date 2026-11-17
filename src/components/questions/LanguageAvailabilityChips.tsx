import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'

type AgencyLanguage = {
  id: number
  alias?: string
  full_name: string
  short_name: string
}

type Props = {
  translations?: { language_id: number }[]
  languageMap: Record<number, AgencyLanguage>
  questionId?: number
  selectedLanguageId?: number
  onLanguageClick?: (questionId: number, languageId: number) => void
}

const LanguageAvailabilityChips = ({
  translations,
  languageMap,
  questionId,
  selectedLanguageId,
  onLanguageClick
}: Props) => {
  const translatedIds = (translations || []).map(t => Number(t.language_id))

  const uniqueIds = Array.from(new Set(translatedIds))

  const otherIds = uniqueIds.filter(id => id !== 1)

  const handleLanguageClick = (languageId: number) => {
    if (questionId === undefined || !onLanguageClick) return

    onLanguageClick(questionId, languageId)
  }

  return (
    <div className='flex flex-wrap gap-1'>
      <Tooltip title={selectedLanguageId ? 'Show English only' : 'English'}>
        <Chip
          label='EN'
          size='small'
          variant='tonal'
          color='primary'
          className={onLanguageClick ? 'cursor-pointer' : undefined}
          onClick={onLanguageClick ? () => handleLanguageClick(1) : undefined}
        />
      </Tooltip>
      {otherIds.map(id => {
        const lang = languageMap[id]

        if (!lang) {
          return null
        }

        const isSelected = Number(selectedLanguageId) === id
        const languageName = lang.full_name || lang.short_name || `Language ${id}`

        return (
          <Tooltip
            key={id}
            title={isSelected ? `Hide ${languageName} translation` : `Show ${languageName} translation`}
          >
            <Chip
              label={lang.short_name || lang.full_name}
              size='small'
              variant={isSelected ? 'filled' : 'tonal'}
              color='info'
              className={onLanguageClick ? 'cursor-pointer' : undefined}
              onClick={onLanguageClick ? () => handleLanguageClick(id) : undefined}
            />
          </Tooltip>
        )
      })}
    </div>
  )
}

export default LanguageAvailabilityChips
