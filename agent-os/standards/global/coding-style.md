## Coding style best practices - Astro Web Development

### File Organization & Naming

- **File Extensions**: `.astro` for Astro components, `.ts` for TypeScript, `.tsx` for React components
- **Component Names**: PascalCase for all component files (e.g., `BlogPost.astro`, `UserCard.tsx`)
- **Directory Structure**: Group by feature/route rather than file type
  ```
  src/
  ├── pages/           # File-based routing
  ├── components/      # Reusable components
  ├── layouts/         # Page layouts
  ├── content/         # Content collections
  └── lib/             # Utilities and helpers
  ```
- **API Routes**: kebab-case for API endpoints (e.g., `get-user.ts`, `submit-form.ts`)

### Astro Component Structure

- **Frontmatter First**: Always place component script (---) at the top
- **Import Order**:
  1. Astro/framework imports
  2. Component imports (layouts, then components)
  3. Utilities and types
  4. Data fetching/content collections
- **Prop Definitions**: Use TypeScript interfaces for type-safe props
  ```astro
  ---
  interface Props {
    title: string;
    date?: Date;
  }
  const { title, date = new Date() } = Astro.props;
  ---
  ```

### TypeScript Standards

- **Strict Mode**: Enable `strict: true` in tsconfig.json
- **Type Imports**: Use `import type` for type-only imports to reduce bundle size
- **Prop Types**: Always define interfaces for component props
- **Type Inference**: Let TypeScript infer return types when obvious, explicitly type when complex
- **Avoid `any`**: Use `unknown` or proper typing instead of `any`

### Code Style

- **Indentation**: 2 spaces (Prettier default for .astro files)
- **Quotes**: Double quotes for JSX/HTML attributes, single quotes for JavaScript/TypeScript
- **Semicolons**: Use semicolons consistently (Prettier enforces this)
- **Line Length**: Max 100 characters (configure Prettier printWidth: 100)
- **Trailing Commas**: Use trailing commas in multiline arrays/objects (es5 standard)

### Component Best Practices

- **Server-First Thinking**: Default to server rendering, add client interactivity only when needed
- **Zero JS by Default**: Astro components ship zero JavaScript unless using client directives
- **Strategic Hydration**: Use the most specific client directive:
  - `client:load` - Critical interactive components
  - `client:idle` - Non-critical interactive components
  - `client:visible` - Below-fold interactive components
  - `client:media` - Responsive conditional loading
  - `client:only` - Client-only rendering (no SSR)
- **Component Composition**: Prefer composition over inheritance
- **Single Responsibility**: Each component should have one clear purpose

### Data Fetching Patterns

- **Top-level await**: Use await directly in component frontmatter (server-side only)
- **Error Handling**: Wrap data fetching in try-catch blocks
- **Content Collections**: Always use Content Collections with Zod schemas for type safety
  ```astro
  ---
  import { getCollection } from 'astro:content';
  const posts = await getCollection('blog');
  ---
  ```

### Code Quality

- **DRY Principle**: Extract repeated logic into utility functions or components
- **Remove Dead Code**: Delete unused imports, commented code, and unreachable code
- **Meaningful Names**: Use descriptive names that reveal intent
  - Good: `blogPosts`, `getUserById`, `isAuthenticated`
  - Bad: `arr`, `data`, `temp`, `func`
- **Small Functions**: Keep functions under 20 lines when possible
- **Avoid Magic Numbers**: Use named constants for configuration values

### Formatting Automation

- **Prettier**: Use prettier-plugin-astro for consistent formatting
- **ESLint**: Use eslint-plugin-astro for Astro-specific linting
- **Format on Save**: Enable editor format-on-save for consistency
- **Pre-commit Hooks**: Use Husky + lint-staged to enforce formatting before commits

### Performance Considerations

- **Import Only What You Need**: Use named imports to enable tree-shaking
- **Lazy Loading**: Use dynamic imports for large components/libraries
- **Image Optimization**: Always use `<Image />` component for images, never plain `<img>`
- **CSS Scope**: Prefer scoped styles over global to reduce CSS payload
- **Minimal Client JS**: Question every client directive - does it really need interactivity?

### Backward Compatibility

- **Modern Standards**: Unless specified, use modern JavaScript/TypeScript features
- **No Legacy Support**: Don't add polyfills or workarounds unless explicitly required
