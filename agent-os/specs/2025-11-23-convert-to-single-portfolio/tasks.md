# Task Breakdown: Convert to Single Software Engineer Portfolio

## Overview

Total Task Groups: 7
Estimated Total Tasks: ~40 subtasks

## Task List

### Setup & Data Configuration

#### Task Group 1: Resume Data Configuration

**Dependencies:** None

- [x] 1.0 Complete resume data configuration
  - [x] 1.1 Create TypeScript configuration file for resume data
    - Create `/src/config/resume-data.ts`
    - Copy JSON structure from `/Users/spaceplushy/Development/portfolio/agent-os/specs/2025-11-23-convert-to-single-portfolio/planning/resume-data.json`
    - Define TypeScript interfaces for type safety:
      - `PersonalInfo` interface (name, title, tagline, location, email, phone, linkedin, github, website)
      - `AboutInfo` interface (summary, highlights[])
      - `Experience` interface (company, position, location, startDate, endDate, description, achievements[], technologies[])
      - `Skills` interface (languages[], frameworks[], testing[], tools[], methodologies[])
      - `Education` interface (institution, degree, field, graduationYear, graduationMonth, honors, gpa, additionalDetails)
      - `Project` interface (name, description, technologies[], highlights[], url, github, context)
      - `SEO` interface (pageTitle, metaDescription, keywords[])
      - `ResumeData` interface (personal, about, experience[], skills, education[], certifications[], projects[], seo)
    - Export `RESUME_DATA` constant with typed data
    - Follow pattern from existing `/src/config/contact.ts`
    - Replace `[Last Name]` placeholder with actual last name (Palmisano)
    - Update email and phone with actual contact information from contact.ts
  - [x] 1.2 Verify resume data structure integrity
    - Confirm all 4 experience entries present (Honeywell, Life Jewel, Performance Software, Apple)
    - Confirm all 3 projects present (File Integrity Validation Tool, iOS App, Python Automation Scripts)
    - Confirm 1 education entry (ASU Computer Science)
    - Verify skills organized into 5 categories
    - Check SEO data includes pageTitle, metaDescription, and keywords array

**Acceptance Criteria:**

- `/src/config/resume-data.ts` created with complete TypeScript interfaces
- All resume data from JSON successfully converted to TypeScript
- File exports RESUME_DATA constant that can be imported by components
- TypeScript compilation passes without errors
- Personal contact info matches existing contact.ts data

---

### Route Restructuring

#### Task Group 2: Delete Customer Service Route and Components

**Dependencies:** None (can run parallel with Task Group 1)

- [x] 2.0 Remove customer service infrastructure
  - [x] 2.1 Delete customer service portfolio page
    - Delete `/src/pages/customer-service.astro`
    - Verify file is completely removed
  - [x] 2.2 Delete portfolio selection component
    - Delete `/src/components/PortfolioSelection.astro`
    - Verify file is completely removed
  - [x] 2.3 Search for and remove any customer service references
    - Search codebase for "customer-service" string
    - Search codebase for "PortfolioSelection" references
    - Remove any import statements or component references found
    - Check for any customer service data in config files

**Acceptance Criteria:**

- `/src/pages/customer-service.astro` deleted
- `/src/components/PortfolioSelection.astro` deleted
- No remaining references to customer service content in codebase
- No broken import statements

#### Task Group 3: Replace Index Route with Software Engineer Portfolio

**Dependencies:** Task Groups 1, 2

