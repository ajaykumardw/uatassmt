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
}

const LanguageAvailabilityChips = ({ translations, languageMap }: Props) => {
  const translatedIds = (translations || []).map(t => Number(t.language_id))

  const uniqueIds = Array.from(new Set(translatedIds))

  const otherIds = uniqueIds.filter(id => id !== 1)

  return (
    <div className='flex flex-wrap gap-1'>
      <Tooltip title='English'>
        <Chip label='EN' size='small' variant='tonal' color='primary' />
      </Tooltip>
      {otherIds.map(id => {
        const lang = languageMap[id]

        if (!lang) {
          return null
        }

        return (
          <Tooltip key={id} title={lang.full_name || lang.short_name || `Language ${id}`}>
            <Chip label={lang.short_name || lang.full_name} size='small' variant='tonal' color='info' />
          </Tooltip>
        )
      })}
    </div>
  )
}

export default LanguageAvailabilityChips