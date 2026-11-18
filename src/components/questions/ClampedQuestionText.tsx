'use client'

import { useEffect, useRef, useState } from 'react'

import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

type Props = {
  text: string
  className?: string
  lines?: 1 | 2 | 3
  variant?: 'body1' | 'body2'
  color?: 'primary' | 'secondary'
}

const clampClasses: Record<number, string> = {
  1: 'line-clamp-1',
  2: 'line-clamp-2',
  3: 'line-clamp-3'
}

const ClampedQuestionText = ({
  text,
  className = '',
  lines = 2,
  variant = 'body1',
  color = 'primary'
}: Props) => {
  const textRef = useRef<HTMLElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [canToggle, setCanToggle] = useState(false)

  useEffect(() => {
    const element = textRef.current

    if (!element || expanded) return

    setCanToggle(element.scrollHeight > element.clientHeight + 1)
  }, [text, expanded, lines])

  useEffect(() => {
    setExpanded(false)
  }, [text])

  return (
    <div className='flex flex-col items-start'>
      <Typography
        ref={textRef}
        variant={variant}
        color={color === 'secondary' ? 'text.secondary' : 'text.primary'}
        className={`text-wrap ${expanded ? '' : clampClasses[lines]} ${className}`}
      >
        {text}
      </Typography>
      {canToggle && (
        <Button
          size='small'
          variant='text'
          className='p-0 min-w-0 normal-case'
          onClick={() => setExpanded(prev => !prev)}
        >
          {expanded ? 'Show less' : 'Show more'}
        </Button>
      )}
    </div>
  )
}

export default ClampedQuestionText
