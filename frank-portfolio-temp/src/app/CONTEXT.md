# App Router Documentation

## Next.js App Router Architecture

### Route Structure & Organization
- **Single-page application**: All portfolio content served from root route (`page.tsx`)
- **Layout hierarchy**: Root layout (`layout.tsx`) provides theme provider and analytics
- **Metadata optimization**: Static metadata generation for SEO and social sharing
- **File-system routing**: Standard Next.js App Router conventions for future expansion

### Middleware & Security Architecture

#### Middleware (`../middleware.ts`)
- **Subdomain routing**: Secure detection and validation of portfolio variants (general, swe, csr)
- **Host validation**: Whitelist-based host header validation preventing subdomain spoofing
- **Security headers**: Comprehensive security headers including CSP, HSTS, X-Frame-Options
- **Development support**: Local development subdomain simulation via query parameters
- **Variant propagation**: Sets x-subdomain header for downstream component access

### Layout Implementation

#### Root Layout (`layout.tsx`)
- **Theme integration**: ThemeProvider wrapper for dark/light mode functionality
- **Font optimization**: Geist Sans and Geist Mono with CSS custom properties
- **Analytics setup**: Vercel Analytics component for performance monitoring
- **Metadata configuration**: Open Graph, Twitter Cards, and SEO optimization
- **Viewport configuration**: Responsive viewport settings via `generateViewport()`
- **Variant detection**: Reads x-subdomain header to determine portfolio variant

#### Global Styling (`globals.css`)
- **Tailwind CSS 4**: Modern CSS framework with PostCSS integration
- **CSS custom properties**: Theme variables for light/dark mode switching
- **Color system**: OKLCH color space for consistent, accessible colors
- **Component theming**: Comprehensive design token system for UI components
- **Animation framework**: tw-animate-css integration for smooth transitions

### SEO & Meta Management

#### Metadata Strategy
- **Title optimization**: "Frank Palmisano - Software Engineer" with professional keywords
- **Description targeting**: Embedded systems, virtualization, NASA Orion expertise
- **Keyword strategy**: Software Engineer, Embedded Systems, Virtualization, NASA, Aerospace
- **Social optimization**: Open Graph and Twitter Card metadata for link sharing
- **Structured data**: Ready for implementation of JSON-LD structured data

#### Performance Optimization
- **Static generation**: Pre-rendered pages for optimal loading performance
- **Image optimization**: Next.js Image component with automatic optimization
- **Font optimization**: Google Fonts integration with display=swap strategy
- **Bundle optimization**: Automatic code splitting and tree shaking
- **Static asset caching**: Aggressive cache headers for images, fonts, and static resources (1 year)
- **Production optimizations**: Compression enabled, standalone output, poweredBy header disabled

### App Router Patterns

#### Component Integration
- **Server components**: Default server-side rendering for static content
- **Client components**: Strategic use for interactive elements (navbar, theme toggle)
- **Composition pattern**: Portfolio sections composed in main page component
- **Props drilling avoidance**: Theme context for cross-component state

#### Navigation & Routing
- **Smooth scrolling**: CSS scroll-behavior for anchor navigation
- **Section-based navigation**: Hash-based routing to portfolio sections
- **Mobile-friendly navigation**: Responsive navigation with mobile menu
- **Accessibility**: ARIA labels and semantic navigation structure

#### Error Handling & Loading States
- **Global loading state** (`loading.tsx`): Displays loading spinner during route transitions
- **Error boundaries** (`error.tsx`): Graceful error handling with user-friendly UI and recovery options
- **404 page** (`not-found.tsx`): Custom 404 page with navigation options back to portfolio variants
- **Component-level error handling**: ErrorBoundary wrapper for isolated error handling
- **Loading indicators**: Reusable LoadingSpinner and SectionSkeleton components

### Development Patterns

#### TypeScript Integration
- **Strict mode**: Comprehensive type checking for reliable development
- **Path aliases**: `@/*` imports for clean import statements
- **Component typing**: Proper typing for React components and props
- **Metadata typing**: Type-safe metadata configuration

#### Styling Architecture
- **Utility-first CSS**: Tailwind CSS for rapid development and consistency
- **Component variants**: class-variance-authority for type-safe styling
- **Theme system**: CSS custom properties with TypeScript integration
- **Responsive design**: Mobile-first approach with breakpoint-specific styles

## Implementation Decisions

### Single-Page Application Choice
- **Rationale**: Portfolio content benefits from immediate navigation and unified experience
- **SEO considerations**: Single page with comprehensive metadata still SEO-effective for personal portfolio
- **Performance benefits**: Eliminates route transitions, faster user experience
- **Future extensibility**: Can add additional routes for blog, projects, or admin functions

### Theme System Integration
- **next-themes choice**: Robust theme switching with system preference detection
- **CSS custom properties**: Enables theme switching without JavaScript flash
- **OKLCH color space**: Modern color system for consistent accessibility
- **Theme persistence**: LocalStorage persistence for user preference retention

### Analytics Integration
- **Vercel Analytics**: Privacy-focused analytics with performance insights
- **Client-side tracking**: User behavior tracking without personal data collection
- **Performance monitoring**: Core Web Vitals tracking for optimization opportunities
- **Anonymous data**: Respects user privacy while gathering useful insights

## Future Enhancement Opportunities

### Route Expansion
- **Blog integration**: `/blog` route for technical articles and insights
- **Project showcase**: `/projects` route for detailed project presentations
- **Admin interface**: `/admin` route for content management (if needed)
- **API routes**: Backend integration for contact forms and dynamic content

### Performance Optimizations
- **Incremental Static Regeneration**: For dynamic content updates
- **Edge functions**: Enhanced performance with edge computing
- **Progressive Web App**: Service worker integration for offline functionality
- **Image optimization**: Advanced responsive image strategies

### SEO Enhancements
- **Sitemap generation**: Automatic sitemap for search engine discovery
- **Robots.txt optimization**: Search engine crawling configuration
- **Structured data**: JSON-LD implementation for rich search results
- **Schema markup**: Professional profile and organization schema

---

*This App Router implementation prioritizes simplicity, performance, and professional presentation while maintaining extensibility for future portfolio enhancements.*