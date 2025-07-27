# Customer Service Representative (CSR) Portfolio Setup

This document explains how the Customer Service Representative (CSR) portfolio variant works and how to test/deploy it.

## How It Works

The portfolio uses subdomain-based content switching:
- `palmisano.io` → Shows Software Engineer portfolio
- `csr.palmisano.io` → Shows Customer Service Representative portfolio

Both portfolios share the same codebase and design but display different content based on the subdomain.

## Architecture

1. **Middleware** (`src/middleware.ts`): Detects the subdomain and adds it as a header
2. **Layout** (`src/app/layout.tsx`): Reads the subdomain header and provides the variant context
3. **Portfolio Content** (`src/config/portfolio-content.ts`): Contains all content for both variants
4. **Components**: Use the `usePortfolioVariant()` hook to display appropriate content

## Local Testing

### Option 1: Using /etc/hosts (Recommended)

1. Add these entries to your `/etc/hosts` file:
   ```
   127.0.0.1 palmisano.local
   127.0.0.1 csr.palmisano.local
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Test the portfolios:
   - Main portfolio: http://palmisano.local:3000
   - Customer Service Representative portfolio: http://csr.palmisano.local:3000

### Option 2: Manual Testing

You can manually test by modifying the middleware to force a specific variant:

```typescript
// In src/middleware.ts, temporarily add:
response.headers.set('x-subdomain', 'csr') // Force CSR variant
```

## Vercel Deployment

### 1. Deploy the Application

Push your changes to GitHub and let Vercel automatically deploy.

### 2. Configure Domains in Vercel

1. Go to your project in Vercel Dashboard
2. Navigate to Settings → Domains
3. Add both domains:
   - `palmisano.io` (main domain)
   - `csr.palmisano.io` (subdomain)

### 3. DNS Configuration

Configure your DNS provider with these records:

For the main domain:
```
Type: A
Name: @
Value: 76.76.21.21 (Vercel's IP)
```

For the subdomain:
```
Type: CNAME
Name: csr
Value: cname.vercel-dns.com
```

## Content Management

### Adding/Updating Content

All content is managed in `src/config/portfolio-content.ts`. The structure is:

```typescript
export const portfolioContent = {
  main: {
    // Software Engineer content
  },
  csr: {
    // Customer Service Representative content
  }
}
```

### Key Sections

1. **Hero**: Name, title, tagline, contact info
2. **About**: Professional summary and key stats
3. **Experience**: Work history with descriptions
4. **Skills**: Categorized skills with proficiency levels
5. **Achievements**: Notable accomplishments
6. **Education**: Degrees and certifications

## Testing Checklist

- [ ] Main portfolio loads correctly at palmisano.io
- [ ] Customer Service Representative portfolio loads correctly at csr.palmisano.io
- [ ] All sections display appropriate content for each variant
- [ ] Navigation works correctly
- [ ] Contact buttons have correct links
- [ ] Dark/light theme toggle works
- [ ] Mobile responsive design works
- [ ] SEO metadata changes based on variant

## Troubleshooting

### Subdomain Not Working Locally

1. Make sure you've added the hosts entries
2. Clear your browser cache
3. Try incognito/private browsing mode

### Content Not Switching

1. Check the browser DevTools Network tab
2. Look for the `x-subdomain` header in the response
3. Verify the middleware is running (check console logs)

### Vercel Deployment Issues

1. Ensure both domains are verified in Vercel
2. Wait for DNS propagation (can take up to 48 hours)
3. Check Vercel deployment logs for errors