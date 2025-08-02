# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a professional portfolio website for Frank Palmisano built with Astro, featuring:

- Server-side rendering (SSR) with Node.js adapter
- Dual portfolio paths (Software Engineer & Customer Service Representative)
- Dark/light theme support
- Advanced rate limiting and bot protection for API endpoints
- Responsive design with Tailwind CSS
- UI components from shadcn/ui

## Development Commands

| Command             | Purpose                                                         |
| ------------------- | --------------------------------------------------------------- |
| `npm run dev`       | Start development server at `localhost:4321` with hot reloading |
| `npm run build`     | Build production site to `./dist/` directory                    |
| `npm run preview`   | Preview production build locally                                |
| `npm run astro`     | Run Astro CLI commands (e.g., `npm run astro add tailwind`)     |
| `npm run lint`      | Run ESLint to check code quality (if configured)                |
| `npm run typecheck` | Run TypeScript type checking (if configured)                    |

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
   - `npx astro add node --yes` - Add Node.js adapter
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

### Key Integrations

- **@astrojs/node** - SSR adapter for Node.js environments
- **shadcn/ui** - Component library built on Radix UI

### Project Structure

```
src/
├── assets/           # Images and static assets
├── components/       # Astro and React components
│   ├── ui/          # shadcn/ui components
│   └── *.astro      # Portfolio section components
├── layouts/         # Page layouts
├── pages/           # File-based routing
│   ├── api/         # API endpoints
│   └── *.astro      # Page routes
├── styles/          # Global styles
└── middleware.js    # Request middleware (rate limiting & bot protection)
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
  adapter: node({
    mode: 'standalone',
  }),
});
```

#### Rate Limiting & Bot Protection

- Server-side: Advanced middleware implements rate limiting per IP address
- Automatic bot detection using request patterns and user-agent analysis
- API endpoints protected with configurable rate limits and timeouts
- Request validation and sanitization for enhanced security

### Performance Optimizations

- **Image Optimization**: Astro's built-in image optimization with modern formats
- **Server-side Caching**: Efficient caching strategies for static and dynamic content
- **Component Code Splitting**: Only loads JavaScript for interactive components
- **CDN Integration**: Static assets served via Digital Ocean's CDN
- **Gzip Compression**: Automatic compression for faster load times

### Development Best Practices

1. **Keep components as .astro files** when possible
2. **Use shadcn components directly** in .astro files
3. **Apply client directives strategically** - only for interactive components
4. **Test rate limiting locally** by checking middleware logs
5. **Verify SSR behavior** with `npm run build && npm run preview`

### Deployment Notes

- Deploys to Digital Ocean App Platform with automatic builds
- Environment variables managed in Digital Ocean dashboard
- Rate limiting and security features active in production
- Node.js runtime with PM2 process management
- SSL certificates automatically managed by Digital Ocean

### Common Tasks

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
  // Rate limiting check already done in middleware
  if (locals.rateLimited) {
    return new Response('Rate limit exceeded', { status: 429 });
  }
  // Handle request...
}
```

#### Adding a New Page Section

1. Create component in `src/components/SectionName.astro`
2. Import and use in relevant page files
3. Ensure proper styling with Tailwind classes
4. Add appropriate client directives if interactive
