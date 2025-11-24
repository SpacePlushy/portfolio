## Error handling best practices - Astro Web Development

### Server-Side Error Handling

#### Content Collection Errors

- **Schema Validation**: Zod automatically validates content collections

  ```astro
  ---
  import { getCollection } from 'astro:content';

  try {
    const posts = await getCollection('blog');
  } catch (error) {
    console.error('Failed to load blog posts:', error);
    // Fallback or show error page
  }
  ---
  ```

- **Missing Entries**: Handle missing content gracefully

  ```astro
  ---
  import { getEntry } from 'astro:content';

  const post = await getEntry('blog', Astro.params.slug);
  if (!post) {
    return Astro.redirect('/404');
  }
  ---
  ```

#### API Route Error Handling

- **Structured Errors**: Return consistent error responses
  ```typescript
  export async function GET() {
    try {
      const data = await fetchData();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch data',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }
  ```
- **HTTP Status Codes**: Use appropriate codes
  - 200 - Success
  - 201 - Created
  - 400 - Bad Request
  - 401 - Unauthorized
  - 404 - Not Found
  - 500 - Internal Server Error

#### Data Fetching Errors

- **Fail Fast**: Validate data early in component frontmatter
  ```astro
  ---
  const response = await fetch('https://api.example.com/data');
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }
  const data = await response.json();
  ---
  ```
- **Timeout Handling**: Set reasonable timeouts for external APIs
- **Fallback Content**: Provide fallback when external data fails
  ```astro
  ---
  let products = [];
  try {
    products = await fetchProducts();
  } catch (error) {
    console.error('Products unavailable:', error);
    // Use cached or default products
  }
  ---
  ```

### Client-Side Error Handling

#### Framework Component Errors

- **Error Boundaries**: Use React Error Boundaries for React islands

  ```tsx
  // ErrorBoundary.tsx
  export class ErrorBoundary extends React.Component {
    state = { hasError: false };

    static getDerivedStateFromError() {
      return { hasError: true };
    }

    render() {
      if (this.state.hasError) {
        return <div>Something went wrong</div>;
      }
      return this.props.children;
    }
  }
  ```

- **Client Script Errors**: Wrap client-side code in try-catch
  ```astro
  <script>
    try {
      // Interactive code
      document.querySelector('.btn').addEventListener('click', handleClick);
    } catch (error) {
      console.error('Failed to initialize:', error);
    }
  </script>
  ```

### Error Logging & Monitoring

- **Production Monitoring**: Integrate Sentry or similar

  ```astro
  ---
  // In layout or page
  import * as Sentry from '@sentry/astro';

  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.SENTRY_DSN,
    });
  }
  ---
  ```

- **Console Logging**: Use appropriate log levels
  - `console.error()` - Actual errors
  - `console.warn()` - Warnings and deprecations
  - `console.info()` - Informational messages
  - `console.log()` - Development only (remove in production)
- **Error Context**: Include relevant context in logs
  ```typescript
  console.error('Failed to process user', {
    userId: user.id,
    action: 'update',
    error: error.message,
  });
  ```

### Custom Error Pages

- **404 Page**: Create `src/pages/404.astro` for missing pages
- **500 Page**: Create custom error page for server errors
- **User-Friendly Messages**: Never expose stack traces or technical details to users

  ```astro
  ---
  // src/pages/404.astro
  ---

  <html>
    <head>
      <title>Page Not Found</title>
    </head>
    <body>
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <a href="/">Go home</a>
    </body>
  </html>
  ```

### Build-Time Error Handling

- **Type Errors**: Run `astro check` to catch TypeScript errors
- **Build Errors**: Handle missing imports, invalid routes early
- **Content Validation**: Zod schemas catch content errors at build time
- **Fail Fast**: Don't deploy if build fails - fix errors first

### Best Practices

- **Graceful Degradation**: Non-critical features should fail silently
- **Retry Logic**: Implement exponential backoff for transient failures
  ```typescript
  async function fetchWithRetry(url: string, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fetch(url);
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, 2 ** i * 1000));
      }
    }
  }
  ```
- **Type Guards**: Use TypeScript type guards for type safety
  ```typescript
  function isError(value: unknown): value is Error {
    return value instanceof Error;
  }
  ```
- **Never Swallow Errors**: Always log or handle errors appropriately
- **Clean Error Messages**: Provide actionable guidance to developers and users
