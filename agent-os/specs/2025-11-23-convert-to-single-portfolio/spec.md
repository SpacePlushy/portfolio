# Specification: Convert to Single Software Engineer Portfolio

## Goal

Transform the dual-portfolio website into a streamlined single-purpose Software Engineer portfolio focused on Validation Engineer and QA Specialist positioning, removing all customer service content and converting the root route to display the Software Engineer portfolio exclusively.

## User Stories

- As a hiring manager searching for validation engineers, I want to immediately see Frank's aerospace testing experience and technical skills when I visit the portfolio URL
- As Frank, I want my portfolio to exclusively showcase my Software Engineer/QA Engineer/Validation Engineer capabilities without dual-purpose confusion

## Specific Requirements

**Replace Root Route with Software Engineer Portfolio**

- Delete existing `/src/pages/index.astro` (currently PortfolioSelection picker)
- Create new `/src/pages/index.astro` with Software Engineer portfolio content (same structure as current `software-engineer.astro`)
- Delete `/src/pages/software-engineer.astro` (no longer needed)
- Delete `/src/pages/customer-service.astro` entirely
- Root route `/` becomes the primary and only portfolio landing page

**Remove Portfolio Selection Component**

- Delete `/src/components/PortfolioSelection.astro` component
- Remove all references to portfolio selection navigation
- Remove `#portfolio-selection` anchor link from Hero component CTA button

**Update Hero Component for Single Identity**

- Replace dual-purpose tagline with single software engineering focus
- Use resume data: `personal.title` = "Validation Engineer & QA Specialist"
- Update description paragraph to use `about.summary` from resume data
- Update highlight badges to show: "6 Years Aerospace Validation", "Python Automation", "99%+ System Uptime"
- Remove "Explore My Work" button (no portfolio selection needed)
- Keep "Get In Touch" CTA button linking to `#contact`

**Transform About Section to Software Engineering Focus**

- Replace dual-purpose content with single-purpose validation/QA positioning
- Use `about.summary` as primary paragraph
- Display `about.highlights` as bullet points or highlight cards
- Update Quick Stats card to show: "6 Years" experience, "Honeywell Aerospace" company, "NASA Programs" (ISS/Orion), "Python/Linux" primary skills
- Remove customer service statistics and references
- Update section heading to "Validation & QA Expertise" or "About My Experience"

**Rebuild Experience Section from Resume Data**

- Map `experience` array from resume-data.json to component data structure
- Display all 4 positions: Honeywell (2018-2024), Life Jewel (2016-2017), Performance Software (2016), Apple (2014)
- For each experience entry: company, position, location, startDate/endDate, achievements array, technologies array
- Maintain existing Card-based layout with technology badges
- Use time period format: "May 2018 - June 2024" (combine startDate and endDate fields)

**Rebuild Skills Section from Resume Data**

- Map `skills` object categories to component skill categories
- Create skill categories: "Languages" (from skills.languages), "Testing & QA" (from skills.testing), "Tools & Technologies" (from skills.tools + skills.frameworks)
- Remove skill level indicators (Expert/Advanced/Intermediate) - resume data doesn't include proficiency levels
- Display as simple lists within category cards
- Remove "Customer Service Excellence" category entirely

**Create Projects/Achievements Section from Resume Data**

- Use `projects` array (3 projects: File Integrity Validation Tool, iOS Language Learning App, Python Test Automation Scripts)
- For each project: name, description, technologies array, highlights array
- Display in Card grid layout (similar to current AchievementsSection pattern)
- Include technology badges and highlight bullets
- Replace generic "achievements" with concrete "projects" or merge into existing AchievementsSection

**Update Education Section from Resume Data**

- Use `education` array (1 entry: ASU Computer Science B.S.)
- Display: degree + field, institution, graduationMonth + graduationYear, gpa, honors
- Highlights: Parse honors string and additionalDetails into bullet list
- Remove certifications subsection (resume data has empty certifications array)

**Optimize SEO Metadata**

- Update Layout.astro `<title>` tag: use `seo.pageTitle` from resume data
- Update meta description: use `seo.metaDescription` from resume data
- Add Open Graph tags: og:title, og:description, og:type (website), og:url
- Add Twitter Card metadata: twitter:card (summary), twitter:title, twitter:description
- Add JSON-LD structured data for Person schema with name, jobTitle, alumniOf, sameAs (LinkedIn/GitHub)
- Keywords from `seo.keywords` array for reference (not meta tag - deprecated)

**Preserve Design System**

- Keep purple dark mode theme (current Tailwind CSS v4 configuration)
- Maintain all shadcn/ui components (Card, Badge, Button, etc.)
- Keep ThemeToggle functionality and ThemeService
- Preserve current hover states and transition effects
- No changes to color palette or component styling

**Maintain Analytics and Security**

- Keep Vercel Analytics integration unchanged
- Keep BotID middleware and bot protection configuration
- Keep all security headers in vercel.json
- No changes to middleware.js or security infrastructure

## Visual Design

No visual assets provided. User confirmed satisfaction with current design (purple dark mode theme, shadcn/ui components, existing styling). Preserve all current visual patterns.

## Existing Code to Leverage

**Current Software Engineer Portfolio Structure**

- `/src/pages/software-engineer.astro` provides exact page structure to replicate for new index.astro
- Use same component imports and layout pattern
- Maintains consistent Navbar, Hero, section flow, and ContactSection footer

**Existing Section Components Pattern**

- All section components follow consistent structure: Badge header, h2 title, description paragraph, Card grid
- Hero, AboutSection, ExperienceSection, SkillsSection, AchievementsSection, EducationSection all use same shadcn/ui components
- Reuse Card hover effects: `hover:shadow-lg transition-all duration-200 dark:border-muted dark:hover:border-primary/20`

**Resume Data Structure Pattern**

- ExperienceSection shows pattern for mapping data arrays to JSX: `experiences.map((exp) => ...)`
- SkillsSection shows pattern for nested category mapping: `skillCategories.map((category) => ...)`
- Can reuse these iteration patterns for resume-data.json consumption

**Contact Configuration Pattern**

- `/src/config/contact.ts` shows TypeScript interface pattern for structured data
- Create similar pattern for resume data: `/src/config/resume-data.ts` exporting typed resume object
- Allows type-safe import across components: `import { RESUME_DATA } from '@/config/resume-data'`

**Layout and Theme Infrastructure**

- `/src/layouts/Layout.astro` provides metadata pattern and theme initialization script
- Inline script prevents FOUC (flash of unstyled content) - preserve this pattern
- Slot-based layout allows easy page composition

## Out of Scope

- Blog functionality (future spec)
- Dedicated project showcase page with filtering/search (future spec)
- Contact form enhancements (form validation, backend integration) (future spec)
- Testimonials or recommendations section (future spec)
- Resume PDF download feature (future spec)
- Case study pages for individual projects (future spec)
- Analytics dashboard or tracking enhancements (future spec)
- Adding new interactive features or animations beyond current implementation
- Redesigning component library or switching from shadcn/ui (future spec)
- Changing color scheme or theme system architecture (future spec)
- Adding i18n/internationalization support (future spec)
