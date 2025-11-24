## Code commenting best practices - Astro Web Development

### Comment Philosophy

- **Self-Documenting Code First**: Write clear, expressive code that explains itself
- **Comment the Why, Not the What**: Explain reasoning, not implementation
- **Minimal, Purposeful Comments**: Every comment should add value

### Component Documentation

#### Props Documentation (JSDoc)

```astro
---
/**
 * A card component for displaying blog post previews
 * @prop {string} title - The blog post title
 * @prop {string} excerpt - Short description (max 160 chars)
 * @prop {Date} publishDate - When the post was published
 * @prop {string} [author] - Author name (optional)
 * @prop {string} [imageUrl] - Featured image URL (optional)
 */
interface Props {
  title: string;
  excerpt: string;
  publishDate: Date;
  author?: string;
  imageUrl?: string;
}

const { title, excerpt, publishDate, author, imageUrl } = Astro.props;
---
```

#### Complex Logic Comments

```astro
---
// Filter posts to only show published content before today
// This prevents accidentally showing scheduled posts early
const posts = await getCollection('blog', ({ data }) => {
  return !data.draft && data.publishDate <= new Date();
});

// Sort by date descending (newest first)
posts.sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime());
---
```

### File-Level Documentation

#### Component Purpose Header

```astro
---
/**
 * BlogPostCard.astro
 *
 * Displays a preview card for blog posts with image, title, excerpt, and metadata.
 * Used on blog listing pages and related posts sections.
 *
 * Features:
 * - Lazy-loaded optimized images
 * - Responsive design (mobile-first)
 * - Accessible keyboard navigation
 * - Schema.org structured data
 */
---
```

#### API Route Documentation

```typescript
/**
 * POST /api/subscribe
 *
 * Subscribes a user to the newsletter mailing list.
 *
 * Request body:
 *   - email: string (required, valid email format)
 *   - name: string (optional, 2-50 chars)
 *
 * Returns:
 *   - 200: Success with confirmation message
 *   - 400: Validation errors
 *   - 409: Email already subscribed
 *   - 500: Server error
 */
export async function POST({ request }) {
  // Implementation
}
```

### Technical Decision Comments

#### Performance Optimizations

```astro
---
// Using client:idle instead of client:load to defer non-critical JS
// This improves initial page load time by ~200ms on mobile
---

<InteractiveWidget client:idle />
```

#### Browser Compatibility

```astro
<style>
  /* Using gap instead of margin for better RTL support */
  .grid {
    display: grid;
    gap: 1rem;
  }
</style>
```

#### Workarounds & Hacks

```typescript
// WORKAROUND: TypeScript doesn't infer Zod transform types correctly
// Remove this cast when upgrading to Zod v4
const validated = schema.parse(data) as TransformedType;
```

### What NOT to Comment

#### Don't Comment Obvious Code

```astro
---
// Set the title variable to the title prop
const title = Astro.props.title;
---

<!-- BAD: Obvious, adds no value --><!-- GOOD: No comment needed, code is clear -->--- const {title}
= Astro.props; ---
```

#### Don't Comment Out Code

```astro
---
// const oldMethod = () => { ... }
// function deprecatedHelper() { ... }
---

<!-- BAD: Commented-out code --><!-- GOOD: Delete unused code, use version control -->
```

#### Don't Document Changes

```astro
---
// Changed from getStaticPaths to SSR - Dec 2024
// Fixed bug with dates - Nov 2024
---

<!-- BAD: Changelog in comments --><!-- GOOD: Use git commit messages and CHANGELOG.md -->
```

### Content Collections Comments

#### Schema Documentation

```typescript
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().max(100), // SEO best practice: 60-70 chars
    description: z.string().max(160), // Meta description limit
    publishDate: z.date(),
    // draft: true prevents rendering in production build
    draft: z.boolean().default(false),
  }),
});
```

### Configuration Comments

#### Astro Config Documentation

```javascript
// astro.config.mjs
export default defineConfig({
  // Enable hybrid mode: SSG by default, opt-in to SSR per page
  output: 'hybrid',

  // Vercel adapter for edge deployment
  adapter: vercel({
    // Use edge runtime for dynamic routes (faster cold starts)
    edgeMiddleware: true,
  }),

  // Integrations load in order - Tailwind before React
  integrations: [
    tailwind(),
    react(), // Only used for interactive islands
  ],
});
```

### Inline Comments Best Practices

- **Use // for single-line comments**
- **Use /\* \*/ for multi-line explanations**
- **Place comments above the code they explain**
- **Keep comments current with code changes**
- **Delete outdated comments immediately**
- **Avoid redundant comments**

### When to Comment

✅ **DO comment:**

- Complex algorithms or business logic
- Non-obvious performance optimizations
- Workarounds for browser/library bugs
- Public API interfaces (props, exports)
- Why a particular approach was chosen
- Important constraints or limitations
- Regex patterns and what they match

❌ **DON'T comment:**

- What the code does (should be obvious)
- Change history (use git)
- Commented-out code (delete it)
- TODOs that will never be done
- Attribution (use git blame)
- Obvious variable assignments
