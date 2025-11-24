# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a professional portfolio website for Frank Palmisano built with Astro, featuring:

- Server-side rendering (SSR) with Vercel adapter
- Dual portfolio paths (Software Engineer & Customer Service Representative)
- Dark/light theme support
- Vercel Analytics integration
- BotID protection for API endpoints
- Responsive design with Tailwind CSS
- UI components from shadcn/ui

## Development Commands

| Command           | Purpose                                                         |
| ----------------- | --------------------------------------------------------------- |
| `npm run dev`     | Start development server at `localhost:4321` with hot reloading |
| `npm run build`   | Build production site to `./dist/` directory                    |
| `npm run preview` | Preview production build locally                                |
| `npm run astro`   | Run Astro CLI commands (e.g., `npm run astro add tailwind`)     |

## Quality Assurance Commands

**IMPORTANT**: Always run these commands after completing any task to ensure code quality:

| Command                 | Purpose                                             |
| ----------------------- | --------------------------------------------------- |
| `npm run lint`          | Run ESLint to check code quality                    |
| `npm run lint:fix`      | Auto-fix ESLint issues where possible               |
| `npm run typecheck`     | Run TypeScript type checking with Astro             |
| `npm run format`        | Format code with Prettier                           |
| `npm run format:check`  | Check code formatting without making changes        |
| `npm test`              | Run Vitest test suite                               |
| `npm run test:watch`    | Run tests in watch mode during development          |
| `npm run test:ui`       | Launch Vitest UI for interactive test visualization |
| `npm run test:coverage` | Generate test coverage report                       |

**Post-task checklist**: After completing any feature or fix, run:

1. `npm run typecheck` - Catch type errors
2. `npm run lint` - Ensure code quality
3. `npm run format` - Ensure consistent formatting
4. `npm test` - Verify all tests pass
5. `npm run build` - Confirm production build succeeds

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

- `npx astro check` - Check for TypeScript and configuration errors (same as `npm run typecheck`)
- `npx astro sync` - Generate TypeScript definitions for content collections
- `npx astro info` - Display project information and environment details

### When Making Changes

1. **Check for CLI tools first** - Never manually configure what a CLI can handle
2. **Always test with `npm run dev`** after making changes
3. **Run quality checks** - Follow the post-task checklist above
4. **Let CLIs modify config files** - Only edit manually when absolutely necessary

## Current Tech Stack

### Core Technologies

- **Astro 5.x** - Static site generator with SSR support
- **React 19** - For interactive components
- **Tailwind CSS v4** - Utility-first CSS framework
- **TypeScript** - Type safety throughout the project

### Key Integrations

- **@astrojs/vercel** - SSR adapter with ISR and image optimization
- **@vercel/analytics** - Web analytics tracking
- **botid** - Bot protection for API endpoints
- **shadcn/ui** - Component library built on Radix UI
- **Vitest** - Unit testing framework with jsdom environment
- **ESLint** - Code quality with TypeScript, Astro, and accessibility rules
- **Prettier** - Code formatting with Astro plugin support

### Project Structure

```
src/
├── assets/           # Images and static assets
├── components/       # Astro and React components
│   ├── ui/          # shadcn/ui components (React)
│   └── *.astro      # Portfolio section components
├── config/          # Configuration files (contact info, etc.)
├── layouts/         # Page layouts (Layout.astro with theme initialization)
├── lib/             # Utility functions (cn() for Tailwind class merging)
├── pages/           # File-based routing
│   ├── index.astro           # Portfolio selection landing page
│   ├── software-engineer.astro    # Software engineering portfolio
│   └── customer-service.astro     # Customer service portfolio
├── services/        # Business logic (ThemeService for dark/light mode)
├── styles/          # Global CSS (Tailwind v4 imports)
├── test/            # Test setup and utilities
└── middleware.js    # Request middleware (BotID protection, Chrome DevTools handling)
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
  output: 'server',
  adapter: vercel({
    isr: { expiration: 60 * 60 }, // 1 hour cache
    imageService: true,
    webAnalytics: { enabled: true },
  }),
});
```

#### Theme System

