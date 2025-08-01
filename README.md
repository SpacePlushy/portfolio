# Frank Palmisano Portfolio

A professional portfolio website built with Astro, showcasing expertise in both software engineering and customer service.

## 🚀 Features

- **Dual Portfolio Paths**: Software Engineer and Customer Service professional presentations
- **Dark/Light Mode**: Automatic theme detection with manual toggle
- **Optimized Performance**: Static site generation with Vercel's edge network
- **Image Optimization**: Automatic WebP/AVIF conversion with responsive sizing
- **Professional Design**: Clean, modern interface built with Tailwind CSS

## 🛠️ Built With

- [Astro](https://astro.build) - Static site generator
- [React](https://reactjs.org) - UI components
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Vercel](https://vercel.com) - Hosting and edge functions
- [shadcn/ui](https://ui.shadcn.com) - Component library

## 🧞 Commands

All commands are run from the root of the project:

| Command           | Action                                       |
| :---------------- | :------------------------------------------- |
| `npm install`     | Installs dependencies                        |
| `npm run dev`     | Starts local dev server at `localhost:4321`  |
| `npm run build`   | Build your production site to `./dist/`      |
| `npm run preview` | Preview your build locally, before deploying |

## 📝 Development Notes

- The site uses static output for optimal performance
- Images are automatically optimized through Vercel's image service
- BotID protection is configured for the production deployment
- GitHub Actions with Claude Code is set up for automated PR reviews

## 🌐 Deployment

This site is deployed on Digital Ocean App Platform with CDN optimization for maximum performance.

### CDN Configuration

The portfolio includes comprehensive CDN configuration for optimal performance:

- **Cache Strategy**: Intelligent caching for different asset types
- **Compression**: Brotli and Gzip compression for all text-based assets
- **Security Headers**: CDN-compatible security headers
- **Performance Monitoring**: Built-in performance testing and monitoring

### CDN Commands

| Command              | Action                                        |
| :------------------- | :-------------------------------------------- |
| `npm run test:cdn`   | Test CDN performance and configuration       |
| `npm run deploy:cdn` | Deploy with automatic CDN cache purging      |
| `npm run deploy:test`| Run deployment tests only                     |
| `npm run purge:cdn`  | Purge CDN caches manually                     |

### Supported CDN Providers

- **Cloudflare**: Full configuration with security and performance features
- **Digital Ocean Spaces CDN**: Optimized for Digital Ocean App Platform
- **Generic CDN**: Compatible with most CDN providers

For detailed CDN setup instructions, see [CDN_SETUP_GUIDE.md](./CDN_SETUP_GUIDE.md).
