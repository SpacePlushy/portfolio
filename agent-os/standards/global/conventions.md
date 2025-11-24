## General development conventions - Astro Web Development

### Project Structure

- **Standard Astro Structure**: Follow Astro's conventional directory layout
  ```
  project-root/
  ├── public/              # Static assets (copied as-is)
  ├── src/
  │   ├── assets/          # Processed assets (images, fonts)
  │   ├── components/      # Reusable Astro/framework components
  │   ├── content/         # Content collections (blog/, docs/, etc.)
  │   │   └── config.ts    # Content collections schema
  │   ├── layouts/         # Page layout components
  │   ├── lib/             # Utilities, helpers, constants
  │   ├── pages/           # File-based routes
  │   │   └── api/         # API endpoints
  │   ├── styles/          # Global styles
  │   └── env.d.ts         # TypeScript environment types
  ├── astro.config.mjs     # Astro configuration
  ├── tsconfig.json        # TypeScript configuration
  └── package.json
  ```
- **Feature-Based Organization**: For large apps, group by feature in components/
- **Colocation**: Keep related files close (component + styles + tests)

### Environment Configuration

- **Environment Variables**: Use `.env` files for configuration
  - `.env` - Default values
  - `.env.local` - Local overrides (gitignored)
  - `.env.production` - Production values
- **Public vs Private**: Prefix public vars with `PUBLIC_` to expose to client

  ```typescript
  // Private (server-only)
  import.meta.env.DATABASE_URL;

  // Public (accessible in browser)
  import.meta.env.PUBLIC_API_URL;
  ```

- **Never Commit Secrets**: Add `.env.local` to `.gitignore`, use `.env.example` as template
- **Type Safety**: Extend `ImportMetaEnv` interface in `env.d.ts` for autocomplete

### Version Control

- **Commit Messages**: Use conventional commits format
  - `feat:` - New features
  - `fix:` - Bug fixes
  - `docs:` - Documentation changes
  - `style:` - Formatting, no code change
  - `refactor:` - Code restructuring
  - `perf:` - Performance improvements
  - `test:` - Test additions/changes
- **Branch Strategy**:
  - `main` - Production-ready code
  - `develop` - Integration branch (optional)
  - `feature/[name]` - New features
  - `fix/[name]` - Bug fixes
- **Pull Requests**: Include description, screenshots (for UI), and testing notes

### Dependency Management

- **Lock Files**: Commit `pnpm-lock.yaml` or `package-lock.json`
- **Minimal Dependencies**: Question every new dependency - can you write it yourself?
- **Astro Integrations**: Prefer official `@astrojs/*` integrations
- **Update Strategy**: Use Dependabot or Renovate for automated updates
- **Peer Dependencies**: Document compatibility requirements in package.json

### Content Collections Best Practices

- **Schema-First**: Always define Zod schemas in `src/content/config.ts`
- **Organize by Type**: Separate collections (blog/, docs/, projects/)
- **Slug Validation**: Validate slugs match URL patterns
- **Reference Validation**: Use `reference()` for relationships between collections

  ```typescript
  import { defineCollection, reference, z } from 'astro:content';

  const blog = defineCollection({
    type: 'content',
    schema: z.object({
      title: z.string(),
      author: reference('authors'),
      tags: z.array(z.string()),
      publishDate: z.date(),
    }),
  });
  ```

### Performance Standards

- **Lighthouse Minimum**: 95+ on all metrics before deploying
- **Bundle Size**: Monitor with `astro build` - investigate large chunks
- **Image Optimization**: All images must use `<Image />` or `<Picture />`
- **Client JS Budget**: Each page should ship < 50KB JS (gzipped) unless justified
- **Font Strategy**: Subset fonts, use `font-display: swap`

### Code Review Process

- **Required Reviews**: At least one approval before merging
- **Review Checklist**:
  - [ ] Client directives are justified and minimal
  - [ ] Images use `<Image />` component
  - [ ] TypeScript types are correct (no `any`)
  - [ ] Content collections use proper schemas
  - [ ] No hardcoded content (use Content Collections or i18n)
  - [ ] Accessibility standards met
  - [ ] Mobile responsive
- **Automated Checks**: Prettier, ESLint, TypeScript, tests must pass

### Testing Requirements

- **Component Tests**: Unit test complex logic in components
- **Integration Tests**: Test content collection queries and API routes
- **E2E Tests**: Critical user journeys (checkout, signup, etc.)
- **Pre-deployment**: Run `astro check` and `astro build` locally

### Documentation

- **README.md**: Include setup, development, build commands
- **Component Documentation**: Document component props with JSDoc
- **Architecture Decisions**: Keep ADR (Architecture Decision Records) for major choices
- **API Documentation**: Document all API routes with examples

### Build & Deployment

- **Build Modes**: Understand static (SSG) vs hybrid vs server (SSR)
- **Adapter Selection**: Choose based on deployment target (Vercel, Netlify, Node, etc.)
- **Preview Deployments**: Use preview URLs for PR reviews
- **Environment Parity**: Keep dev/staging/prod environments similar
- **Build Optimization**: Enable compression, minification in production
