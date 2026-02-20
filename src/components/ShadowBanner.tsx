'use client'

import { Alert, Button } from '@mui/material'

import { useShadowAuth } from '@/hooks/useShadowAuth'

export default function ShadowBanner() {
  const { isShadow, stopShadow, shadowUser } = useShadowAuth()

  if (!isShadow) return null

  return (
    <Alert
      severity='error'
      action={
        <Button
          onClick={stopShadow}
          size='small'
          variant='contained'
          color='error'
        >
          Exit Shadow
        </Button>
      }
      variant='outlined'
      className='mb-6'
    >
      You are shadow logged in as{' '}
        <strong>{shadowUser?.name}</strong>
    </Alert>
  )
}
