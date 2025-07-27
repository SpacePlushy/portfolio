'use client'

import { createContext, useContext, useMemo } from 'react'

export type PortfolioVariant = 'general' | 'swe' | 'csr'

interface PortfolioVariantContextType {
  variant: PortfolioVariant
  isLoading: boolean
}

const PortfolioVariantContext = createContext<PortfolioVariantContextType>({
  variant: 'general',
  isLoading: true,
})

export function PortfolioVariantProvider({
  children,
  variant,
}: {
  children: React.ReactNode
  variant: PortfolioVariant
}) {
  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    variant,
    isLoading: false,
  }), [variant])

  return (
    <PortfolioVariantContext.Provider value={contextValue}>
      {children}
    </PortfolioVariantContext.Provider>
  )
}

export function usePortfolioVariant() {
  const context = useContext(PortfolioVariantContext)
  if (context === undefined) {
    throw new Error('usePortfolioVariant must be used within a PortfolioVariantProvider')
  }
  return context.variant
}

export function usePortfolioContext() {
  const context = useContext(PortfolioVariantContext)
  if (context === undefined) {
    throw new Error('usePortfolioContext must be used within a PortfolioVariantProvider')
  }
  return context
}