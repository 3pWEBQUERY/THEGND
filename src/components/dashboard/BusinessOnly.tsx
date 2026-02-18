"use client"

import { ReactNode } from 'react'

type Props = {
  isBusiness: boolean
  fallbackMessage: string
  children: ReactNode
}

export default function BusinessOnly({ isBusiness, fallbackMessage, children }: Props) {
  if (isBusiness) return <>{children}</>
  return (
    <div className="p-8 bg-white border border-gray-200 text-sm text-gray-700">{fallbackMessage}</div>
  )
}
