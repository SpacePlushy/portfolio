## UI accessibility best practices - Astro Web Development

### Semantic HTML Foundation

#### Use Proper HTML5 Elements

```astro
<!-- Good: Semantic structure -->
<header>
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/about">About</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>Page Title</h1>
    <section>
      <h2>Section Heading</h2>
      <p>Content...</p>
    </section>
  </article>
</main>

<footer>
  <p>&copy; 2024 Company Name</p>
</footer>

<!-- Bad: Div soup -->
<div class="header">
  <div class="nav">...</div>
</div>
```

### Keyboard Navigation

#### Focus Management

```astro
<style>
  /* Visible focus indicators */
  :focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  /* Custom focus for specific elements */
  button:focus-visible {
    outline: 3px solid #3b82f6;
    outline-offset: 2px;
  }

  /* Don't remove outlines without replacement */
  /* BAD: button:focus { outline: none; } */
</style>

<!-- Skip to main content link -->
<a href="#main" class="skip-link"> Skip to main content </a>

<main id="main" tabindex="-1">
  <!-- Content -->
</main>

<style>
  .skip-link {
    position: absolute;
    left: -9999px;
  }

  .skip-link:focus {
    left: 0;
    top: 0;
    z-index: 9999;
    padding: 1rem;
    background: white;
  }
</style>
```

#### Interactive Elements

```astro
<!-- Buttons for actions -->
<button type="button" aria-label="Close dialog">
  <span aria-hidden="true">&times;</span>
</button>

<!-- Links for navigation -->
<a href="/page">Go to page</a>

<!-- Don't use div/span as buttons -->
<!-- BAD: <div onclick="...">Click me</div> -->

<!-- Form controls with labels -->
<label for="email">Email address</label>
<input type="email" id="email" name="email" required aria-describedby="email-help" />
<span id="email-help">We'll never share your email</span>
```

### ARIA Attributes

#### When to Use ARIA

```astro
<!-- Only use ARIA when HTML isn't sufficient --><!-- Good: Native HTML (no ARIA needed) -->
<button>Submit</button>

<!-- ARIA for enhanced semantics -->
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li aria-current="page">Current Page</li>
  </ol>
</nav>

<!-- Modal dialog pattern -->
<div role="dialog" aria-labelledby="dialog-title" aria-describedby="dialog-desc" aria-modal="true">
  <h2 id="dialog-title">Confirm Action</h2>
  <p id="dialog-desc">Are you sure you want to proceed?</p>
  <button>Confirm</button>
  <button>Cancel</button>
</div>
```

#### Common ARIA Patterns

```astro
<!-- Accordion -->
<button aria-expanded="false" aria-controls="panel-1"> Accordion Header </button>
<div id="panel-1" hidden>Accordion content</div>

<!-- Tab panel -->
<div role="tablist">
  <button role="tab" aria-selected="true" aria-controls="panel-1"> Tab 1 </button>
  <button role="tab" aria-selected="false" aria-controls="panel-2"> Tab 2 </button>
</div>
<div role="tabpanel" id="panel-1">Panel 1 content</div>
<div role="tabpanel" id="panel-2" hidden>Panel 2 content</div>

<!-- Live regions for dynamic content -->
<div role="status" aria-live="polite">
  {statusMessage}
</div>

<div role="alert" aria-live="assertive">
  {errorMessage}
</div>
```

### Images and Media

#### Alternative Text

```astro
<!-- Informative images -->
<Image src={post.image} alt="Screenshot of the dashboard showing revenue trends" />

<!-- Decorative images -->
<Image src={decorativePattern} alt="" aria-hidden="true" />

<!-- Complex images with long descriptions -->
<figure>
  <Image src={chart} alt="Bar chart comparing sales data" aria-describedby="chart-description" />
  <figcaption id="chart-description">Detailed description of the chart data...</figcaption>
</figure>

<!-- Icons with meaning -->
<button>
  <svg aria-hidden="true" focusable="false">
    <!-- icon path -->
  </svg>
  <span>Delete</span>
</button>

<!-- Icon-only buttons -->
<button aria-label="Close">
  <svg aria-hidden="true">
    <!-- close icon -->
  </svg>
</button>
```

#### Video and Audio

