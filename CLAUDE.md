# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a professional portfolio website for Frank Palmisano built with Astro, featuring:
- Server-side rendering (SSR) with Vercel adapter and ISR caching
- Dual portfolio paths (Software Engineer & Customer Service Representative)
- Dark/light theme support
- Vercel Analytics integration
- **Comprehensive security system** with bot protection and API security
- **Secure API endpoints** with input validation and rate limiting
- **Security middleware** with XSS protection and monitoring
- Responsive design with Tailwind CSS
- UI components from shadcn/ui

## Development Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server at `localhost:4321` with hot reloading |
| `npm run build` | Build production site to `./dist/` directory |
| `npm run preview` | Preview production build locally |
| `npm run astro` | Run Astro CLI commands (e.g., `npm run astro add tailwind`) |
| `npm run lint` | Run ESLint to check code quality (if configured) |
| `npm run typecheck` | Run TypeScript type checking (if configured) |

## Testing Commands

**IMPORTANT**: Always run these commands after completing any task to ensure code quality:
- `npm run lint` (if available) - Check for code style issues
- `npm run typecheck` (if available) - Check for TypeScript errors
- `npm run build` - Ensure the project builds successfully

## Important: Use CLI Tools for All Changes

**ALWAYS use CLI tools when available for making changes to this project.** CLIs ensure proper configuration, dependency management, and compatibility. Only use manual configuration when no CLI exists.

### CLI Tool Priority Order

1. **Astro CLI** - Use for all Astro integrations:
   - `npx astro add react --yes` - Add React support
   - `npx astro add tailwind --yes` - Add Tailwind CSS  
   - `npx astro add vercel --yes` - Add Vercel adapter
   - `npx astro add mdx --yes` - Add MDX support
   - `npx astro add sitemap --yes` - Add sitemap generation
   - **Always use `--yes` flag** to ensure config updates properly

2. **Component Library CLIs** - Use after Astro setup:
   - `npx shadcn@latest init` - Initialize shadcn/ui
   - `npx shadcn@latest add <component>` - Add shadcn components
   - Other component library CLIs as needed

3. **Manual Configuration** - Only when no CLI exists:
   - TypeScript path aliases in `tsconfig.json`
   - Global CSS imports in Layout files
   - Custom webpack/vite configurations

### Other CLI Commands
- `npm run astro check` - Check for TypeScript and configuration errors
- `npm run astro sync` - Generate TypeScript definitions for content collections
- `npm run astro info` - Display project information and environment details

### When Making Changes
1. **Check for CLI tools first** - Never manually configure what a CLI can handle
2. **Always test with `npm run dev`** after making changes
3. **Run `npm run build`** to verify production builds work
4. **Use `npm run astro check`** to catch TypeScript/configuration issues
5. **Let CLIs modify config files** - Only edit manually when absolutely necessary
6. **Run lint and typecheck** after completing tasks (if available)

## Current Tech Stack

### Core Technologies
- **Astro 5.x** - Static site generator with SSR support
- **React 19** - For interactive components
- **Tailwind CSS v4** - Utility-first CSS framework
- **TypeScript** - Type safety throughout the project

### Security Technologies
- **BotID** - Bot detection and protection
- **Zod** - Runtime type validation for API inputs
- **Security Headers** - XSS and clickjacking protection
- **Content Security Policy** - Script and resource restrictions

### Key Integrations
- **@astrojs/vercel** - SSR adapter with ISR and image optimization
- **@vercel/analytics** - Web analytics tracking
- **botid** - Bot protection for API endpoints
- **shadcn/ui** - Component library built on Radix UI

### Security Features
- **Bot Protection**: Client and server-side validation
- **API Security**: Input validation, rate limiting, error handling
- **XSS Protection**: Security headers and Content Security Policy
- **Environment Security**: Safe handling of secrets and public variables
- **Request Monitoring**: Comprehensive logging and suspicious activity detection

### Project Structure
```
src/
├── assets/           # Images and static assets
├── components/       # Astro and React components
│   ├── ui/          # shadcn/ui components
│   ├── BotIdProtection.tsx  # Client-side bot detection
│   └── *.astro      # Portfolio section components
├── layouts/         # Page layouts with security features
├── lib/             # Utility libraries
│   ├── bot-protection.ts    # Security utilities
│   └── utils.ts     # General utilities
├── pages/           # File-based routing
│   ├── api/         # Secure API endpoints
│   │   ├── contact.js   # Contact form with validation
│   │   └── health.js    # System health check
│   └── *.astro      # Page routes
├── styles/          # Global styles
└── middleware.js    # Security middleware with bot protection
```

