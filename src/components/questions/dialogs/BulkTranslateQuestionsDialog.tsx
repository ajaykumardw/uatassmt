'use client'

import { useEffect, useMemo, useState } from 'react'

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
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import LinearProgress from '@mui/material/LinearProgress'
import Alert from '@mui/material/Alert'
import { toast } from 'react-toastify'

import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'

type LanguageOption = {
  id: number
  alias: string
  full_name: string
  short_name: string
}

type BulkQuestion = {
  id: number
  question: string
  option1?: string | null
  option2?: string | null
  option3?: string | null
  option4?: string | null
  option5?: string | null
  question_explanation?: string | null
  translations?: {
    language_id: number
  }[]
}

type BulkTranslateQuestionsDialogProps = {
  open: boolean
  questions: BulkQuestion[]
  questionType?: string
  handleClose: () => void
  updateQuestionsList?: () => void
  onTranslated?: (questionIds: number[], languageIds: number[]) => void
}

type TranslationPayload = {
  question_id: number
  language_id: number
  question: string
  option1: string | null
  option2: string | null
  option3: string | null
  option4: string | null
  option5: string | null
  question_explanation: string | null
}

type TranslationSummary = {
  saved: number
  skipped: number
  failed: number
}

const CHUNK_SIZE = 10

const hasTranslation = (question: BulkQuestion, languageId: number, savedKeys: Set<string>) => {
  const existing = (question.translations || []).some(t => Number(t.language_id) === Number(languageId))

  return existing || savedKeys.has(`${question.id}:${languageId}`)
}

