## Validation best practices - Astro Web Development

### Content Collections Validation

#### Zod Schema Validation

- **Schema-First Approach**: Define schemas in `src/content/config.ts`

  ```typescript
  import { defineCollection, z } from 'astro:content';

  const blog = defineCollection({
    type: 'content',
    schema: z.object({
      title: z.string().min(1).max(100),
      description: z.string().max(160),
      publishDate: z.date(),
      author: z.string(),
      tags: z.array(z.string()),
      draft: z.boolean().default(false),
      image: z
        .object({
          src: z.string(),
          alt: z.string(),
        })
        .optional(),
    }),
  });
  ```

- **Build-Time Validation**: Zod validates all content at build time
- **Type Safety**: Schemas provide TypeScript types automatically
- **Custom Validation**: Add custom Zod refinements
  ```typescript
  schema: z.object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    publishDate: z
      .date()
      .refine((date) => date <= new Date(), 'Publish date cannot be in the future'),
  });
  ```

### Form Validation

#### Server-Side Validation (API Routes)

- **Always Validate on Server**: Client validation is UX only

  ```typescript
  // src/pages/api/submit.ts
  import { z } from 'astro:schema';

  const formSchema = z.object({
    email: z.string().email(),
    name: z.string().min(2).max(50),
    message: z.string().min(10).max(1000),
  });

  export async function POST({ request }) {
    const data = await request.formData();
    const formData = Object.fromEntries(data);

    const result = formSchema.safeParse(formData);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          errors: result.error.flatten(),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Process valid data
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  ```

#### Client-Side Validation

- **HTML5 Validation**: Use native HTML validation attributes
  ```astro
  <form>
    <input
      type="email"
      required
      pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
      minlength="5"
      maxlength="100"
    />
  </form>
  ```
- **JavaScript Validation**: Enhance UX with client-side checks
  ```astro
  <script>
    const form = document.querySelector('form');
    form.addEventListener('submit', (e) => {
      const email = form.querySelector('[type="email"]').value;
      if (!email.includes('@')) {
        e.preventDefault();
        alert('Please enter a valid email');
      }
    });
  </script>
  ```

### API Input Validation

#### Request Validation

- **Validate All Inputs**: Query params, body, headers

  ```typescript
  export async function GET({ request, url }) {
    const schema = z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(10),
      sort: z.enum(['asc', 'desc']).default('desc'),
    });

    const params = {
      page: url.searchParams.get('page'),
      limit: url.searchParams.get('limit'),
      sort: url.searchParams.get('sort'),
    };

    const result = schema.safeParse(params);
    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid parameters',
          details: result.error.issues,
        }),
        { status: 400 }
      );
    }

    // Use validated result.data
  }
  ```

#### Environment Variable Validation

- **Validate on Startup**: Check required env vars exist

  ```typescript
  // src/lib/env.ts
  import { z } from 'astro:schema';

  const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    API_KEY: z.string().min(20),
    PUBLIC_API_URL: z.string().url(),
  });

  export const env = envSchema.parse(import.meta.env);
  ```

### Data Sanitization

#### Input Sanitization

- **Prevent XSS**: Escape HTML in user content
  ```typescript
  function escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  ```
- **Sanitize Rich Text**: Use DOMPurify for HTML content

  ```typescript
  import DOMPurify from 'isomorphic-dompurify';

  const clean = DOMPurify.sanitize(userInput);
  ```

#### URL Validation

- **Validate External URLs**: Check URL format and protocol
  ```typescript
  const urlSchema = z
    .string()
    .url()
    .refine((url) => url.startsWith('https://'), 'URL must use HTTPS');
  ```

### Type Validation

#### TypeScript Runtime Validation

- **Use Zod for Runtime Types**: Bridge compile-time and runtime

  ```typescript
  import { z } from 'astro:schema';

  const User = z.object({
    id: z.number(),
    email: z.string().email(),
    role: z.enum(['admin', 'user', 'guest']),
  });

  type User = z.infer<typeof User>;

  function processUser(data: unknown) {
    const user = User.parse(data); // Throws if invalid
    // user is now typed and validated
  }
  ```

#### Props Validation

- **Validate Component Props**: Runtime checks for critical components

  ```astro
  ---
  import { z } from 'astro:schema';

  const propsSchema = z.object({
    items: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
      })
    ),
    maxItems: z.number().positive().optional(),
  });

  const props = propsSchema.parse(Astro.props);
  ---
  ```

### Validation Best Practices

- **Fail Early**: Validate at boundaries (API entry, component entry)
- **Specific Errors**: Provide field-level error messages
  ```typescript
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;
    // { email: ["Invalid email"], name: ["Too short"] }
  }
  ```
- **Allowlists Over Blocklists**: Define what's valid, not what's invalid
- **Consistent Validation**: Same rules across frontend and backend
- **Validate Types**: Use Zod for runtime type validation
- **Sanitize Everywhere**: Never trust user input, even after validation
- **Document Validation**: Comment on complex validation rules
- **Test Validation**: Unit test validation logic with edge cases
