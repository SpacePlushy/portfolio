## CSS best practices - Astro Web Development

### Astro CSS Architecture

#### Scoped Styles (Primary Method)

- **Auto-Scoped by Default**: Styles in `<style>` tags are scoped to the component

  ```astro
  <style>
    /* Only affects elements in this component */
    .container {
      padding: 2rem;
    }

    h1 {
      font-size: 2rem;
    }
  </style>
  ```

- **No Naming Conflicts**: Class names won't collide with other components
- **Better Performance**: Unused styles eliminated at build time

#### Global Styles

```astro
---
import '../styles/global.css';
---

<!-- src/layouts/Layout.astro -->
<html>
  <head>
    <style is:global>
      /* Alternative: inline global styles */
      :root {
        --primary: #3b82f6;
        --secondary: #64748b;
      }

      body {
        font-family: system-ui, sans-serif;
      }
    </style>
  </head>
  <body>
    <slot />
  </body>
</html>
```

#### Mixing Scoped and Global

```astro
<style>
  /* Scoped */
  .card {
    padding: 1rem;
  }

  /* Global - targets all h1 inside .card */
  .card :global(h1) {
    color: var(--primary);
  }

  /* Global - targets .prose anywhere */
  :global(.prose) {
    max-width: 65ch;
  }
</style>
```

### Tailwind CSS Integration

#### Setup and Configuration

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
});
```

#### Tailwind Usage Patterns

```astro
<!-- Utility-first approach -->
<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
  <h1 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Welcome</h1>
  <p class="mt-4 text-lg text-gray-600">Description text</p>
</div>

<!-- With @apply in scoped styles -->
<style>
  .btn {
    @apply inline-flex items-center rounded-md px-4 py-2 font-semibold;
    @apply bg-blue-600 text-white hover:bg-blue-700;
    @apply transition-colors duration-200;
  }
</style>
```

#### Custom Tailwind Configuration

```javascript
// tailwind.config.mjs
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
};
```

### CSS Design Tokens

#### CSS Custom Properties

```css
/* src/styles/tokens.css */
:root {
  /* Colors */
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --color-success: #10b981;
  --color-error: #ef4444;

  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'Fira Code', monospace;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);

  /* Radii */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-full: 9999px;
}

/* Dark mode tokens */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #1e293b;
    --color-text: #f1f5f9;
  }
}
```

#### Using Design Tokens

```astro
<style>
  .button {
    padding: var(--space-sm) var(--space-md);
    background: var(--color-primary);
    border-radius: var(--radius-md);
    font-family: var(--font-sans);
    box-shadow: var(--shadow-md);
  }
</style>
```

### CSS Methodology

#### BEM with Scoped Styles

```astro
<div class="card card--featured">
  <div class="card__header">
    <h2 class="card__title">{title}</h2>
  </div>
  <div class="card__body">
    <p class="card__text">{content}</p>
  </div>
</div>

<style>
  /* Block */
  .card {
    border: 1px solid #ddd;
    border-radius: 0.5rem;
  }

  /* Modifier */
  .card--featured {
    border-color: var(--color-primary);
    border-width: 2px;
  }

  /* Elements */
  .card__header {
    padding: 1rem;
    border-bottom: 1px solid #eee;
  }

  .card__title {
    margin: 0;
    font-size: 1.5rem;
  }

  .card__body {
    padding: 1rem;
  }

  .card__text {
    color: #666;
  }
</style>
```

### Responsive Design with CSS

#### Mobile-First Breakpoints

```css
/* Mobile (default) */
.container {
  padding: 1rem;
}

/* Tablet (768px+) */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .container {
    padding: 3rem;
    max-width: 1280px;
    margin: 0 auto;
  }
}

/* Large Desktop (1280px+) */
@media (min-width: 1280px) {
  .container {
    max-width: 1536px;
  }
}
```

#### Container Queries (Modern Approach)

```css
.card-container {
  container-type: inline-size;
}

.card {
  padding: 1rem;
}

/* Card adapts based on container, not viewport */
@container (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 1fr 2fr;
  }
}
```

### CSS Performance Optimization

#### Critical CSS Inlining

```astro
---
// Inline critical CSS for above-the-fold content
---

<style is:inline>
  /* Inline critical styles for LCP optimization */
  .hero {
    min-height: 100vh;
    background: linear-gradient(to bottom, #3b82f6, #1e40af);
  }
</style>
```

#### Lazy Load Non-Critical CSS

```astro
<!-- Load fonts asynchronously -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin />

<!-- Non-critical styles -->
<link rel="stylesheet" href="/styles/extra.css" media="print" onload="this.media='all'" />
```

#### CSS Purging (Automatic with Tailwind)

```javascript
// tailwind.config.mjs
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  // Tailwind automatically purges unused classes
};
```

### Advanced CSS Features

#### CSS Grid Layouts

```css
.grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

/* Named grid areas */
.page-layout {
  display: grid;
  grid-template-areas:
    'header header'
    'sidebar main'
    'footer footer';
  grid-template-columns: 250px 1fr;
  gap: 1rem;
}

.header {
  grid-area: header;
}
.sidebar {
  grid-area: sidebar;
}
.main {
  grid-area: main;
}
.footer {
  grid-area: footer;
}
```

#### CSS Animations & Transitions

```css
.fade-in {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.button {
  transition: all 0.2s ease;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Dark Mode Support

#### System Preference Dark Mode

```css
:root {
  --bg: white;
  --text: #1a1a1a;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1a1a1a;
    --text: #f5f5f5;
  }
}

body {
  background: var(--bg);
  color: var(--text);
}
```

#### Tailwind Dark Mode

```astro
<div class="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
  <h1 class="text-2xl font-bold">Auto Dark Mode</h1>
</div>
```

### CSS Best Practices Summary

- **Use scoped styles by default** - Avoid global CSS pollution
- **Leverage CSS custom properties** - Maintainable design system
- **Mobile-first responsive design** - Progressive enhancement
- **Minimize CSS bundle size** - Use Tailwind purging, avoid unused code
- **Follow accessibility** - Color contrast, reduced motion support
- **Optimize performance** - Inline critical CSS, lazy load extras
- **Consistent naming** - BEM or utility-first, pick one approach
- **Use modern CSS** - Grid, flexbox, container queries
- **Test cross-browser** - Ensure compatibility with target browsers
- **Respect user preferences** - Dark mode, reduced motion, font size
