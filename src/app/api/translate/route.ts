import { NextResponse } from 'next/server'

const LANG_MAP: Record<string, string> = {
  hindi: 'hi',
  gujarati: 'gu',
  marathi: 'mr',
  tamil: 'ta',
  telugu: 'te',
  bengali: 'bn',
  punjabi: 'pa',
  odia: 'or',
  urdu: 'ur',
  kannada: 'kn',
  malayalam: 'ml',
  assamese: 'as',
  english: 'en',
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const text = body.text
    const targetLang = body.target_language || body.target_lang || ''

    if (!text || !targetLang) {
      return NextResponse.json({
        status: 'Error',
        statusCode: 400,
        message: 'text and target_language are required'
      }, { status: 400 })
    }

    const lower = targetLang.toLowerCase()
    const langCode = LANG_MAP[lower] || lower

    const texts = Array.isArray(text) ? text : [text]

    const translatedTexts = await Promise.all(
      texts.map(async (t: any) => {
        if (!t || !String(t).trim()) return ''
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${langCode}&dt=t&q=${encodeURIComponent(String(t))}`
        const res = await fetch(url)
        const data = await res.json()

        return data?.[0]?.map((item: any) => item[0]).join('') || String(t)
      })
    )

    return NextResponse.json({
      status: 'Success',
      statusCode: 200,
      data: { translatedTexts }
    })
  } catch (error) {
    console.error('Translation error:', error)

    return NextResponse.json({
      status: 'Error',
      statusCode: 500,
      message: 'Translation failed'
    }, { status: 500 })
  }
}
