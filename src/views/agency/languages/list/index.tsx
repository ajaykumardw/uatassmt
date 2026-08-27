'use client'

import { useEffect, useState } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import { toast } from 'react-toastify'

type Language = {
  id: number
  alias: string
  full_name: string
  short_name: string
}

type Props = {
  data: { all_languages: Language[]; enabled_language_ids: number[] }
  updateData: (data: { all_languages: Language[]; enabled_language_ids: number[] }) => void
}

const ENGLISH_ID = 1

const LanguagesList = ({ data, updateData }: Props) => {
  const [selected, setSelected] = useState<number[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const ids = data.enabled_language_ids.map(Number)

    if (!ids.includes(ENGLISH_ID)) {
      ids.unshift(ENGLISH_ID)
    }

    setSelected(ids)
  }, [data.enabled_language_ids])

  const toggleLanguage = (id: number) => {
    if (id === ENGLISH_ID) return

    setSelected(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    )
  }

  const sortedLanguages = [...data.all_languages].sort((a, b) => {
    if (a.id === ENGLISH_ID) return -1
    if (b.id === ENGLISH_ID) return 1

    return a.full_name.localeCompare(b.full_name)
  })

  const handleSave = async () => {

    setSaving(true)

    try {
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agency-languages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language_ids: selected })
      })

      if (res.ok) {
        toast.success('Languages updated successfully!')
        updateData({ ...data, enabled_language_ids: selected })
      } else {
        toast.error('Failed to update languages')
      }
    } catch {
      toast.error('Failed to update languages')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title='Manage Languages'
            subheader='Enable or disable languages for your agency'
            action={
              <Button
                variant='contained'
                onClick={handleSave}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-device-floppy' />}
              >
                Save
              </Button>
            }
          />
          <CardContent>
            <Grid container spacing={2}>
              {sortedLanguages.map((lang) => {
                const isEnglish = lang.id === ENGLISH_ID

                return (
                  <Grid item xs={12} sm={6} md={4} key={lang.id}>
                    <div
                      className='flex items-center justify-between p-3 border rounded hover:bg-actionHover'
                      style={{
                        borderColor: selected.includes(Number(lang.id)) ? 'var(--mui-palette-primary-main)' : undefined,
                        backgroundColor: selected.includes(Number(lang.id)) ? 'var(--mui-palette-primary-lightOpacity)' : undefined
                      }}
                    >
                      <div>
                        <Typography variant='body1' className='font-medium'>
                          {lang.full_name}
                          {isEnglish && (
                            <Typography component='span' variant='caption' color='primary' sx={{ ml: 1 }}>
                              (Default)
                            </Typography>
                          )}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {lang.alias} ({lang.short_name})
                        </Typography>
                      </div>
                      <Switch
                        checked={selected.includes(Number(lang.id))}
                        onChange={() => toggleLanguage(Number(lang.id))}
                        disabled={isEnglish}
                      />
                    </div>
                  </Grid>
                )
              })}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default LanguagesList