### Architecture Patterns

#### Component Hydration
- Use `client:load` for immediately interactive components
- Use `client:visible` for components that hydrate when scrolled into view
- Use `client:idle` for lower-priority interactive components
- **Note**: Astro's `<Image>` component doesn't need client directives

#### SSR Configuration
```javascript
// astro.config.mjs
export default defineConfig({
  output: 'server', // Enable SSR for security features
  adapter: vercel({
    isr: { expiration: 60 * 60 }, // 1 hour cache for static content
    imageService: true,
    webAnalytics: { enabled: true }
  })
});
```

#### Security Architecture
The portfolio implements a comprehensive security system:

**Client-Side Protection:**
- `BotIdProtection` component initializes bot detection
- Token generation with cryptographic randomness
- Browser environment validation and fingerprinting
- Session-based token storage (cleared on tab close)

**Server-Side Validation:**
- Middleware intercepts all API requests
- `checkBotId()` validates tokens and detects suspicious patterns
- Rate limiting and IP-based monitoring
- Request consistency validation (User-Agent, Origin headers)

**API Security:**
- Zod schema validation for all inputs
- Honeypot fields for spam detection
- Request size limits and content-type validation
- Comprehensive error handling without information leakage
- Security logging for monitoring and analysis

### Performance Optimizations
- **Image Optimization**: Vercel automatically optimizes images on-demand
- **ISR Caching**: Pages cached for 1 hour after first request
- **Component Code Splitting**: Only loads JavaScript for interactive components
- **Modern Image Formats**: Automatic AVIF/WebP conversion

### Development Best Practices
1. **Keep components as .astro files** when possible
2. **Use shadcn components directly** in .astro files
3. **Apply client directives strategically** - only for interactive components
4. **Test bot protection locally** by checking middleware logs
5. **Verify SSR behavior** with `npm run build && npm run preview`
6. **Never commit secrets** - use environment variables for sensitive data
7. **Validate all API inputs** - use Zod schemas for runtime validation
8. **Test security features** - verify bot detection and rate limiting
9. **Monitor security logs** - check for suspicious patterns and attacks

### Security Guidelines

#### Environment Variables
- **Public variables** (safe for client exposure): Start with `PUBLIC_`
- **Secret variables** (server-only): Never expose to client-side code
- **Development**: Use `.env.local` (excluded from git)
- **Production**: Configure in Vercel dashboard

#### API Endpoint Security
When creating new API endpoints:
```javascript
export async function POST({ request, locals }) {
  // 1. Check bot protection
  if (locals?.botCheck?.status === 'likely_bot') {
    return new Response('Forbidden', { status: 403 });
  }
  
  // 2. Validate input with Zod
  const schema = z.object({ /* define schema */ });
  const result = schema.safeParse(await request.json());
  
  // 3. Handle errors securely
  return createErrorResponse('Generic error', 'ERROR_CODE', 500);
}
```

#### Component Security
- Use `client:load` only when necessary for interactivity
- Store sensitive data in server-side sessions, not client storage
- Validate all props and user inputs
- Escape output when rendering dynamic content

### Deployment Notes
- Deploys automatically to Vercel on push to main branch
- Environment variables managed in Vercel dashboard
- Analytics enabled in Vercel project settings
- Bot protection rules apply in production only

### Common Tasks

#### Adding a New shadcn Component
```bash
npx shadcn@latest add dialog
# Then import in .astro file:
# import { Dialog } from "@/components/ui/dialog";
```

#### Creating a New Secure API Endpoint
```javascript
// src/pages/api/endpoint.js
import { z } from 'zod';

const InputSchema = z.object({
  // Define validation schema
});

export async function POST({ request, locals }) {
  // Security checks
  if (locals.botCheck?.status === 'likely_bot') {
    return new Response('Forbidden', { status: 403 });
  }
  
  // Input validation
  const result = InputSchema.safeParse(await request.json());
  if (!result.success) {
    return new Response('Invalid input', { status: 400 });
  }
  
  // Process request...
}
```

#### Adding Security Headers
Security headers are automatically added by middleware, but you can customize them:
```javascript
// In middleware.js, modify securityHeaders object
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  // Add custom headers here
};
```

#### Testing Bot Protection
```bash
# Test API without bot protection headers
curl -X POST http://localhost:4321/api/contact \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}'

# Should return 403 Forbidden
```