- **ThemeService** (`src/services/theme.ts`) - Centralized theme management class
- **Theme initialization** - Inline script in `Layout.astro` prevents flash of unstyled content (FOUC)
- **Priority order**: localStorage → system preference → default light
- **ThemeToggle component** - Uses ThemeService for consistent theme switching
- **Dark mode class**: Applied to `<html>` element, Tailwind CSS responds with `dark:` variants

#### Bot Protection

- **Middleware** (`src/middleware.js`) - Runs `checkBotId()` from `botid/server` on all `/api/*` routes
- **Chrome DevTools handling** - Returns 204 for `.well-known/appspecific/com.chrome.devtools.json`
- **vercel.json rewrites** - Proxy BotID challenge requests to Vercel's bot protection API
- **API route pattern**: Check `locals.botCheck.isBot` / `locals.botCheck.isHuman` in API handlers
- **Bot check result properties**: `isHuman`, `isBot`, `isGoodBot`, `bypassed`

#### Security Headers

vercel.json configures production security headers:

- **Content-Security-Policy** - Restricts script/style sources, allows Vercel Live and fonts
- **X-Content-Type-Options: nosniff** - Prevents MIME sniffing
- **X-Frame-Options: DENY** - Prevents clickjacking
- **X-XSS-Protection** - Enables browser XSS filtering
- **Referrer-Policy: strict-origin-when-cross-origin** - Controls referrer information
- **Strict-Transport-Security** - Enforces HTTPS for 1 year with subdomains

### Performance Optimizations

- **Image Optimization**: Vercel automatically optimizes images on-demand
- **ISR Caching**: Pages cached for 1 hour after first request
- **Component Code Splitting**: Only loads JavaScript for interactive components
- **Modern Image Formats**: Automatic AVIF/WebP conversion

### Testing Infrastructure

- **Framework**: Vitest with React Testing Library
- **Environment**: jsdom for DOM simulation
- **Setup file**: `src/test/test-setup.ts` with `@testing-library/jest-dom` matchers
- **Test patterns**: `src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}`
- **Path aliases**: `@/*` resolves to `./src/*` (configured in vitest.config.ts)
- **Coverage**: Available via `npm run test:coverage`

### Development Best Practices

1. **Keep components as .astro files** when possible (better performance, no hydration cost)
2. **Use React only for interactivity** - ThemeToggle, forms, client-side state
3. **Use shadcn components directly in .astro files** - They work without client directives unless interactive
4. **Apply client directives strategically** - `client:load` for critical UI, `client:visible` for below-fold
5. **Write tests for utilities** - See `src/lib/utils.test.ts` for example patterns
6. **Theme changes**: Modify ThemeService, not individual components

### Deployment Notes

- Deploys automatically to Vercel on push to main branch
- Environment variables managed in Vercel dashboard
- Analytics enabled in Vercel project settings
- Bot protection rules apply in production only

### Common Development Tasks

#### Adding a New shadcn Component

```bash
npx shadcn@latest add dialog
# Then import in .astro file:
# import { Dialog } from "@/components/ui/dialog";
```

#### Creating a New API Endpoint

```javascript
// src/pages/api/endpoint.js
export async function POST({ request, locals }) {
  // BotID check already done in middleware
  if (locals.botCheck?.isBot && !locals.botCheck?.isGoodBot) {
    return new Response('Forbidden', { status: 403 });
  }
  // Handle request...
}
```

#### Adding a New Portfolio Section

1. Create component in `src/components/SectionName.astro`
2. Import and use in `software-engineer.astro` or `customer-service.astro`
3. Style with Tailwind classes (use `dark:` variants for theme support)
4. Add `client:*` directive only if component needs JavaScript

#### Writing Unit Tests

```typescript
// src/lib/example.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from './example';

describe('myFunction', () => {
  it('should do something', () => {
    expect(myFunction()).toBe(expectedValue);
  });
});
```

#### Modifying Theme Behavior

1. Update `ThemeService` in `src/services/theme.ts` for logic changes
2. Update inline script in `Layout.astro` if changing initialization
3. Ensure `ThemeToggle.astro` uses ThemeService methods
4. Test both light/dark modes and localStorage persistence
