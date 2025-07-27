# Utilities Documentation

## Utility Functions & Helpers

### Core Utilities

#### Class Name Merging (`utils.ts`)
**Purpose**: Intelligent CSS class merging with Tailwind CSS optimization

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Key Features:**
- **Conditional classes**: Handle conditional className logic with type safety
- **Tailwind optimization**: Merge conflicting Tailwind classes intelligently
- **TypeScript support**: Full type inference for className values
- **Performance optimization**: Efficient class string concatenation

#### Usage Patterns
```typescript
// Conditional styling
cn(
  "base-classes",
  condition && "conditional-classes",
  variant === "primary" && "primary-classes"
)

// Component variant styling
cn(
  baseStyles,
  variants[variant],
  sizes[size],
  className // User-provided overrides
)

// Theme-based styling
cn(
  "bg-background text-foreground",
  darkMode ? "dark-specific-classes" : "light-specific-classes"
)
```

### Utility Architecture

#### Design Principles
- **Single responsibility**: Each utility has one clear purpose
- **Type safety**: Full TypeScript support with proper type inference
- **Performance**: Optimized for minimal runtime overhead
- **Composability**: Utilities work together seamlessly

#### Integration Patterns
- **Component styling**: Primary use in shadcn/ui component variants
- **Theme integration**: Seamless integration with CSS custom properties
- **Responsive design**: Support for responsive utility classes
- **State management**: Conditional styling based on component state

### Styling Utility Patterns

#### Component Variant Implementation
```typescript
// Button component variant system
const buttonVariants = cva(
  "base-button-classes",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        outline: "border bg-background hover:bg-accent"
      },
      size: {
        default: "h-9 px-4 py-2",
        lg: "h-10 rounded-md px-6"
      }
    }
  }
)

// Usage with cn utility
<Button className={cn(buttonVariants({ variant, size }), className)} />
```

#### Theme-Aware Styling
```typescript
// Dynamic theme classes
const themeClasses = cn(
  "transition-colors duration-200",
  "bg-background text-foreground",
  "border-border"
)

// Conditional theme styling
const cardClasses = cn(
  "rounded-lg border p-6",
  "bg-card text-card-foreground",
  highlighted && "ring-2 ring-primary"
)
```

### Type Utilities

#### Common Type Patterns
```typescript
// Component prop types
type ComponentProps<T extends keyof JSX.IntrinsicElements> = 
  React.ComponentProps<T>

// Variant prop extraction
type VariantProps<T> = T extends (...args: any[]) => any 
  ? Parameters<T>[0] 
  : never

// Optional properties
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
```

#### Portfolio-Specific Types
```typescript
// Contact information
interface ContactInfo {
  email: string
  phone: string
  linkedin: string
  location: string
}

// Professional experience
interface Experience {
  title: string
  company: string
  duration: string
  description: string[]
  technologies: string[]
}

// Skill categories
interface SkillCategory {
  name: string
  skills: string[]
  proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
}
```

### Security Utilities (`security.ts`)

#### Input Sanitization
**Purpose**: Protect against XSS attacks and malicious input

```typescript
// Sanitize text input by escaping dangerous characters
export function sanitizeText(input: string): string {
  return input
    .trim()
    .replace(/[<>"'&]/g, (match) => htmlEntities[match])
    .slice(0, 1000); // Prevent excessively long inputs
}

// Validate and sanitize email addresses
export function sanitizeEmail(email: string): string {
  const cleaned = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(cleaned)) {
    throw new Error('Invalid email format');
  }
  return cleaned;
}

// Create safe mailto URLs with validated inputs
export function createSafeMailtoUrl(data: ContactFormData): string {
  const validated = validateContactForm(data);
  const body = `Name: ${validated.name}\nEmail: ${validated.email}\n\nMessage:\n${validated.message}`;
  return `mailto:frank@palmisano.io?subject=${encodeURIComponent(validated.subject)}&body=${encodeURIComponent(body)}`;
}
```

### Form Validation (`validations.ts`)

#### Zod Schema Validation
**Purpose**: Type-safe form validation with user-friendly error messages

```typescript
// Contact form validation schema
export const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(100, 'Email must be less than 100 characters'),
  
  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(100, 'Subject must be less than 100 characters'),
  
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be less than 1000 characters')
});

// Type-safe form data interface
export type ContactFormData = z.infer<typeof contactFormSchema>;
```

### Animation Utilities

#### Transition Helpers
```typescript
// Standard transition classes
export const transitions = {
  fast: "transition-all duration-150 ease-in-out",
  normal: "transition-all duration-200 ease-in-out",
  slow: "transition-all duration-300 ease-in-out"
} as const

// Hover effect utilities
export const hoverEffects = {
  scale: "hover:scale-105 transition-transform",
  lift: "hover:-translate-y-1 hover:shadow-lg transition-all",
  glow: "hover:ring-2 hover:ring-primary/20 transition-all"
} as const
```

#### Scroll Utilities

##### Navigation Scrolling (`scroll-to-section.ts`)
**Purpose**: Smooth scrolling utility for clean URL navigation

```typescript
// Smooth scroll to section without changing URL
export function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
```

**Key Features:**
- **Clean URLs**: Enables smooth scrolling without hash fragments
- **Type safety**: TypeScript function with clear parameter types
- **Error handling**: Gracefully handles missing elements
- **Integration**: Used throughout navigation components for consistent behavior

##### General Scroll Utilities
```typescript
// Smooth scroll to element
export const scrollToElement = (elementId: string) => {
  const element = document.getElementById(elementId)
  if (element) {
    element.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    })
  }
}

// Scroll position detection
export const useScrollPosition = () => {
  const [scrollY, setScrollY] = useState(0)
  
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  return scrollY
}
```

### Performance Utilities

#### Memoization Helpers
```typescript
// Debounce utility for search/input
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void => {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

// Throttle utility for scroll events
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void => {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}
```

### Future Enhancement Opportunities

#### Advanced Utilities
- **Date formatting**: Professional experience date handling
- **URL validation**: Portfolio link validation
- **File upload helpers**: Resume and portfolio file handling
- **Analytics helpers**: Event tracking and user interaction utilities

#### Form Enhancement Utilities
- **Multi-step form helpers**: Progress tracking and navigation
- **File upload utilities**: Drag-and-drop and progress tracking
- **Form persistence**: Auto-save and recovery utilities
- **Validation schema builders**: Dynamic validation rule creation

#### Performance Optimization
- **Image lazy loading**: Intersection Observer utilities
- **Virtual scrolling**: Large list performance optimization
- **Bundle analysis**: Code splitting and dynamic import helpers
- **Cache management**: Browser storage and API cache utilities

#### Accessibility Utilities
- **Focus management**: Keyboard navigation helpers
- **Screen reader utilities**: ARIA attribute management
- **Color contrast**: Accessibility compliance checking
- **Motion preferences**: Reduced motion detection and handling

---

*This utility system provides a robust foundation for consistent, performant, and maintainable code patterns throughout the portfolio application.*