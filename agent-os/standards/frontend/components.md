## UI component best practices - Astro Web Development

### Astro Component Architecture

#### Server-First Components
- **Default to Static**: Astro components are server-rendered by default (zero JS)
- **Add Interactivity Sparingly**: Use framework components only when truly needed
  ```astro
  <!-- Static Astro component - no JS shipped -->
  <Card title="Hello" />

  <!-- Interactive React component - JS hydrated on client -->
  <InteractiveCard client:idle title="Hello" />
  ```
- **Partial Hydration**: Use islands architecture for selective interactivity
- **Component Hierarchy**: Static wrapper → Dynamic islands

#### Component Structure
```astro
---
// 1. Imports (Astro/framework, then components, then utilities)
import Layout from '../layouts/Layout.astro';
import Button from './Button.astro';
import type { Post } from '../types';

// 2. Props interface with TypeScript
interface Props {
  title: string;
  posts: Post[];
  showDrafts?: boolean;
}

// 3. Destructure props with defaults
const { title, posts, showDrafts = false } = Astro.props;

// 4. Data fetching and logic
const filteredPosts = posts.filter(post => showDrafts || !post.draft);
---

<!-- 5. Template markup -->
<div class="container">
  <h1>{title}</h1>
  {filteredPosts.map(post => (
    <article>...</article>
  ))}
</div>

<!-- 6. Scoped styles (optional) -->
<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
</style>
```

### Component Design Principles

#### Single Responsibility
- **One Purpose**: Each component does one thing well
  ```
  ✅ Good: BlogPostCard, UserAvatar, SearchBar
  ❌ Bad: PageContent (too generic), BlogStuff (unclear)
  ```
- **Focused Scope**: Component handles its own domain, nothing more

#### Reusability & Props
- **Flexible Props**: Design for multiple contexts
  ```astro
  ---
  interface Props {
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    as?: 'button' | 'a';
    href?: string;
  }
  ---
  ```
- **Sensible Defaults**: Reduce boilerplate for common use cases
- **Prop Validation**: Use Zod for complex prop validation
  ```astro
  ---
  import { z } from 'astro:schema';

  const propsSchema = z.object({
    items: z.array(z.object({ id: z.string(), name: z.string() })),
    onSelect: z.function().optional(),
  });

  const props = propsSchema.parse(Astro.props);
  ---
  ```

#### Composition Over Inheritance
```astro
<!-- Card.astro - composable wrapper -->
---
interface Props {
  padding?: boolean;
  bordered?: boolean;
}
const { padding = true, bordered = false } = Astro.props;
---
<div class:list={['card', { padding, bordered }]}>
  <slot />
</div>

<!-- BlogPostCard.astro - composes Card -->
---
import Card from './Card.astro';
import type { CollectionEntry } from 'astro:content';

interface Props {
  post: CollectionEntry<'blog'>;
}
---
<Card padding bordered>
  <h2>{Astro.props.post.data.title}</h2>
  <slot />
</Card>
```

### Slot Patterns

#### Named Slots for Flexibility
```astro
<!-- Modal.astro -->
<div class="modal">
  <header class="modal-header">
    <slot name="header" />
  </header>
  <div class="modal-body">
    <slot />
  </div>
  <footer class="modal-footer">
    <slot name="footer" />
  </footer>
</div>

<!-- Usage -->
<Modal>
  <h2 slot="header">Confirm Action</h2>
  <p>Are you sure?</p>
  <div slot="footer">
    <Button>Confirm</Button>
    <Button variant="ghost">Cancel</Button>
  </div>
</Modal>
```

#### Default Slot Content
```astro
<div class="alert">
  <slot>
    <!-- Fallback content if no slot provided -->
    <p>No message provided</p>
  </slot>
</div>
```

### Framework Island Components

#### When to Use Framework Components
✅ **Use when you need:**
- Complex client-side interactivity (dropdowns, modals, forms)
- Real-time updates (live search, notifications)
- Stateful UI (shopping cart, multi-step forms)
- Third-party libraries that require React/Vue/Svelte

