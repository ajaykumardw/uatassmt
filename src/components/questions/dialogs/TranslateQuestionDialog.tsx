'use client'

import { useEffect, useState } from 'react'

import Grid from '@mui/material/Grid'
import Dialog from '@mui/material/Dialog'
import Button from '@mui/material/Button'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import MenuItem from '@mui/material/MenuItem'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import { toast } from 'react-toastify'

import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'

type LanguageOption = {
  id: number
  alias: string
  full_name: string
  short_name: string
}

type LangTranslation = {
  language_id: number
  language_name: string
  question: string
  option1: string
  option2: string
  option3: string
  option4: string
  option5: string
  question_explanation: string
}

type TranslateQuestionDialogProps = {
  open: boolean
  questionId: number
  questionData: {
    question: string
    option1: string
    option2: string
    option3: string | null
    option4: string | null
    option5: string | null
    question_explanation: string | null
  }
  handleClose: () => void
}

const emptyTranslation = (): LangTranslation => ({
  language_id: 0, language_name: '', question: '', option1: '', option2: '',
  option3: '', option4: '', option5: '', question_explanation: ''
})

const TranslateQuestionDialog = ({ open, questionId, questionData, handleClose }: TranslateQuestionDialogProps) => {
  const [languages, setLanguages] = useState<LanguageOption[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [translations, setTranslations] = useState<LangTranslation[]>([])
  const [translationsCache, setTranslationsCache] = useState<Map<number, LangTranslation>>(new Map())
  const [savedVersions, setSavedVersions] = useState<Map<number, LangTranslation>>(new Map())
  const [translating, setTranslating] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedIds([])
      setTranslations([])
      setTranslationsCache(new Map())
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/agency-languages`)
        .then(res => res.json())
        .then(data => {
          const result = data.data

          if (result) {
            const enabled = result.enabled_language_ids || []
            const available = (result.all_languages || []).filter((l: any) => enabled.includes(Number(l.id)))

            setLanguages(available)

            // Fetch existing translations for this question
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/question-translations?questionId=${questionId}`)
              .then(r => r.json())
              .then(tData => {
                const existing = tData.data || []

                if (existing.length > 0) {
                  const mapped = existing
                    .filter((t: any) => enabled.includes(Number(t.language_id)))
                    .map((t: any) => {
                      const lang = available.find((l: any) => Number(l.id) === Number(t.language_id))

                      return {
                        language_id: Number(t.language_id),
                        language_name: lang?.full_name || '',
                        question: t.question || '',
                        option1: t.option1 || '',
                        option2: t.option2 || '',
                        option3: t.option3 || '',
                        option4: t.option4 || '',
                        option5: t.option5 || '',
                        question_explanation: t.question_explanation || '',
                      }
                    })

                    setTranslations(mapped)
                  setSelectedIds(mapped.map((t: any) => t.language_id))
                  const cache = new Map<number, LangTranslation>()

                  mapped.forEach((t: any) => cache.set(t.language_id, t))
                  setTranslationsCache(cache)
                  setSavedVersions(cache)
                }
              })
              .catch(() => {})
          }
        })
        .catch(() => toast.error('Failed to load languages'))
    }
  }, [open, questionId])

  const handleSelectChange = (e: any) => {
    const ids = e.target.value as number[]

    setSelectedIds(ids)
    setTranslations(
      ids.map(id => {
        const cached = translationsCache.get(id)

        if (cached) return cached

        return {
          ...emptyTranslation(),
          language_id: Number(id),
          language_name: languages.find(l => Number(l.id) === id)?.full_name || ''
        }
      })
    )
  }

  const updateTranslation = (langId: number, field: string, value: string) => {
    setTranslations(prev =>
      prev.map(t =>
        Number(t.language_id) === langId ? { ...t, [field]: value } : t
      )
    )
  }

  const handleAutoTranslate = async () => {
    if (selectedIds.length === 0) {
      toast.error('Select at least one language')

      return
    }

    setTranslating(true)
    const texts = [questionData.question, questionData.option1, questionData.option2, questionData.option3 || '', questionData.option4 || '', questionData.option5 || '', questionData.question_explanation || '']
    const results: LangTranslation[] = []

    for (const id of selectedIds) {
      const lang = languages.find(l => Number(l.id) === id)

      if (!lang?.alias) continue

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/translate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: texts, target_lang: lang.alias })
        })

        if (!res.ok) continue
        const result = await res.json()
        const t = result.data.translatedTexts || result.translatedTexts || []

        if (t.length >= 7) {
          results.push({
            language_id: Number(lang.id),
            language_name: lang.full_name,
            question: t[0], option1: t[1], option2: t[2],
            option3: t[3], option4: t[4], option5: t[5],
            question_explanation: t[6],
          })
        }
      } catch { /* skip */ }
    }

    setTranslations(results)

    // Also update cache so re-selecting keeps translations
    setTranslationsCache(prev => {
      const next = new Map(prev)

      results.forEach(t => next.set(t.language_id, t))

      return next
    })

    if (results.length > 0) {
      toast.success(`Translated ${results.length} language(s)!`)
    } else {
      toast.error('Translation failed')
    }

    setTranslating(false)
  }

  const handleSaveAll = async () => {
    if (translations.length === 0) {
      toast.error('Nothing to save')

      return
    }

    setSaving(true)
    let count = 0

    for (const t of translations) {
      if (!t.question.trim()) continue // skip empty (reset) translations

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/question-translations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question_id: questionId,
            language_id: t.language_id,
            question: t.question,
            option1: t.option1,
            option2: t.option2,
            option3: t.option3 || null,
            option4: t.option4 || null,
            option5: t.option5 || null,
            question_explanation: t.question_explanation || null,
          })
        })

        if (res.ok) count++
      } catch { /* skip */ }
    }

    setSaving(false)

    if (count > 0) {
      // Update cache with saved values
      setTranslationsCache(prev => {
        const next = new Map(prev)

        translations.forEach(t => next.set(t.language_id, t))

        return next
      })
      setSavedVersions(prev => {
        const next = new Map(prev)

        translations.forEach(t => next.set(t.language_id, t))

        return next
      })
      toast.success(`Saved ${count} language(s)!`)
      handleClose()
    } else {
      toast.error('Save failed')
    }
  }

  return (
    <Dialog
      fullWidth
      open={open}
      onClose={handleClose}
      maxWidth='md'
      scroll='body'
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={handleClose} disableRipple>
        <i className='tabler-x' />
      </DialogCloseButton>
      <DialogTitle variant='h4' className='flex gap-2 flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
        Translate Question #{questionId}
      </DialogTitle>
      <DialogContent className='overflow-visible pbs-0 sm:pli-16'>
        <Grid container spacing={5}>
          <Grid item xs={12}>
            <Typography variant='subtitle2' color='text.secondary' className='mbe-2'>
              Original (English):
            </Typography>
            <Typography variant='body2' color='text.primary' className='mbe-4 p-2 bg-actionHover rounded'>
              <strong>Q:</strong> {questionData.question}<br />
              <strong>1:</strong> {questionData.option1} &nbsp; <strong>2:</strong> {questionData.option2}
              {questionData.option3 && <> &nbsp; <strong>3:</strong> {questionData.option3}</>}
              {questionData.option4 && <> &nbsp; <strong>4:</strong> {questionData.option4}</>}
              {questionData.option5 && <> &nbsp; <strong>5:</strong> {questionData.option5}</>}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={8}>
            <CustomTextField
              fullWidth
              select
              SelectProps={{ multiple: true, renderValue: (selected: any) => (
                <div className='flex flex-wrap gap-1'>
                  {(selected as number[]).map(id => {
                    const lang = languages.find(l => Number(l.id) === id)

                    return <Chip key={id} label={lang?.full_name || id} size='small' />
                  })}
                </div>
              )}}
              label='Select Languages'
              value={selectedIds}
              onChange={handleSelectChange}
            >
              {languages.map(lang => (
                <MenuItem key={Number(lang.id)} value={Number(lang.id)}>
                  {lang.full_name} ({lang.alias})
                </MenuItem>
              ))}
            </CustomTextField>
          </Grid>
          <Grid item xs={12} sm={4} className='flex items-end'>
            <Button
              fullWidth
              variant='outlined'
              onClick={handleAutoTranslate}
              disabled={translating || selectedIds.length === 0}
              startIcon={translating ? <CircularProgress size={16} /> : <i className='tabler-language' />}
            >
              {translating ? 'Translating...' : 'Auto Translate'}
            </Button>
          </Grid>

          {translations.map((t) => (
            <Grid item xs={12} key={t.language_id}>
              <div className='flex items-center justify-between mbe-2 p-1 border-b'>
                <Typography variant='h6' color='primary'>
                  {t.language_name}
                </Typography>
                <Button
                  size='small'
                  color='error'
                  variant='text'
                  onClick={() => {
                    const saved = savedVersions.get(t.language_id)

                    if (saved) {
                      updateTranslation(t.language_id, 'question', saved.question || '')
                      updateTranslation(t.language_id, 'option1', saved.option1 || '')
                      updateTranslation(t.language_id, 'option2', saved.option2 || '')
                      updateTranslation(t.language_id, 'option3', saved.option3 || '')
                      updateTranslation(t.language_id, 'option4', saved.option4 || '')
                      updateTranslation(t.language_id, 'option5', saved.option5 || '')
                      updateTranslation(t.language_id, 'question_explanation', saved.question_explanation || '')
                    } else {
                      updateTranslation(t.language_id, 'question', questionData.question)
                      updateTranslation(t.language_id, 'option1', questionData.option1)
                      updateTranslation(t.language_id, 'option2', questionData.option2)
                      updateTranslation(t.language_id, 'option3', questionData.option3 || '')
                      updateTranslation(t.language_id, 'option4', questionData.option4 || '')
                      updateTranslation(t.language_id, 'option5', questionData.option5 || '')
                      updateTranslation(t.language_id, 'question_explanation', questionData.question_explanation || '')
                    }
                  }}
                  startIcon={<i className='tabler-refresh' />}
                >
                  Reset
                </Button>
              </div>
              <Grid container spacing={4}>
                <Grid item xs={12}>
                  <CustomTextField
                    multiline fullWidth label='Question'
                    value={t.question}
                    onChange={e => updateTranslation(t.language_id, 'question', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomTextField fullWidth label='Option 1' value={t.option1} onChange={e => updateTranslation(t.language_id, 'option1', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomTextField fullWidth label='Option 2' value={t.option2} onChange={e => updateTranslation(t.language_id, 'option2', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomTextField fullWidth label='Option 3' value={t.option3} onChange={e => updateTranslation(t.language_id, 'option3', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomTextField fullWidth label='Option 4' value={t.option4} onChange={e => updateTranslation(t.language_id, 'option4', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomTextField fullWidth label='Option 5' value={t.option5} onChange={e => updateTranslation(t.language_id, 'option5', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomTextField multiline fullWidth label='Question Explanation' value={t.question_explanation} onChange={e => updateTranslation(t.language_id, 'question_explanation', e.target.value)} />
                </Grid>
              </Grid>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      {translations.length > 0 && (
        <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16 flex gap-4'>
          <Button variant='contained' onClick={handleSaveAll} disabled={saving} startIcon={saving ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-device-floppy' />}>
            {saving ? 'Saving...' : `Save All (${translations.length})`}
          </Button>
          <Button variant='tonal' color='secondary' onClick={handleClose}>Cancel</Button>
        </DialogActions>
      )}
    </Dialog>
  )
}

export default TranslateQuestionDialog
