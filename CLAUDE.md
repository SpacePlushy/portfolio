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

## Important: Use CLI Tools for All Changes

**ALWAYS use CLI tools when available for making changes to this project.** CLIs ensure proper configuration, dependency management, and compatibility. Only use manual configuration when no CLI exists.

### CLI Tool Priority Order

1. **Astro CLI** - Use for all Astro integrations:
   - `npx astro add react --yes` - Add React support
   - `npx astro add tailwind --yes` - Add Tailwind CSS  
   - `npx astro add vue --yes` - Add Vue support
   - `npx astro add svelte --yes` - Add Svelte support
   - `npx astro add solid-js --yes` - Add Solid.js support
   - `npx astro add preact --yes` - Add Preact support
   - `npx astro add mdx --yes` - Add MDX support
   - `npx astro add sitemap --yes` - Add sitemap generation
   - `npx astro add partytown --yes` - Add Partytown for third-party scripts
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
- `npm run astro preferences` - Manage Astro preferences
- `npm run astro telemetry` - Configure telemetry settings

### When Making Changes
1. **Check for CLI tools first** - Never manually configure what a CLI can handle
2. **Always test with `npm run dev`** after making changes
3. **Run `npm run build`** to verify production builds work
4. **Use `npm run astro check`** to catch TypeScript/configuration issues
5. **Let CLIs modify config files** - Only edit manually when absolutely necessary

### Complete shadcn/ui Setup Example

**Step 1: Use Astro CLI for framework setup (with --yes flag)**
```bash
npx astro add react --yes     # Add React support
npx astro add tailwind --yes  # Add Tailwind CSS
```

**Step 2: Manual configuration (no CLI available)**
```json
// Add to tsconfig.json compilerOptions:
"baseUrl": ".",
"paths": {
  "@/*": ["./src/*"]
}
```
```astro
// Add to Layout.astro frontmatter:
import '../styles/global.css'
```

**Step 3: Use shadcn CLI for components**
```bash
npx shadcn@latest init        # Initialize shadcn/ui
npx shadcn@latest add button card dialog  # Add components
```

**Important Notes:**
- **Always use CLIs when available** - Manual config only for path aliases and CSS imports
- Use `client:load` directive on interactive shadcn components in `.astro` files
- Prefer keeping components as `.astro` files that import shadcn components

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