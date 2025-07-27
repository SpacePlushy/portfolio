# Three-Way Portfolio Routing System

This document explains how the three-way portfolio routing system works and how to test/deploy it.

## How It Works

The portfolio now uses a three-way subdomain-based routing system:
- `palmisano.io` / `www.palmisano.io` → General landing page with portfolio selection
- `swe.palmisano.io` → Software Engineering portfolio
- `csr.palmisano.io` → Customer Service Representative portfolio

All three versions share the same codebase and design but display different content based on the subdomain.

## Architecture

1. **Middleware** (`src/middleware.ts`): Detects the subdomain and maps to variants:
   - No subdomain or 'www' → 'general'
   - 'swe' → 'swe'
   - 'csr' → 'csr'

2. **Layout** (`src/app/layout.tsx`): Reads the variant and provides context

3. **Portfolio Content** (`src/config/portfolio-content.ts`): Contains content for all three variants

4. **Components**: Use the `usePortfolioVariant()` hook to display appropriate content

5. **Page Layout** (`src/app/page.tsx`): Conditionally renders:
   - General landing page: Hero + About + Portfolio Selection + Contact
   - Full portfolios: Hero + About + Experience + Achievements + Skills + Education + Contact

## Content Variants

### General Landing Page
- Shows high-level professional summary
- Highlights both technical and customer service achievements
- Features portfolio selection component with cards for each specialization
- Maintains professional theme while being domain-agnostic

### Software Engineering Portfolio (SWE)
- Full technical portfolio
- NASA Orion spacecraft focus
- Embedded systems and aerospace technology emphasis
- Complete work history and technical achievements

### Customer Service Representative Portfolio (CSR)
- Customer service excellence focus
- 99% satisfaction rates and Apple achievements
- Service-oriented skills and competencies
- Customer service work history and awards

## Local Testing

### Option 1: Using /etc/hosts (Recommended)

1. Add these entries to your `/etc/hosts` file:
   ```
   127.0.0.1 palmisano.local
   127.0.0.1 swe.palmisano.local
   127.0.0.1 csr.palmisano.local
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Test the portfolios:
   - General landing page: http://palmisano.local:3000
   - Software Engineering: http://swe.palmisano.local:3000
   - Customer Service Representative: http://csr.palmisano.local:3000

### Option 2: Manual Testing with Middleware Override

Temporarily modify `src/middleware.ts` to force a specific variant:

```typescript
// Force a specific variant for testing
response.headers.set('x-subdomain', 'general') // or 'swe' or 'csr'
```

## Production Deployment

### 1. Deploy to Vercel

Push your changes to GitHub and let Vercel automatically deploy.

### 2. Configure Domains in Vercel

1. Go to your project in Vercel Dashboard
2. Navigate to Settings → Domains
3. Add all three domains:
   - `palmisano.io` (main domain)
   - `swe.palmisano.io` (subdomain)
   - `csr.palmisano.io` (subdomain)

### 3. DNS Configuration

Configure your DNS provider with these records:

For the main domain:
```
Type: A
Name: @
Value: 76.76.21.21 (Vercel's IP)
```

For the subdomains:
```
Type: CNAME
Name: swe
Value: cname.vercel-dns.com

Type: CNAME
Name: csr
Value: cname.vercel-dns.com
```

## Testing Checklist

- [ ] General landing page loads at palmisano.io
- [ ] Portfolio selection cards work and link correctly
- [ ] Software Engineering portfolio loads at swe.palmisano.io
- [ ] Customer Service Representative portfolio loads at csr.palmisano.io
- [ ] All sections display appropriate content for each variant
- [ ] Navigation works correctly across all variants
- [ ] Contact buttons have correct links
- [ ] Dark/light theme toggle works
- [ ] Mobile responsive design works
- [ ] SEO metadata changes based on variant

## Portfolio Selection Component

The landing page features a portfolio selection component with:
- Two prominent cards showcasing each specialization
- Visual distinction with color-coded themes (blue for Software Engineering, green for Customer Service Representative)
- Key metrics and achievements highlighted
- Direct links to the specialized portfolios
- Responsive design that works on all devices

## Troubleshooting

### Subdomain Not Working Locally

1. Verify hosts file entries
2. Clear browser cache and DNS cache
3. Try incognito/private browsing mode
4. Check that the development server is running

### Content Not Switching

1. Check browser DevTools Network tab for `x-subdomain` header
2. Verify middleware is executing (check browser console)
3. Ensure variant context is being passed correctly

### Vercel Deployment Issues

1. Ensure all three domains are verified in Vercel
2. Wait for DNS propagation (can take up to 48 hours)
3. Check Vercel deployment logs for errors
4. Verify middleware is deployed correctly

## Content Management

All content is managed in `src/config/portfolio-content.ts` with three variants:
- `general`: Landing page content
- `swe`: Software Engineering portfolio content
- `csr`: Customer Service Representative portfolio content

The structure allows for easy updates and maintenance of all three portfolio variants from a single source.