const BulkTranslateQuestionsDialog = ({
  open,
  questions,
  questionType,
  handleClose,
  updateQuestionsList,
  onTranslated
}: BulkTranslateQuestionsDialogProps) => {
  const [languages, setLanguages] = useState<LanguageOption[]>([])
  const [selectedLanguageIds, setSelectedLanguageIds] = useState<number[]>([])
  const [overwriteExisting, setOverwriteExisting] = useState(false)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [summary, setSummary] = useState<TranslationSummary | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())

  const isTheory = questionType === 'theory'

  useEffect(() => {
    if (!open) return

    let cancelled = false

    setSelectedLanguageIds([])
    setOverwriteExisting(false)
    setRunning(false)
    setProgress({ done: 0, total: 0 })
    setSummary(null)
    setErrors([])
    setSavedKeys(new Set())

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/agency-languages`)
      .then(res => res.json())
      .then(data => {
        if (cancelled) return

        const result = data.data

        if (!result) return

        const enabled = result.enabled_language_ids || []

        const available = (result.all_languages || [])
          .filter((l: any) => enabled.includes(Number(l.id)))
          .filter((l: any) => Number(l.id) !== 1)

        setLanguages(available)
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load languages')
      })

    return () => {
      cancelled = true
    }
  }, [open])

  const skippedCount = useMemo(() => {
    return questions.reduce((count, question) => {
      return count + selectedLanguageIds.filter(id => !overwriteExisting && hasTranslation(question, id, savedKeys)).length
    }, 0)
  }, [questions, selectedLanguageIds, overwriteExisting, savedKeys])

  const totalTargets = useMemo(() => {
    return questions.reduce((count, question) => {
      return count + selectedLanguageIds.filter(id => overwriteExisting || !hasTranslation(question, id, savedKeys)).length
    }, 0)
  }, [questions, selectedLanguageIds, overwriteExisting, savedKeys])

  const handleSelectAllLanguages = () => {
    if (selectedLanguageIds.length === languages.length) {
      setSelectedLanguageIds([])
    } else {
      setSelectedLanguageIds(languages.map(lang => Number(lang.id)))
    }
  }

  const getSourceTexts = (question: BulkQuestion) => {
    return isTheory
      ? [
          question.question || '',
          question.option1 || '',
          question.option2 || '',
          question.option3 || '',
          question.option4 || '',
          question.option5 || '',
          question.question_explanation || ''
        ]
      : [question.question || '']
  }

  const buildPayload = (question: BulkQuestion, languageId: number, texts: string[]): TranslationPayload => ({
    question_id: Number(question.id),
    language_id: Number(languageId),
    question: texts[0] || '',
    option1: isTheory ? texts[1] || null : null,
    option2: isTheory ? texts[2] || null : null,
    option3: isTheory ? texts[3] || null : null,
    option4: isTheory ? texts[4] || null : null,
    option5: isTheory ? texts[5] || null : null,
    question_explanation: isTheory ? texts[6] || null : null,
  })

  const handleTranslateAndSave = async () => {
    if (selectedLanguageIds.length === 0) {
      toast.error('Select at least one language')

      return
    }

    if (totalTargets === 0) {
      toast.info('Selected questions are already translated in these languages')

      return
    }

    setRunning(true)
    setSummary(null)
    setErrors([])
    setProgress({ done: 0, total: totalTargets })

    let saved = 0
    let failed = 0
    const errorMessages: string[] = []
    const newSavedKeys = new Set<string>()
    const savedQuestionIds = new Set<number>()
    const savedLanguageIds = new Set<number>()
    const selectedLanguages = languages.filter(lang => selectedLanguageIds.includes(Number(lang.id)))

    for (let start = 0; start < questions.length; start += CHUNK_SIZE) {
      const chunk = questions.slice(start, start + CHUNK_SIZE)
      let attempted = 0

      for (const language of selectedLanguages) {
        const candidates = chunk.filter(question => {
          return overwriteExisting || !hasTranslation(question, Number(language.id), savedKeys)
        })

        if (candidates.length === 0) continue

        attempted += candidates.length

        try {
          const sourceTexts = candidates.flatMap(getSourceTexts)

          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: sourceTexts, target_lang: language.alias })
          })

          if (!res.ok) throw new Error('Translation request failed')

          const result = await res.json()
          const translatedTexts: string[] = result.data?.translatedTexts || result.translatedTexts || []

          if (translatedTexts.length < sourceTexts.length) {
            throw new Error('Translation response was incomplete')
          }

          const fieldsPerQuestion = isTheory ? 7 : 1

          const payloads = candidates.map((question, index) => {
            const startIndex = index * fieldsPerQuestion

            return buildPayload(question, language.id, translatedTexts.slice(startIndex, startIndex + fieldsPerQuestion))
          })

          const saveRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/question-translations/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ translations: payloads })
          })

          if (!saveRes.ok) throw new Error('Save request failed')

          const saveResult = await saveRes.json()
          const savedCount = Number(saveResult.data?.saved ?? payloads.length)

          saved += savedCount
          failed += payloads.length - savedCount

          if (savedCount > 0) {
            savedLanguageIds.add(Number(language.id))
            payloads.forEach(payload => savedQuestionIds.add(Number(payload.question_id)))
          }

          if (savedCount === payloads.length) {
            payloads.forEach(payload => newSavedKeys.add(`${payload.question_id}:${payload.language_id}`))
          }
        } catch (error) {
          failed += candidates.length
          errorMessages.push(
            `${language.full_name}: ${error instanceof Error ? error.message : 'Translation failed'}`
          )
        }
      }

      setProgress(prev => ({ ...prev, done: Math.min(prev.done + attempted, totalTargets) }))
    }

    const finalSummary = { saved, skipped: skippedCount, failed }

    setSavedKeys(prev => new Set([...prev, ...newSavedKeys]))
    setSummary(finalSummary)
    setErrors(errorMessages.slice(0, 5))
    setRunning(false)

    if (saved > 0) {
      toast.success(`${saved} translation(s) saved`)
      updateQuestionsList?.()
      onTranslated?.(Array.from(savedQuestionIds), Array.from(savedLanguageIds))
    }

    if (failed > 0) {
      toast.error(`${failed} translation(s) failed`)
    }
  }

  return (
    <Dialog
      fullWidth
      open={open}
      onClose={running ? () => {} : handleClose}
      maxWidth='sm'
      scroll='body'
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      {!running && (
        <DialogCloseButton onClick={handleClose} disableRipple>
          <i className='tabler-x' />
        </DialogCloseButton>
      )}
      <DialogTitle variant='h4' className='flex gap-2 flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
        Bulk Translate Questions
      </DialogTitle>
      <DialogContent className='overflow-visible pbs-0 sm:pli-16'>
        <Grid container spacing={5}>
          <Grid item xs={12}>
            <div className='flex flex-wrap gap-2'>
              <Chip size='small' color='primary' variant='tonal' label={`${questions.length} question(s) selected`} />
              <Chip size='small' color='info' variant='tonal' label={`${selectedLanguageIds.length} language(s) selected`} />
            </div>
          </Grid>

          <Grid item xs={12}>
            <CustomTextField
              fullWidth
              select
              SelectProps={{
                multiple: true,
                renderValue: (selected: any) => (
                  <div className='flex flex-wrap gap-1'>
                    {(selected as number[]).map(id => {
                      const lang = languages.find(l => Number(l.id) === id)

                      return <Chip key={id} label={lang?.full_name || id} size='small' />
                    })}
                  </div>
                )
              }}
              label='Target Languages'
              value={selectedLanguageIds}
              onChange={(e: any) => setSelectedLanguageIds((e.target.value as number[]).map(Number))}
              disabled={running}
            >
              {languages.map(lang => (
                <MenuItem key={Number(lang.id)} value={Number(lang.id)}>
                  {lang.full_name} ({lang.alias})
                </MenuItem>
              ))}
            </CustomTextField>
          </Grid>

          <Grid item xs={12}>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <Button
                size='small'
                variant='text'
                onClick={handleSelectAllLanguages}
                disabled={running || languages.length === 0}
              >
                {selectedLanguageIds.length === languages.length && languages.length > 0 ? 'Clear languages' : 'Select all languages'}
              </Button>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={overwriteExisting}
                    onChange={e => setOverwriteExisting(e.target.checked)}
                    disabled={running}
                  />
                }
                label='Overwrite existing translations'
              />
            </div>
          </Grid>

          {selectedLanguageIds.length > 0 && (
            <Grid item xs={12}>
              <Typography variant='body2' color='text.secondary'>
                {totalTargets} translation(s) will be generated
                {skippedCount > 0 && !overwriteExisting ? `, ${skippedCount} existing translation(s) will be skipped` : ''}.
              </Typography>
            </Grid>
          )}

          {(running || progress.total > 0) && (
            <Grid item xs={12}>
              <LinearProgress
                variant='determinate'
                value={progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0}
              />
              <Typography variant='body2' color='text.secondary' className='mbs-2'>
                {progress.done} of {progress.total} completed
              </Typography>
            </Grid>
          )}

          {summary && (
            <Grid item xs={12}>
              <Alert severity={summary.failed > 0 ? 'warning' : 'success'}>
                Saved {summary.saved}, skipped {summary.skipped}, failed {summary.failed}.
              </Alert>
              {errors.length > 0 && (
                <Typography variant='caption' color='error' component='div' className='mbs-2'>
                  {errors.map((error, index) => <div key={index}>{error}</div>)}
                </Typography>
              )}
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16 flex gap-4'>
        <Button
          variant='contained'
          onClick={handleTranslateAndSave}
          disabled={running || selectedLanguageIds.length === 0 || totalTargets === 0}
          startIcon={running ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-language' />}
        >
          {running ? 'Translating...' : `Translate & Save (${totalTargets})`}
        </Button>
        <Button variant='tonal' color='secondary' onClick={handleClose} disabled={running}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default BulkTranslateQuestionsDialog
