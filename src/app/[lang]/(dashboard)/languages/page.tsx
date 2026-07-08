'use client'

import { useEffect, useState } from 'react'

import LanguagesList from '@/views/agency/languages/list'

const LanguagesPage = () => {
  const [data, setData] = useState<{ all_languages: any[]; enabled_language_ids: number[] }>({ all_languages: [], enabled_language_ids: [] })

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/agency-languages`)
      .then(res => res.json())
      .then(res => setData(res.data || { all_languages: [], enabled_language_ids: [] }))
      .catch(() => {})
  }, [])

  return <LanguagesList data={data} updateData={setData} />
}

export default LanguagesPage
