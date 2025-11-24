## Responsive design best practices - Astro Web Development

### Mobile-First Approach

#### Start with Mobile Layout

```css
/* Base styles: Mobile (320px+) */
.container {
  padding: 1rem;
  width: 100%;
}

.grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Tablet (768px+) */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }

  .grid {
    flex-direction: row;
    gap: 2rem;
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 3rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Standard Breakpoints

#### Tailwind-Aligned Breakpoints

```javascript
// tailwind.config.mjs
export default {
  theme: {
    screens: {
      sm: '640px', // Small devices (large phones)
      md: '768px', // Medium devices (tablets)
      lg: '1024px', // Large devices (desktops)
      xl: '1280px', // Extra large devices
      '2xl': '1536px', // 2X large devices
    },
  },
};
```

#### Using Tailwind Responsive Classes

```astro
<div
  class="flex flex-col gap-4
  md:flex-row md:gap-6
  lg:gap-8"
>
  <div
    class="w-full
    md:w-1/2
    lg:w-1/3"
  >
    Content
  </div>
</div>

<!-- Responsive Typography -->
<h1
  class="text-2xl
  sm:text-3xl
  md:text-4xl
  lg:text-5xl
  font-bold"
>
  Responsive Heading
</h1>

<!-- Responsive Padding -->
<section
  class="px-4 py-8
  sm:px-6 sm:py-12
  lg:px-8 lg:py-16"
>
  Content
</section>
```

### Fluid Layouts

#### CSS Grid Auto-Fit

```css
.grid-auto {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

/* Cards automatically adapt to available space */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}
```

#### Flexbox Wrapping

```css
.flex-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.flex-item {
  flex: 1 1 300px; /* grow shrink basis */
  min-width: 0; /* Prevent overflow */
}
```

### Relative Units

#### Use rem/em for Scalability

```css
/* Root font size */
html {
  font-size: 100%; /* 16px default, respects user settings */
}

/* Typography */
body {
  font-size: 1rem; /* 16px */
  line-height: 1.5; /* 24px */
}

h1 {
  font-size: 2.5rem; /* 40px */
  margin-bottom: 1.5rem;
}

/* Spacing */
.section {
  padding: 2rem; /* 32px */
  margin-bottom: 3rem; /* 48px */
}

/* Responsive with rem */
@media (min-width: 768px) {
  html {
    font-size: 112.5%; /* 18px */
  }
  /* All rem values scale automatically */
}
```

#### Fluid Typography with clamp()

```css
h1 {
  /* min, preferred (viewport-based), max */
  font-size: clamp(2rem, 5vw, 4rem);
}

p {
  font-size: clamp(1rem, 2vw, 1.25rem);
  line-height: 1.6;
}

.container {
  /* Fluid padding */
  padding: clamp(1rem, 5vw, 3rem);
}
```

### Images & Media

#### Responsive Images with Astro

```astro
---
import { Image } from 'astro:assets';
import heroImage from '../assets/hero.jpg';
---

<!-- Automatically responsive with srcset -->
<Image
  src={heroImage}
  alt="Hero image"
  widths={[320, 640, 960, 1280]}
  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 1200px"
/>

<!-- Different images for different sizes -->
<Picture
  src={heroImage}
  widths={[400, 800, 1200]}
  sizes="(max-width: 768px) 100vw, 50vw"
  alt="Responsive hero"
  formats={['avif', 'webp']}
/>
```

#### CSS Responsive Images

```css
img,
video {
  max-width: 100%;
  height: auto;
  display: block;
}

/* Object-fit for aspect ratio control */
.cover-image {
  width: 100%;
  height: 300px;
  object-fit: cover;
}

@media (min-width: 768px) {
  .cover-image {
    height: 400px;
  }
}

/* Aspect ratio boxes */
.video-container {
  aspect-ratio: 16 / 9;
  width: 100%;
}
```

### Touch-Friendly Design

#### Minimum Touch Target Sizes

```css
/* Minimum 44x44px touch targets (WCAG AAA) */
button,
a {
  min-height: 44px;
  min-width: 44px;
  padding: 0.75rem 1.5rem;
}

