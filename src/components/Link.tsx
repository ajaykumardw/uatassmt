'use client'

// React Imports
import React, { forwardRef } from 'react'
import type { ComponentProps, MouseEvent } from 'react'

// Next Imports
import NextLink from 'next/link'

type Props = Omit<ComponentProps<typeof NextLink>, 'href' | 'onClick'> & {
  href?: string
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
}

const Link = forwardRef<HTMLAnchorElement, Props>((props, ref) => {
  // Props
  const { href, onClick, ...rest } = props

  return (
    <NextLink
      ref={ref}
      {...rest}
      href={href || '/'}
      onClick={onClick ? e => onClick(e) : !href ? e => e.preventDefault() : undefined}
    />
  )
})

Link.displayName = 'Link'

export default Link
