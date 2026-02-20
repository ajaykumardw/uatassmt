'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export const useShadowAuth = () => {
  const router = useRouter()
  const { update, data: session } = useSession()

  const startShadow = async (userId: number) => {
    try {
      console.time('shadow start')

      await update({
        shadowUserId: userId
      })

      console.timeEnd('shadow start')

      router.replace('/dashboard')
    } catch (error) {
      console.error('Shadow start failed:', error)
    }
  }

  const stopShadow = async () => {
    try {
      console.time('shadow stop')

      await update({
        stopShadow: true
      })

      console.timeEnd('shadow stop')

      router.replace('/dashboard')
    } catch (error) {
      console.error('Shadow stop failed:', error)
    }
  }

  return {
    startShadow,
    stopShadow,
    isShadow: session?.user?.is_shadow ?? false,
    shadowUser: session?.user
  }
}