❌ **Don't use when:**
- Content is purely static
- Simple show/hide can be done with CSS/vanilla JS
- Navigation doesn't require SPA routing
- Forms can use progressive enhancement

#### Client Directive Strategy
```astro
<!-- Critical interaction - load immediately -->
<MobileNav client:load />

<!-- Non-critical - load when browser idle -->
<Newsletter client:idle />

<!-- Below fold - load when visible -->
<CommentSection client:visible />

<!-- Responsive - load based on media query -->
<DesktopSidebar client:media="(min-width: 768px)" />

<!-- SPA-only component - skip SSR -->
<ClientOnlyWidget client:only="react" />
```

### Performance Optimization

#### Lazy Loading Components
```astro
---
// Conditionally import heavy components
const showMap = Astro.url.searchParams.has('map');
let Map;
if (showMap) {
  Map = (await import('./Map.astro')).default;
}
---
{showMap && Map && <Map client:visible />}
```

#### Minimize Client JavaScript
```astro
<!-- BAD: Unnecessary framework component -->
<ReactButton client:load onClick={handleClick}>
  Click me
</ReactButton>

<!-- GOOD: Vanilla HTML with progressive enhancement -->
<button id="btn" class="btn-primary">
  Click me
</button>
<script>
  document.getElementById('btn')?.addEventListener('click', () => {
    // Handle click
  });
</script>
```

### State Management

#### Component-Level State
- **Keep State Local**: State in the component that owns it
- **Lift State Up**: Only when multiple components need it
- **Framework State**: Use React hooks, Vue reactivity, Svelte stores within islands

#### Shared State Across Islands
```typescript
// src/lib/store.ts
import { atom } from 'nanostores';

export const cartCount = atom(0);

// In React island
import { useStore } from '@nanostores/react';
import { cartCount } from '../lib/store';

function CartBadge() {
  const count = useStore(cartCount);
  return <span>{count}</span>;
}
```

### Styling Components

#### Scoped Styles (Preferred)
```astro
<div class="card">
  <h2 class="title">{title}</h2>
</div>

<style>
  /* Automatically scoped to this component */
  .card {
    padding: 1rem;
    border: 1px solid #ddd;
  }

  .title {
    font-size: 1.5rem;
    font-weight: bold;
  }
</style>
```

#### Tailwind Utility Classes
```astro
<div class="rounded-lg border border-gray-200 p-6 shadow-sm">
  <h2 class="text-2xl font-bold text-gray-900">{title}</h2>
</div>
```

#### Global Styles with :global()
```astro
<style>
  /* Scoped to component */
  .card {
    padding: 1rem;
  }

  /* Global - affects all .prose elements */
  :global(.prose h1) {
    color: var(--primary);
  }

  /* Nested scope + global */
  .card :global(a) {
    color: blue;
  }
</style>
```

### Component Documentation

#### Props Documentation with JSDoc
```astro
---
/**
 * Button component with multiple variants and sizes
 *
 * @example
 * <Button variant="primary" size="lg">Submit</Button>
 *
 * @example
 * <Button as="a" href="/about">Learn More</Button>
 */
interface Props {
  /** Button style variant */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Render as different element */
  as?: 'button' | 'a';
  /** Link href (when as="a") */
  href?: string;
  /** Disable interaction */
  disabled?: boolean;
}
---
```

### Testing Components

#### Component Tests with Vitest
```typescript
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, test } from 'vitest';
import Card from './Card.astro';

test('Card renders with title', async () => {
  const container = await AstroContainer.create();
  const result = await container.renderToString(Card, {
    props: { title: 'Test Card' },
  });

  expect(result).toContain('Test Card');
});
```

### Best Practices Summary

- **Static by default, interactive by exception**
- **Use Astro components for content, framework components for interactivity**
- **Compose small, focused components into larger ones**
- **Type all props with TypeScript interfaces**
- **Use named slots for flexible composition**
- **Choose the right client directive for each island**
- **Keep client JavaScript minimal**
- **Prefer scoped styles over global CSS**
- **Document complex components with JSDoc**
- **Test critical component logic**