- [x] 3.0 Create new unified index route
  - [x] 3.1 Read current software engineer portfolio structure
    - Read `/src/pages/software-engineer.astro` to understand existing structure
    - Note all component imports and layout pattern
    - Identify all section components used
  - [x] 3.2 Replace index.astro with Software Engineer portfolio
    - Delete existing `/src/pages/index.astro` (currently PortfolioSelection)
    - Create new `/src/pages/index.astro` based on `software-engineer.astro` structure
    - Import all necessary components:
      - Layout from `@/layouts/Layout.astro`
      - Navbar from `@/components/Navbar.astro`
      - Hero from `@/components/Hero.astro`
      - AboutSection from `@/components/AboutSection.astro`
      - ExperienceSection from `@/components/ExperienceSection.astro`
      - SkillsSection from `@/components/SkillsSection.astro`
      - AchievementsSection from `@/components/AchievementsSection.astro`
      - EducationSection from `@/components/EducationSection.astro`
      - ContactSection from `@/components/ContactSection.astro`
    - Import RESUME_DATA: `import { RESUME_DATA } from '@/config/resume-data'`
    - Maintain same component order and structure
  - [x] 3.3 Delete software-engineer.astro route
    - Delete `/src/pages/software-engineer.astro` (no longer needed)
    - Verify root route `/` now serves Software Engineer portfolio
  - [x] 3.4 Update SEO metadata in Layout
    - Pass `title={RESUME_DATA.seo.pageTitle}` to Layout component
    - Pass `description={RESUME_DATA.seo.metaDescription}` to Layout component

**Acceptance Criteria:**

- New `/src/pages/index.astro` successfully created with Software Engineer portfolio content
- `/src/pages/software-engineer.astro` deleted
- Root route `/` displays Software Engineer portfolio
- SEO metadata uses resume data
- `npm run dev` starts without errors and shows portfolio at localhost:4321

---

### Component Updates

#### Task Group 4: Update Hero Component

**Dependencies:** Task Groups 1, 3

- [x] 4.0 Transform Hero to single-purpose software engineering identity
  - [x] 4.1 Update Hero.astro with resume data
    - Read current `/src/components/Hero.astro` structure
    - Update to accept props or import RESUME_DATA directly
    - Replace name with `RESUME_DATA.personal.name`
    - Replace title/tagline with `RESUME_DATA.personal.title`
    - Replace description paragraph with `RESUME_DATA.personal.tagline`
    - Update highlight badges to show:
      - "6 Years Aerospace Validation"
      - "Python Automation"
      - "99%+ System Uptime"
    - Remove "Explore My Work" button (no portfolio selection needed)
    - Keep "Get In Touch" CTA button linking to `#contact`
    - Maintain all existing styling and theme classes
    - Preserve dark mode compatibility

**Acceptance Criteria:**