```astro
<video controls>
  <source src="/video.mp4" type="video/mp4" />
  <track kind="captions" src="/captions-en.vtt" srclang="en" label="English" />
  <track kind="descriptions" src="/descriptions-en.vtt" srclang="en" label="English descriptions" />
</video>
```

### Color and Contrast

#### Minimum Contrast Ratios

```css
/* WCAG AA: 4.5:1 for normal text, 3:1 for large text */
/* WCAG AAA: 7:1 for normal text, 4.5:1 for large text */

:root {
  /* Good contrast (7.4:1) */
  --color-text: #1a1a1a;
  --color-bg: #ffffff;

  /* Interactive elements minimum 3:1 */
  --color-border: #767676;
}

/* Don't rely solely on color */
.error {
  color: #dc2626;
  border-left: 4px solid #dc2626; /* Visual indicator */
}

.error::before {
  content: '⚠️ '; /* Icon indicator */
}
```

#### Test Contrast

```bash
# Use automated tools
npx pa11y-ci http://localhost:4321
npm run lighthouse -- --only-categories=accessibility
```

### Forms Accessibility

#### Accessible Form Patterns

```astro
<form>
  <!-- Required fields -->
  <label for="name">
    Name <span aria-label="required">*</span>
  </label>
  <input type="text" id="name" name="name" required aria-required="true" />

  <!-- Error messages -->
  <label for="email">Email</label>
  <input type="email" id="email" name="email" aria-invalid="true" aria-describedby="email-error" />
  <span id="email-error" role="alert"> Please enter a valid email address </span>

  <!-- Fieldsets for groups -->
  <fieldset>
    <legend>Choose your plan</legend>
    <label>
      <input type="radio" name="plan" value="basic" />
      Basic
    </label>
    <label>
      <input type="radio" name="plan" value="pro" />
      Pro
    </label>
  </fieldset>

  <button type="submit">Submit form</button>
</form>
```

### Responsive Text and Zoom

#### Support Text Scaling

```css
/* Use rem/em for scalable text */
html {
  font-size: 100%; /* Respect user preferences */
}

body {
  font-size: 1rem;
  line-height: 1.5;
}

h1 {
  font-size: 2.5rem; /* Scales with user settings */
}

/* Avoid fixed heights that break zoom */
/* BAD: .container { height: 500px; } */

/* Good: Let content determine height */
.container {
  min-height: 20rem;
  padding: 2rem;
}

/* Support 200% zoom without horizontal scroll */
.container {
  max-width: 100%;
  overflow-wrap: break-word;
}
```

### Screen Reader Support

#### Visually Hidden Text

```css
/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

#### Screen Reader Announcements

```astro
<button id="add-to-cart"> Add to cart </button>
<div role="status" aria-live="polite" class="sr-only">
  {cartMessage}
</div>

<script>
  const button = document.getElementById('add-to-cart');
  const status = document.querySelector('[role="status"]');

  button?.addEventListener('click', () => {
    // Update status for screen readers
    if (status) {
      status.textContent = 'Item added to cart';
    }
  });
</script>
```

### Testing Accessibility

#### Automated Testing

```bash
# Install axe-core
npm install --save-dev @axe-core/cli

# Run accessibility audit
npx axe http://localhost:4321

# Lighthouse CI
npm install -g @lhci/cli
lhci autorun --collect.url=http://localhost:4321
```

#### Manual Testing Checklist

- [ ] Navigate entire site using only keyboard (Tab, Enter, Space, Arrow keys)
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Verify 200% zoom doesn't break layout
- [ ] Check color contrast with DevTools
- [ ] Test forms with validation errors
- [ ] Verify focus indicators are visible
- [ ] Test with JavaScript disabled (progressive enhancement)
- [ ] Check heading hierarchy is logical

### Best Practices Summary

- **Use semantic HTML5 elements** - nav, main, article, aside, section
- **Provide keyboard navigation** - All functionality accessible via keyboard
- **Maintain color contrast** - Minimum 4.5:1 for text, 3:1 for UI components
- **Write descriptive alt text** - Describe meaning, not appearance
- **Use ARIA appropriately** - Only when HTML isn't sufficient
- **Label all form controls** - Programmatic label association
- **Support text scaling** - Use relative units (rem/em)
- **Test with real users** - Screen readers, keyboard-only navigation
- **Provide skip links** - Bypass repetitive navigation
- **Manage focus** - Modals, SPAs, dynamic content