/* Increase tap target for small elements */
.icon-button {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Spacing between interactive elements */
.button-group {
  display: flex;
  gap: 0.75rem; /* 12px minimum between targets */
}
```

#### Touch-Specific Interactions

```css
/* Hover states don't work well on touch */
@media (hover: hover) {
  .button:hover {
    background-color: var(--color-primary-dark);
  }
}

/* Touch-specific styling */
@media (hover: none) {
  .button:active {
    background-color: var(--color-primary-dark);
  }
}

/* Prevent tap highlight on mobile */
button {
  -webkit-tap-highlight-color: transparent;
}
```

### Responsive Navigation

#### Mobile Menu Pattern

```astro
<nav class="nav">
  <button aria-label="Toggle menu" aria-expanded="false" class="menu-toggle md:hidden"> ☰ </button>

  <ul
    class="menu
    hidden
    md:flex
    md:flex-row"
  >
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
    <li><a href="/contact">Contact</a></li>
  </ul>
</nav>

<script>
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.menu');

  toggle?.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', !expanded);
    menu?.classList.toggle('hidden');
  });
</script>

<style>
  .menu {
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    background: white;
    flex-direction: column;
  }

  @media (min-width: 768px) {
    .menu {
      position: static;
      flex-direction: row;
      gap: 2rem;
    }

    .menu-toggle {
      display: none;
    }
  }
</style>
```

### Container Queries (Modern)

#### Component-Based Responsiveness

```css
/* Container queries respond to parent size, not viewport */
.card-container {
  container-type: inline-size;
  container-name: card;
}

.card {
  padding: 1rem;
}

/* Card layout changes based on its container */
@container card (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 1.5rem;
  }
}

@container card (min-width: 600px) {
  .card {
    grid-template-columns: 300px 1fr;
    padding: 2rem;
  }
}
```

### Performance on Mobile

#### Optimize Images for Mobile

```astro
---
import { Image } from 'astro:assets';
import mobileImage from '../assets/hero-mobile.jpg';
import desktopImage from '../assets/hero-desktop.jpg';
---

<!-- Load different images for mobile vs desktop -->
<picture>
  <source media="(max-width: 768px)" srcset={mobileImage.src} />
  <source media="(min-width: 769px)" srcset={desktopImage.src} />
  <img src={desktopImage.src} alt="Hero" />
</picture>

<!-- Lazy load below-the-fold images -->
<Image src={image} alt="Content" loading="lazy" decoding="async" />
```

#### Conditional Loading

```astro
---
// Don't load heavy components on mobile
const isMobile = Astro.url.searchParams.get('viewport') === 'mobile';
---

{!isMobile && <HeavyComponent client:visible />}

<!-- Load lighter version on mobile -->
<div class="block md:hidden">
  <MobileOptimizedComponent />
</div>

<div class="hidden md:block">
  <DesktopComponent client:idle />
</div>
```

### Readable Typography

#### Line Length and Readability

```css
/* Optimal line length: 45-75 characters */
.prose {
  max-width: 65ch; /* Characters */
  font-size: 1.125rem;
  line-height: 1.75;
}

/* Adjust for mobile */
@media (max-width: 768px) {
  .prose {
    font-size: 1rem;
    line-height: 1.6;
  }
}

/* Scale headings responsively */
h1 {
  font-size: clamp(1.75rem, 4vw, 3rem);
  line-height: 1.2;
}

h2 {
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  line-height: 1.3;
}
```

### Testing Across Devices

#### Browser DevTools

```bash
# Test in browser DevTools responsive mode
# Chrome/Edge: Ctrl+Shift+M (Windows) or Cmd+Shift+M (Mac)
# Firefox: Ctrl+Shift+M (Windows) or Cmd+Opt+M (Mac)

# Common test sizes:
# - 320px (iPhone SE)
# - 375px (iPhone 12/13/14)
# - 768px (iPad)
# - 1024px (iPad Pro, small laptops)
# - 1440px (Desktop)
```

#### Testing Checklist

- [ ] Test on real mobile devices (iOS and Android)
- [ ] Verify touch targets are 44x44px minimum
- [ ] Check horizontal scrolling doesn't occur at any breakpoint
- [ ] Test landscape and portrait orientations
- [ ] Verify images are optimized and lazy-loaded
- [ ] Test with slow 3G network throttling
- [ ] Confirm text is readable without zoom
- [ ] Test forms and inputs on mobile keyboards
- [ ] Verify navigation works on small screens

### Best Practices Summary

- **Mobile-first design** - Start small, enhance for larger screens
- **Use relative units** - rem/em for scalability, avoid fixed px
- **Fluid layouts** - CSS Grid auto-fit, flexbox wrapping
- **Responsive images** - Astro Image component with srcset
- **Touch targets** - Minimum 44x44px, adequate spacing
- **Readable typography** - clamp() for fluid sizing, optimal line length
- **Test on real devices** - Don't rely only on DevTools
- **Performance** - Lazy load images, optimize for mobile networks
- **Container queries** - Component-based responsiveness
- **Accessibility** - Works with zoom up to 200%
