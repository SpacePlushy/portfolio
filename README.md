# Portfolio Website

Professional portfolio website for Frank Palmisano built with Astro, featuring server-side rendering, dual portfolio paths, and comprehensive security measures.

## Tech Stack

- **Astro 5.x** - Static site generator with SSR support
- **React 19** - Interactive components
- **Tailwind CSS v4** - Utility-first styling
- **TypeScript** - Type safety
- **Vercel** - Deployment and hosting
- **Bot Protection** - Security against automated attacks

## Development

```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run preview # Preview production build
```

## Security Features

This portfolio implements multiple security layers:

### Bot Protection
- Client-side bot detection using BotID
- Server-side validation for all API routes
- Token-based request authentication
- Rate limiting and abuse prevention

### API Security
- Input validation and sanitization
- Proper error handling without information leakage
- Security headers for all responses
- Request logging and monitoring

### Content Security
- XSS protection with security headers
- Content Security Policy (CSP)  
- Safe rendering of all user content
- No unsafe inline scripts or styles

## Environment Variables

### Safe Variables (Client-Exposed)
These variables are safe to expose to the browser:

```bash
NODE_ENV=production          # Build environment
PUBLIC_SITE_URL=https://...  # Public site URL
```

### Private Variables (Server-Only)
These variables contain secrets and must NEVER be exposed to the client:

```bash
# Email service (example)
SENDGRID_API_KEY=sg-xxx...
SMTP_PASSWORD=xxx...

# Database credentials (if used)
DATABASE_URL=postgres://...
DATABASE_PASSWORD=xxx...

# API keys and tokens
BOT_PROTECTION_SECRET=xxx...
ANALYTICS_SECRET=xxx...
```

### Security Rules for Environment Variables

1. **Never commit secrets to the repository**
   - Use `.env.local` for local development
   - Store secrets in Vercel environment variables
   - Add `.env*` to `.gitignore`

2. **Client vs Server variables**
   - Variables starting with `PUBLIC_` are exposed to the browser
   - All other variables are server-only
   - Validate this assumption in your code

3. **Production deployment**
   - Set all secrets in Vercel dashboard
   - Never use development secrets in production
   - Rotate secrets regularly

## Architecture

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── BotIdProtection.tsx  # Client-side bot detection
│   └── *.astro          # Portfolio components
├── layouts/
│   └── Layout.astro     # Base layout with security features
├── lib/
│   ├── bot-protection.ts    # Security utilities
│   └── utils.ts         # General utilities
├── pages/
│   ├── api/             # Secure API endpoints
│   │   ├── contact.js   # Contact form handler
│   │   └── health.js    # Health check endpoint
│   └── *.astro          # Static pages
├── middleware.js        # Security middleware
└── styles/              # Global styles
```

## Contributing

When contributing to this project:

1. **Security First**: Never commit secrets or expose sensitive data
2. **Use CLI Tools**: Always use Astro CLI and package managers for configuration
3. **Test Security**: Verify bot protection and input validation
4. **Follow Patterns**: Use established security patterns for new features

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Frank Palmisano - frank@palmisano.io