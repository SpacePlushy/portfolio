# Frank Palmisano's Portfolio

A modern, responsive portfolio website with dynamic content routing based on subdomains. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

### Three-Way Portfolio System

This portfolio supports three distinct experiences through subdomain-based routing:

1. **General Landing Page** (`palmisano.io`)
   - Professional overview with portfolio selection
   - Interactive cards to choose area of interest
   - Highlights both technical and service achievements

2. **Software Engineering Portfolio** (`swe.palmisano.io`)
   - Full technical portfolio
   - NASA Orion spacecraft and embedded systems focus
   - Comprehensive work history and technical achievements

3. **Customer Service Representative Portfolio** (`csr.palmisano.io`)
   - Customer service excellence showcase
   - 99% customer satisfaction achievements
   - Apple's top 4% performance metrics

### Technical Features

- **Dynamic Content Switching**: Single codebase serves three portfolio variants
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark/Light Theme**: System-aware theme with manual toggle
- **Performance Optimized**: Next.js 14 with optimized images and fonts
- **Type-Safe**: Full TypeScript implementation
- **SEO Optimized**: Dynamic metadata for each portfolio variant

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/frank-portfolio.git

# Navigate to project directory
cd frank-portfolio

# Install dependencies
npm install
```

### Local Development

For testing the subdomain routing locally:

```bash
# Run the setup script to configure local hosts
./scripts/setup-local-testing.sh

# Start the development server
npm run dev
```

Then visit:
- General Landing: http://palmisano.local:3000
- Software Engineering: http://swe.palmisano.local:3000
- Customer Service Representative: http://csr.palmisano.local:3000

### Project Structure

```
src/
├── app/                    # Next.js app directory
├── components/             # React components
│   ├── sections/          # Portfolio section components
│   └── ui/                # Reusable UI components
├── config/                # Configuration files
│   └── portfolio-content.ts # All portfolio content
├── contexts/              # React contexts
├── lib/                   # Utility functions
└── middleware.ts          # Subdomain routing logic
```

## Deployment

### Vercel Deployment

1. Push to GitHub (automatic deployment via Vercel)
2. Configure domains in Vercel Dashboard:
   - `palmisano.io`
   - `swe.palmisano.io`
   - `csr.palmisano.io`

### DNS Configuration

Configure your DNS provider:

```
A record: @ → 76.76.21.21
CNAME: swe → cname.vercel-dns.com
CNAME: csr → cname.vercel-dns.com
```

## Documentation

- [Three-Way Portfolio Setup](./docs/THREE_WAY_PORTFOLIO_SETUP.md) - Detailed setup guide
- [Customer Service Representative Portfolio Setup](./docs/CSR_PORTFOLIO_SETUP.md) - CSR-specific documentation
- [Troubleshooting CSR Subdomain](./TROUBLESHOOT_CSR.md) - Common issues and solutions

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **Deployment**: Vercel

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run type-check # Run TypeScript compiler
```

## Contributing

This is a personal portfolio project, but suggestions and feedback are welcome!

## License

This project is private and proprietary. All rights reserved.