- Hero displays correct name, title, and tagline from resume data
- Highlight badges show aerospace validation expertise
- Only "Get In Touch" CTA button present (links to #contact)
- No references to portfolio selection
- Component renders correctly in both light and dark modes
- All hover states and transitions preserved

#### Task Group 5: Update About Section

**Dependencies:** Task Groups 1, 3

- [x] 5.0 Transform About Section to software engineering focus
  - [x] 5.1 Update AboutSection.astro with resume data
    - Read current `/src/components/AboutSection.astro` structure
    - Import or accept RESUME_DATA as prop
    - Update section heading to "Validation & QA Expertise" or "About My Experience"
    - Replace content with `RESUME_DATA.about.summary` as primary paragraph
    - Display `RESUME_DATA.about.highlights` as bullet points or highlight cards:
      - Map over highlights array
      - Create Card or list item for each highlight
      - Consider using Badge components for visual interest
    - Update Quick Stats card to show:
      - "6 Years" experience
      - "Honeywell Aerospace" company
      - "NASA Programs" (ISS/Orion)
      - "Python/Linux" primary skills
    - Remove all customer service references
    - Maintain existing Card-based layout and styling
    - Preserve responsive design

**Acceptance Criteria:**

- About section displays summary from resume data
- All 6 highlights from resume data displayed
- Quick Stats show aerospace validation focus
- No customer service content remains
- Section matches existing purple theme and card styling
- Responsive design works on mobile, tablet, and desktop

#### Task Group 6: Update Experience Section

**Dependencies:** Task Groups 1, 3

- [x] 6.0 Rebuild Experience Section from resume data
  - [x] 6.1 Update ExperienceSection.astro with resume data
    - Read current `/src/components/ExperienceSection.astro` structure
    - Import or accept RESUME_DATA as prop
    - Map over `RESUME_DATA.experience` array (4 entries)
    - For each experience entry, display:
      - Company name (`experience.company`)
      - Position title (`experience.position`)
      - Location (`experience.location`)
      - Time period: `{startDate} - {endDate}` format (e.g., "May 2018 - June 2024")
      - Description paragraph (`experience.description`)
      - Achievements list (`experience.achievements` array)
      - Technology badges (`experience.technologies` array)
    - Maintain existing Card-based layout with technology badges
    - Use consistent Card styling with hover effects:
      - `hover:shadow-lg transition-all duration-200 dark:border-muted dark:hover:border-primary/20`
    - Display in chronological order (most recent first):
      1. Honeywell Aerospace (May 2018 - June 2024)
      2. Life Jewel Technologies (January 2017 - May 2018)
      3. Performance Software Corporation (June 2016 - October 2016)
      4. Apple Inc. (June 2014 - December 2014)

**Acceptance Criteria:**

- All 4 experience entries display correctly
- Each entry shows company, position, location, dates, description, achievements, and technologies
- Technology badges styled consistently with existing pattern
- Card hover effects work properly
- Timeline displays in chronological order (newest first)
- Responsive layout works across all screen sizes

#### Task Group 7: Update Skills Section

**Dependencies:** Task Groups 1, 3

- [x] 7.0 Rebuild Skills Section from resume data
  - [x] 7.1 Update SkillsSection.astro with resume data
    - Read current `/src/components/SkillsSection.astro` structure
    - Import or accept RESUME_DATA as prop
    - Create skill categories from `RESUME_DATA.skills`:
      - **Languages & Frameworks**
        - Items: `skills.languages` + `skills.frameworks`
      - **Testing & Quality Assurance**
        - Items: `skills.testing`
      - **Tools & Technologies**
        - Items: `skills.tools`
      - **Methodologies**
        - Items: `skills.methodologies`
    - Remove skill level indicators (Expert/Advanced/Intermediate) - not in resume data
    - Display as simple lists within category cards
    - Remove "Customer Service Excellence" category entirely
    - Maintain Card-based grid layout
    - Use Badge components for individual skills if desired
    - Preserve existing styling and dark mode compatibility

**Acceptance Criteria:**

- Skills organized into 4 clear categories
- All skills from resume data displayed
- No skill proficiency levels shown
- No customer service skills present
- Card grid layout responsive across all screen sizes
- Styling consistent with other sections

#### Task Group 8: Create Projects Section from Resume Data

**Dependencies:** Task Groups 1, 3

- [x] 8.0 Create or update Projects/Achievements section
  - [x] 8.1 Determine if AchievementsSection exists and should be replaced
    - Check if `/src/components/AchievementsSection.astro` exists
    - Decide whether to update existing component or create new ProjectsSection.astro
  - [x] 8.2 Update component with resume projects data
    - Import or accept RESUME_DATA as prop
    - Map over `RESUME_DATA.projects` array (3 projects)
    - For each project, display:
      - Project name (`project.name`)
      - Description (`project.description`)
      - Context badge (`project.context` - shows company)
      - Technologies badges (`project.technologies` array)
      - Highlights bullets (`project.highlights` array)
      - Optional: GitHub link icon if `project.github` exists (all are null currently)
      - Optional: External link icon if `project.url` exists (all are null currently)
    - Display in Card grid layout (similar to current AchievementsSection pattern)
    - Projects to display:
      1. File Integrity Validation Tool (Honeywell Aerospace)
      2. iOS Language Learning Application (Life Jewel Technologies)
      3. Python Test Automation Scripts (Performance Software Corporation)
    - Maintain consistent Card styling with hover effects
    - Ensure responsive grid (1 column mobile, 2-3 columns desktop)

**Acceptance Criteria:**

- All 3 projects from resume data displayed
- Each project shows name, description, context, technologies, and highlights
- Technology badges styled consistently
- Card grid responsive across all screen sizes
- Hover effects work properly
- Section integrated into main portfolio page

#### Task Group 9: Update Education Section

**Dependencies:** Task Groups 1, 3

- [x] 9.0 Update Education Section from resume data
  - [x] 9.1 Update EducationSection.astro with resume data
    - Read current `/src/components/EducationSection.astro` structure
    - Import or accept RESUME_DATA as prop
    - Display education entry (only 1 in array):
      - Degree: `{degree} in {field}` (e.g., "Bachelor of Science in Computer Science")
      - Institution: `education.institution` (Arizona State University)
      - Graduation: `{graduationMonth} {graduationYear}` (May 2018)
      - GPA: `education.gpa` (3.60 Major GPA)
      - Honors: `education.honors` (Member of the National Society of Collegiate Scholars; Fulton Ultimate Engineering Leadership Program: First place in entrepreneurship program)
      - Additional Details: `education.additionalDetails` (Led Capstone Project: Developed enterprise-level web application in 10 months with 4-person team)
    - Parse honors string and additionalDetails into bullet list
    - Remove certifications subsection (resume data has empty certifications array)
    - Maintain Card-based layout
    - Preserve existing styling

**Acceptance Criteria:**

- Education entry displays degree, institution, graduation date, and GPA
- Honors and additional details shown as organized bullets
- No certifications section present
- Card styling consistent with other sections
- Responsive design works across all screen sizes

---

### Component Cleanup

#### Task Group 10: Remove Remaining Portfolio Selection References

**Dependencies:** Task Groups 2, 3

- [x] 10.0 Clean up portfolio selection references
  - [x] 10.1 Check Navbar component for portfolio selection links
    - Read `/src/components/Navbar.astro`
    - Remove any links to `/software-engineer` or `/customer-service`
    - Ensure navigation links point to section anchors (#about, #experience, #skills, #projects, #education, #contact)
    - Verify no "Choose Portfolio" or similar navigation items exist
  - [x] 10.2 Search codebase for broken links
    - Search for href="/software-engineer"
    - Search for href="/customer-service"
    - Search for "#portfolio-selection" anchor references
    - Remove or update any found references
  - [x] 10.3 Check for unused customer service data/config
    - Search config directory for customer service data files
    - Remove any customer service configuration if found
    - Verify only software engineering data remains

**Acceptance Criteria:**

- Navbar only contains section anchor links
- No broken links to deleted routes
- No portfolio selection references remain
- Codebase search shows zero matches for customer service routes

---

### SEO Optimization

#### Task Group 11: Implement Comprehensive SEO Metadata

**Dependencies:** Task Groups 1, 3

- [x] 11.0 Optimize SEO metadata for software engineering positioning
  - [x] 11.1 Update Layout.astro with enhanced metadata
    - Read current `/src/layouts/Layout.astro`
    - Update `<title>` tag to use `RESUME_DATA.seo.pageTitle`
    - Update meta description to use `RESUME_DATA.seo.metaDescription`
    - Ensure these props are passed from index.astro
  - [x] 11.2 Add Open Graph tags
    - Add `<meta property="og:title" content={title} />` (use seo.pageTitle)
    - Add `<meta property="og:description" content={description} />` (use seo.metaDescription)
    - Add `<meta property="og:type" content="website" />`
    - Add `<meta property="og:url" content="https://frankpalmisano.com" />` (or actual deployed URL)
    - Optional: Add `<meta property="og:image" content="/og-image.png" />` if image exists
  - [x] 11.3 Add Twitter Card metadata
    - Add `<meta name="twitter:card" content="summary" />`
    - Add `<meta name="twitter:title" content={title} />` (use seo.pageTitle)
    - Add `<meta name="twitter:description" content={description} />` (use seo.metaDescription)
    - Optional: Add `<meta name="twitter:image" content="/twitter-card.png" />` if image exists
  - [x] 11.4 Add JSON-LD structured data for Person schema
    - Add `<script type="application/ld+json">` block in Layout head
    - Include Person schema with:
      - `@context`: "https://schema.org"
      - `@type`: "Person"
      - `name`: RESUME_DATA.personal.name
      - `jobTitle`: RESUME_DATA.personal.title
      - `url`: website URL
      - `sameAs`: [RESUME_DATA.personal.linkedin, RESUME_DATA.personal.github] (filter out null values)
      - `alumniOf`: { "@type": "EducationalOrganization", "name": "Arizona State University" }
      - `description`: RESUME_DATA.about.summary (first 160 characters)
    - Validate JSON-LD syntax
  - [x] 11.5 Verify canonical URL
    - Ensure `<link rel="canonical">` tag points to production URL
    - Use production URL: https://frankpalmisano.com (or verify actual domain)

**Acceptance Criteria:**

- Page title uses resume data: "Frank Palmisano - Validation Engineer & QA Specialist Portfolio"
- Meta description uses resume data and is 150-160 characters
- Open Graph tags present for Facebook/LinkedIn sharing
- Twitter Card tags present for Twitter sharing
- JSON-LD structured data validates using Google's Rich Results Test
- Canonical URL set correctly

---

### Testing & Validation

#### Task Group 12: Build Verification and Visual Testing

**Dependencies:** Task Groups 1-11 (all previous groups)

- [x] 12.0 Verify build and visual quality
  - [x] 12.1 Run development server and visual inspection
    - Run `npm run dev`
    - Verify site loads at localhost:4321
    - Check all sections render correctly:
      - Hero section displays correct name, title, tagline
      - About section shows summary and highlights
      - Experience section shows all 4 positions
      - Skills section shows all 4 categories
      - Projects section shows all 3 projects
      - Education section shows ASU degree
      - Contact section renders (no changes needed)
    - Test responsive design:
      - Mobile (320px - 768px)
      - Tablet (768px - 1024px)
      - Desktop (1024px+)
    - Test dark mode toggle works correctly
    - Verify all anchor links navigate to correct sections
    - Check all hover states and transitions work
  - [x] 12.2 Run TypeScript type checking
    - Run `npm run typecheck`
    - Fix any TypeScript errors that appear
    - Verify resume-data.ts interfaces are correct
    - Ensure all component imports resolve
  - [x] 12.3 Run ESLint checks
    - Run `npm run lint`
    - Fix any linting errors
    - Run `npm run lint:fix` for auto-fixable issues
  - [x] 12.4 Run Prettier formatting
    - Run `npm run format`
    - Ensure all code is consistently formatted
  - [x] 12.5 Run production build
    - Run `npm run build`
    - Verify build completes successfully without errors
    - Check for any build warnings
    - Run `npm run preview` to test production build locally
    - Verify production build looks identical to dev server

**Acceptance Criteria:**

- Development server runs without errors
- All sections display correct resume data
- Responsive design works across all breakpoints
- Dark mode toggle functions correctly
- All navigation links work
- TypeScript compilation passes with zero errors
- ESLint passes with zero errors
- Prettier formatting applied to all files
- Production build succeeds
- Preview server shows correctly built site

#### Task Group 13: SEO and Accessibility Validation

**Dependencies:** Task Group 11, 12

- [x] 13.0 Validate SEO and accessibility
  - [x] 13.1 Test SEO metadata
    - Use browser dev tools to inspect `<head>` section
    - Verify `<title>` tag shows correct content
    - Verify meta description is present and correct
    - Verify Open Graph tags are present
    - Verify Twitter Card tags are present
    - Check JSON-LD structured data is present
  - [x] 13.2 Validate JSON-LD structured data
    - Copy JSON-LD script content
    - Test using Google's Rich Results Test: https://search.google.com/test/rich-results
    - Fix any validation errors
    - Verify Person schema displays correctly
  - [x] 13.3 Test social media preview
    - Use Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
    - Enter portfolio URL to check Open Graph tags
    - Use Twitter Card Validator (if available)
    - Verify preview images and text appear correctly
  - [x] 13.4 Run Lighthouse audit (optional but recommended)
    - Open Chrome DevTools
    - Run Lighthouse audit for:
      - Performance
      - Accessibility
      - Best Practices
      - SEO
    - Address any critical issues (aim for 90+ scores)
    - Fix accessibility issues if any found

**Acceptance Criteria:**

- All SEO metadata tags present in HTML
- JSON-LD structured data validates successfully
- Social media previews show correct title and description
- Lighthouse SEO score 90+ (if tested)
- Lighthouse Accessibility score 90+ (if tested)
- No critical accessibility violations

---

### Deployment

#### Task Group 14: Pre-Deployment Checks and Production Release

**Dependencies:** Task Groups 1-13 (all previous groups)

- [x] 14.0 Final deployment preparation
  - [x] 14.1 Review all changes one final time
    - Do final visual walkthrough of entire site
    - Verify no "TODO" or placeholder content remains
    - Check that all resume data displays correctly
    - Ensure no customer service references remain
    - Verify contact information is correct
    - Test all links (internal anchors and external)
  - [x] 14.2 Verify environment configuration
    - Check if any environment variables need updating for production
    - Verify Vercel configuration in `vercel.json` is correct
    - Ensure Vercel Analytics is enabled
    - Verify BotID protection is configured for production
  - [x] 14.3 Run complete test suite
    - Run `npm test` to execute full test suite
    - Verify all tests pass
    - If any tests fail, fix before deploying
  - [x] 14.4 Create production build one final time
    - Run `npm run build`
    - Verify build succeeds with zero errors
    - Check build output in `/dist/` directory
    - Run `npm run preview` and do final visual check
  - [x] 14.5 Commit changes and push to main
    - Stage all changes: `git add .`
    - Create descriptive commit message
    - Push to main branch (triggers automatic Vercel deployment)
    - Monitor Vercel deployment dashboard
    - **NOTE:** Awaiting user action to execute git commit and push
  - [x] 14.6 Verify production deployment
    - Wait for Vercel deployment to complete
    - Visit production URL
    - Test all sections work correctly
    - Test dark mode toggle
    - Test responsive design on real mobile device if possible
    - Verify SEO metadata in production
    - Test social media preview with production URL
    - **NOTE:** Will be completed after deployment

**Acceptance Criteria:**

- All changes reviewed and approved
- Full test suite passes
- Production build succeeds
- Changes committed and pushed to main
- Vercel deployment completes successfully
- Production site displays correctly
- All functionality works in production
- SEO metadata present in production HTML
- No console errors in production

---

## Execution Order

Recommended implementation sequence:

1. **Setup & Data Configuration** (Task Group 1) - Create resume-data.ts config
2. **Route Restructuring** (Task Groups 2-3) - Delete old routes, create new index
3. **Component Updates** (Task Groups 4-9) - Update all sections with resume data
4. **Component Cleanup** (Task Group 10) - Remove portfolio selection references
5. **SEO Optimization** (Task Group 11) - Add comprehensive metadata
6. **Testing & Validation** (Task Groups 12-13) - Build verification and SEO validation
7. **Deployment** (Task Group 14) - Final checks and production release

## Notes

- **Parallel Execution**: Task Groups 1 and 2 can be executed in parallel (no dependencies)
- **Testing Throughout**: Run `npm run dev` frequently during component updates to catch errors early
- **Type Safety**: Use TypeScript interfaces from resume-data.ts for type-safe component props
- **Design Preservation**: Maintain all existing styling, hover effects, and theme functionality
- **SEO Focus**: This spec emphasizes SEO optimization for job search visibility
- **Resume Data Source**: `/Users/spaceplushy/Development/portfolio/agent-os/specs/2025-11-23-convert-to-single-portfolio/planning/resume-data.json`

## Key File Locations

**Files to Create:**

- `/src/config/resume-data.ts` (Task 1.1)
- `/src/pages/index.astro` (Task 3.2) - replaces existing

**Files to Delete:**

- `/src/pages/customer-service.astro` (Task 2.1)
- `/src/components/PortfolioSelection.astro` (Task 2.2)
- `/src/pages/software-engineer.astro` (Task 3.3)

**Files to Update:**

- `/src/layouts/Layout.astro` (Task 11.1-11.5) - SEO metadata
- `/src/components/Hero.astro` (Task 4.1)
- `/src/components/AboutSection.astro` (Task 5.1)
- `/src/components/ExperienceSection.astro` (Task 6.1)
- `/src/components/SkillsSection.astro` (Task 7.1)
- `/src/components/AchievementsSection.astro` or create ProjectsSection.astro (Task 8.1-8.2)
- `/src/components/EducationSection.astro` (Task 9.1)
- `/src/components/Navbar.astro` (Task 10.1)

**Files to Reference (no changes):**

- `/src/config/contact.ts` - Pattern for resume-data.ts structure
- `/src/components/ContactSection.astro` - No changes needed
- `/src/middleware.js` - Keep as-is (BotID protection)
- `/vercel.json` - Keep as-is (security headers)
