# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Astro project created from the "basics" starter template. Astro is a modern web framework focused on building fast, content-driven websites with minimal JavaScript by default.

## Development Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server at `localhost:4321` with hot reloading |
| `npm run build` | Build production site to `./dist/` directory |
| `npm run preview` | Preview production build locally |
| `npm run astro` | Run Astro CLI commands (e.g., `npm run astro add tailwind`) |

## Important: Use Astro CLI for All Changes

**ALWAYS use the Astro CLI for making changes to this project.** The Astro CLI ensures proper configuration, dependency management, and compatibility.

### Adding Integrations
Use `npm run astro add <integration>` instead of manual installation:
- `npm run astro add tailwind` - Add Tailwind CSS
- `npm run astro add react` - Add React support  
- `npm run astro add vue` - Add Vue support
- `npm run astro add svelte` - Add Svelte support
- `npm run astro add solid-js` - Add Solid.js support
- `npm run astro add preact` - Add Preact support
- `npm run astro add mdx` - Add MDX support
- `npm run astro add sitemap` - Add sitemap generation
- `npm run astro add partytown` - Add Partytown for third-party scripts

### Other CLI Commands
- `npm run astro check` - Check for TypeScript and configuration errors
- `npm run astro sync` - Generate TypeScript definitions for content collections
- `npm run astro info` - Display project information and environment details
- `npm run astro preferences` - Manage Astro preferences
- `npm run astro telemetry` - Configure telemetry settings

### When Making Changes
1. **Always test with `npm run dev`** after making changes
2. **Run `npm run build`** to verify production builds work
3. **Use `npm run astro check`** to catch TypeScript/configuration issues
4. **Let Astro CLI modify `astro.config.mjs`** - don't edit manually unless necessary

### Adding shadcn/ui Components
For UI component libraries like shadcn/ui, you need **both CLIs**:

**Step 1: Use Astro CLI for framework setup**
```bash
npm run astro add react    # Add React support
npm run astro add tailwind # Add Tailwind CSS
```

**Step 2: Use shadcn CLI for component setup**
```bash
npx shadcn@latest init     # Initialize shadcn/ui
npx shadcn@latest add button card dialog  # Add components
```

**Why both CLIs are needed:**
- Astro CLI only handles official Astro integrations
- shadcn CLI manages component architecture and copies source code
- No way to avoid the shadcn CLI for shadcn/ui projects

**Important for Astro + shadcn/ui:**
- Use `client:load` directive on shadcn components in `.astro` files
- Consider wrapping multiple shadcn components in a single React component to avoid island communication issues

## Architecture Overview

### File-Based Routing
- Pages in `src/pages/` automatically become routes
- `src/pages/index.astro` serves as the homepage (/)
- Astro supports `.astro`, `.md`, `.mdx`, and framework component files in pages

### Component Architecture
- **Layout Pattern**: `src/layouts/Layout.astro` provides the base HTML structure with `<slot />` for content injection
- **Component Composition**: Components import and compose other components (e.g., `index.astro` imports `Welcome.astro` and wraps it in `Layout.astro`)
- **Asset Handling**: Static assets in `src/assets/` are imported as modules with `.src` property for URLs

### Astro Component Structure
```astro
---
// Component frontmatter (JavaScript/TypeScript)
// Runs at build time, not in browser
import Component from './Component.astro';
---

<!-- Component template (HTML with component slots) -->
<Component />

<style>
/* Scoped CSS - only applies to this component */
</style>
```

### Configuration
- `astro.config.mjs`: Main configuration file (currently using defaults)
- `tsconfig.json`: Extends Astro's strict TypeScript configuration
- No integrations or adapters currently configured

### Development Notes
- TypeScript support enabled with strict configuration
- No testing framework configured
- No linting tools configured
- Uses ES modules (`"type": "module"` in package.json)
- Astro 5.x series (latest stable)

### Current Project State
This is a fresh Astro basics starter with:
- Simple welcome page with gradient background effect
- Responsive design with mobile breakpoints
- Links to Astro documentation and Discord
- News section highlighting Astro 5.0 features