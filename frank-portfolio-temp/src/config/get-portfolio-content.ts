import { PortfolioContent, portfolioContent } from './portfolio-content'
import { PortfolioVariant } from '@/contexts/portfolio-variant-context'

// For now, use the existing portfolio content until we split files
export function getPortfolioContent(variant: PortfolioVariant): PortfolioContent {
  return portfolioContent[variant]
}

// For server-side usage
export function getPortfolioContentSync(variant: PortfolioVariant): PortfolioContent {
  return portfolioContent[variant]
}