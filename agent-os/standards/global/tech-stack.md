## Tech stack - Astro Web Development

Modern, performance-first web development stack optimized for content-focused websites and applications.

### Framework & Runtime

- **Application Framework:** Astro (latest stable version)
- **Language/Runtime:** Node.js 18+ or Bun for optimal performance
- **Package Manager:** pnpm (preferred) or npm for dependency management
- **Build Output:** Static Site Generation (SSG) by default, hybrid/SSR when needed

### Frontend Architecture

- **Core Framework:** Astro (server-first, islands architecture)
- **UI Framework Support:** Framework-agnostic (React, Vue, Svelte, Preact, SolidJS, Alpine, Lit)
  - Use framework components only when interactivity is required
  - Prefer Astro components for static/server-rendered content
- **Client Directives:** Strategic hydration using client:load, client:idle, client:visible, client:media, client:only
- **Routing:** File-based routing in src/pages/ directory
- **Content Management:** Content Collections for type-safe content with Zod schemas

### Styling & Design

- **CSS Strategy:** Scoped styles by default (auto-scoped to components)
- **CSS Framework:** Tailwind CSS (recommended) or vanilla CSS
- **Global Styles:** Import in layouts, use :global() selector when needed
- **CSS Preprocessors:** Sass, Less, Stylus (supported via integrations)
- **Typography:** @tailwindcss/typography for prose content

### Data & Content

- **Content Collections:** Type-safe Markdown/MDX with Zod validation
- **Data Fetching:** Top-level await in component frontmatter (server-side)
- **API Routes:** Server endpoints in src/pages/api/ for backend logic
- **CMS Integration:** Strapi, Contentful, Sanity, Storyblok (via loaders)
- **Database:** Optional - Astro DB, Prisma, Drizzle for dynamic data

### Asset Optimization

- **Images:** Built-in <Image /> component with automatic optimization
- **Fonts:** astro-font integration for automatic font optimization
- **Icons:** astro-icon for optimized SVG icon management
- **Static Assets:** Automatic processing from public/ and src/assets/

### Testing & Quality

- **Type Checking:** TypeScript (strict mode recommended)
- **Unit Testing:** Vitest (faster, Vite-native alternative to Jest)
- **E2E Testing:** Playwright or Cypress
- **Linting:** ESLint with astro-eslint-parser
- **Formatting:** Prettier with prettier-plugin-astro
- **Accessibility:** Automated testing with axe-core or pa11y

### Deployment & Infrastructure

- **Static Hosting:** Vercel, Netlify, Cloudflare Pages (zero-config)
- **SSR Hosting:** Vercel, Netlify, Node.js server, Cloudflare Workers, Deno Deploy
- **Adapters:** @astrojs/vercel, @astrojs/netlify, @astrojs/cloudflare, @astrojs/node
- **CI/CD:** GitHub Actions, GitLab CI, or platform-specific CI
- **Edge Deployment:** Cloudflare Pages/Workers for global performance

### Integrations & Plugins

- **Official Integrations:** @astrojs/react, @astrojs/tailwind, @astrojs/mdx, @astrojs/sitemap
- **SEO:** astro-seo for meta tags, automatic sitemap generation
- **Analytics:** Vercel Analytics, Plausible, Fathom (privacy-focused)
- **Auth:** Auth.js (auth-astro) for authentication flows
- **i18n:** astro-i18n-aut or @astrojs/i18n for internationalization

### Performance Targets

- **Core Web Vitals:** LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Lighthouse Score:** 95+ across all metrics
- **JavaScript Payload:** Minimal by default (ship zero JS for static content)
- **Bundle Analysis:** Use astro-compress for post-build optimization
