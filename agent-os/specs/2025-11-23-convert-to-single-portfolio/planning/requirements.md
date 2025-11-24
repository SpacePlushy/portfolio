# Spec Requirements: Convert to Single Software Engineer Portfolio

## Initial Description

Remove the dual-portfolio structure from the website and convert it to a single Software Engineer portfolio. This involves:

1. Remove the customer service portfolio path entirely
2. Delete the portfolio picker/selection landing page (currently at index)
3. Make the Software Engineer portfolio the primary/only portfolio (move it to index or make it the default landing page)
4. Update all navigation and routing to reflect the single portfolio structure
5. Clean up all customer service-related data, components, and content
6. Ensure the Software Engineer portfolio uses new/updated resume information

The current structure has:

- A picker page that lets users choose between "Customer Service Representative" or "Software Engineer" portfolios
- Separate routes: `/customer-service.astro` and `/software-engineer.astro`
- This needs to become a single, unified Software Engineer portfolio

Expected outcome: A streamlined, single-purpose portfolio website focused exclusively on Software Engineer positioning, with the Software Engineer content as the primary landing experience.

## Requirements Discussion

### First Round Questions

**Q1: Route Structure**
Replace `/index.astro` with Software Engineer portfolio content, making `/` the primary portfolio route?

**Answer:** YES - Replace `/index.astro` with Software Engineer portfolio content, making `/` the primary portfolio route

**Q2: Hero Section**
Focus solely on software engineering identity (remove customer service references)?

**Answer:** Focus solely on software engineering identity (remove customer service references)

**Q3: Content Sections**
Components currently show dual-purpose content - need to update to single-purpose (software engineering only)?

**Answer:** Components currently show dual-purpose content - need to update to single-purpose (software engineering only)

**Q4: Navigation**
Keep simple navbar with anchor links to sections (About, Experience, Skills, etc.)?

**Answer:** Keep simple navbar with anchor links to sections (About, Experience, Skills, etc.)

**Q5: Customer Service Data**
Completely delete `/customer-service.astro` and `PortfolioSelection.astro` with no preservation?

**Answer:** YES - Completely delete `/customer-service.astro` and `PortfolioSelection.astro` with no preservation

**Q6: New Resume Data**
User will provide new resume data - needs to know WHERE to place it

**Answer:** User is waiting to be told where to provide the new resume data

**Q7: Visual Identity**
Keep current purple dark mode theme and design system (shadcn/ui, current colors)?

**Answer:** Keep current purple dark mode theme and design system (shadcn/ui, current colors)

**Q8: Metadata & SEO**
Optimize for SEO (suggest software engineering keywords/positioning)?

**Answer:** Optimize for SEO (suggest software engineering keywords/positioning)

**Q9: Analytics & Tracking**
Keep current Vercel Analytics and bot protection as-is?

**Answer:** Keep current Vercel Analytics and bot protection as-is

**Q10: Out of Scope**
No blog, project showcase, contact form enhancements, or testimonials - keep minimal, may be future specs?

**Answer:** No blog, project showcase, contact form enhancements, or testimonials - keep minimal, may be future specs

### Existing Code to Reference

No similar existing features identified for reference.

### Follow-up Questions

None required - all requirements are clear.

## Visual Assets

### Files Provided:

No visual files found via bash check.

### Visual Insights:

No visual assets provided. User confirmed they are happy with the current design (purple dark mode theme, shadcn/ui components, current styling).

## Requirements Summary

### Functional Requirements

**Primary Routing Changes:**

- Replace `/index.astro` (currently PortfolioSelection) with Software Engineer portfolio content
- Delete `/customer-service.astro` entirely
- Remove `PortfolioSelection.astro` component
- Make `/` (root) the primary and only portfolio landing page

**Content Updates:**

- Hero section: Single-purpose software engineering identity (remove all customer service references)
- Update all components to display software engineering-focused content only
- Remove dual-purpose content from all sections
- Use new resume data provided by user

**Navigation:**

- Simple navbar with anchor links to portfolio sections:
  - About
  - Experience
  - Skills
  - (Other standard portfolio sections)
- No portfolio picker/switcher needed

**Data Layer:**

- User will provide new resume data in structured format
- Resume data location: `/Users/spaceplushy/Development/portfolio/agent-os/specs/2025-11-23-convert-to-single-portfolio/planning/resume-data.json`
- Data should include: personal info, experience, skills, education, projects

**SEO Optimization:**

- Update page metadata for software engineering positioning
- Suggested keywords: Software Engineer, QA Engineer, Validation Engineer, TypeScript, Python, Test Automation
- Meta description focused on professional software engineering identity
- Optimize title tags for job-search visibility

**Visual Design:**

- Keep current purple dark mode theme
- Maintain shadcn/ui component library
- Preserve existing color palette
- No design system changes needed

**Analytics & Security:**

- Keep Vercel Analytics integration as-is
- Maintain bot protection (BotID) configuration
- No changes to middleware or security headers

### Reusability Opportunities

No existing similar features identified for reference. This is a structural simplification (reducing dual paths to single path) rather than adding new patterns.

### Scope Boundaries

**In Scope:**

- Remove dual-portfolio structure completely
- Convert to single Software Engineer portfolio
- Update root route (/) to show Software Engineer content
- Delete customer service route and components
- Update all content sections to single-purpose (software engineering)
- Implement new resume data from user-provided file
- Optimize SEO for software engineering positioning
- Keep all existing theme, analytics, and security features

**Out of Scope:**

- Blog functionality (future spec)
- Project showcase section (future spec)
- Contact form enhancements (future spec)
- Testimonials section (future spec)
- Any new interactive features
- Design system changes
- Analytics or tracking changes

### Technical Considerations

**File Structure Changes:**

- Delete: `src/pages/customer-service.astro`
- Delete: `src/components/PortfolioSelection.astro` (or similar portfolio picker component)
- Replace: `src/pages/index.astro` content with Software Engineer portfolio
- Update: Any components with dual-purpose content (identify during implementation)

**Routing Impact:**

- Current: `/` (picker) -> `/software-engineer` or `/customer-service`
- New: `/` (Software Engineer portfolio only)
- No redirects needed since existing `/software-engineer` route can be removed

**Data Source:**

- User will provide resume data in JSON format
- Location: `/Users/spaceplushy/Development/portfolio/agent-os/specs/2025-11-23-convert-to-single-portfolio/planning/resume-data.json`
- Components will need to consume this structured data

**SEO Implementation:**

- Update `<title>` tags
- Update meta descriptions
- Update Open Graph tags (og:title, og:description)
- Update Twitter Card metadata
- Consider adding JSON-LD structured data for Person schema

**Existing Technology Constraints:**

- Astro 5.x with SSR
- Vercel adapter with ISR
- React 19 for interactive components
- Tailwind CSS v4
- shadcn/ui component library
- Current theme system (ThemeService)
- All must remain unchanged
