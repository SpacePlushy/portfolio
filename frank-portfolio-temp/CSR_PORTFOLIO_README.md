# Customer Service Representative Portfolio - Setup Complete! ✅

Your portfolio now supports subdomain-based content switching:
- **Main Portfolio** (Software Engineer): `palmisano.io`
- **Customer Service Representative (CSR) Portfolio**: `csr.palmisano.io`

## What Was Implemented

1. **Subdomain Detection**: Middleware detects whether you're visiting the main site or CSR subdomain
2. **Dynamic Content**: All components now display appropriate content based on the subdomain
3. **Customer Service Representative Content**: Extracted from your resume with all impressive metrics:
   - 99% Customer Satisfaction at Apple
   - 4.97-star rating (1,400+ deliveries)
   - Top 4% nationally at Apple
   - 16 Outstanding Customer Service Awards
   - And much more!

## Quick Local Testing

Run the setup script to configure local testing:
```bash
./scripts/setup-local-testing.sh
```

Then:
```bash
npm run dev
```

Visit:
- Main: http://palmisano.local:3000
- Customer Service Representative: http://csr.palmisano.local:3000

## Vercel Deployment

1. Deploy to Vercel (automatic with git push)
2. In Vercel Dashboard → Settings → Domains:
   - Add `palmisano.io`
   - Add `csr.palmisano.io`
3. Configure DNS at your provider:
   - A record for @ → 76.76.21.21
   - CNAME for csr → cname.vercel-dns.com

## Key Files Created/Modified

- `src/middleware.ts` - Subdomain detection
- `src/config/portfolio-content.ts` - All content for both variants
- `src/contexts/portfolio-variant-context.tsx` - React context for variant
- All component files updated to use dynamic content
- `docs/CSR_PORTFOLIO_SETUP.md` - Detailed documentation

Your Customer Service Representative portfolio will showcase your exceptional customer service achievements while maintaining the same professional design as your software engineering portfolio!