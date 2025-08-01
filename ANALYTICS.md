# Analytics Integration Guide

This document explains how to use the flexible analytics system implemented in the portfolio website.

## Overview

The analytics system supports multiple providers with a unified interface:
- **Google Analytics 4** - Comprehensive web analytics
- **Plausible Analytics** - Privacy-focused, lightweight analytics
- **Custom/Self-hosted** - Any custom analytics solution
- **None** - Disable analytics completely

## Quick Start

1. Copy `.env.example` to `.env.local`
2. Set your analytics provider and configuration
3. Deploy or restart your development server

### Example Configurations

#### Google Analytics 4
```bash
ANALYTICS_PROVIDER=ga4
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_CONFIG_OPTIONS={"send_page_view": true, "allow_google_signals": false}
ANALYTICS_CONSENT_REQUIRED=true
```

#### Plausible Analytics
```bash
ANALYTICS_PROVIDER=plausible
PLAUSIBLE_DOMAIN=yourdomain.com
PLAUSIBLE_SRC=https://plausible.io/js/script.js
ANALYTICS_CONSENT_REQUIRED=false
ANALYTICS_COOKIE_LESS=true
```

#### Custom Analytics
```bash
ANALYTICS_PROVIDER=custom
CUSTOM_ANALYTICS_SRC=https://youranalytics.com/script.js
CUSTOM_ANALYTICS_CONFIG={"apiKey": "your-key", "endpoint": "https://api.youranalytics.com"}
```

## Features

### 🔒 Privacy & GDPR Compliance
- Consent management with customizable banner
- IP anonymization support
- Cookie-less tracking options
- Granular privacy controls

### 📊 Comprehensive Tracking
- Page views and navigation
- Custom events and user interactions
- Core Web Vitals and performance metrics
- JavaScript errors and crashes
- Form submissions and conversions

### 🛠 Developer Experience
- TypeScript support with full type definitions
- Debug mode with real-time analytics panel
- Environment-based configuration
- Provider-agnostic API

## Usage Examples

### Basic Event Tracking
```javascript
// Track a custom event
window.AnalyticsManager.trackEvent('button_click', {
  button_name: 'contact_form_submit',
  location: 'hero_section'
});

// Track page view
window.AnalyticsManager.trackPageView('/about', 'About Page');
```

### Using Helper Functions
```javascript
import { events, clientAnalytics } from '@/utils/analytics';

// Pre-defined event helpers
events.buttonClick('download_resume', 'header');
events.portfolioView('my_awesome_project', 'web_development');
events.contactAttempt('email');

// Direct client API
clientAnalytics.trackEvent('custom_event', { key: 'value' });
clientAnalytics.setConsent(true);
console.log('Analytics ready:', clientAnalytics.isReady());
```

### React Component Integration
```tsx
import { useEffect } from 'react';
import { events } from '@/utils/analytics';

function ContactButton() {
  const handleClick = () => {
    events.buttonClick('contact_button', 'navbar');
    // Handle click logic...
  };
  
  useEffect(() => {
    events.pageView('/contact');
  }, []);
  
  return <button onClick={handleClick}>Contact Me</button>;
}
```

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANALYTICS_PROVIDER` | Analytics provider: `ga4`, `plausible`, `custom`, `none` | `none` |
| `ANALYTICS_CONSENT_REQUIRED` | Show consent banner | `true` |
| `ANALYTICS_ANONYMIZE_IP` | Anonymize visitor IP addresses | `true` |
| `ANALYTICS_COOKIE_LESS` | Use cookie-less tracking when possible | `false` |
| `ANALYTICS_TRACK_PERFORMANCE` | Track Core Web Vitals | `true` |
| `ANALYTICS_TRACK_ERRORS` | Track JavaScript errors | `true` |
| `ANALYTICS_DEBUG` | Enable debug mode | `false` (auto in dev) |

### Provider-Specific Options

#### Google Analytics 4
```bash
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_CONFIG_OPTIONS='{
  "send_page_view": true,
  "allow_google_signals": false,
  "allow_ad_personalization_signals": false,
  "anonymize_ip": true
}'
```

#### Plausible Analytics
```bash
PLAUSIBLE_DOMAIN=yourdomain.com
PLAUSIBLE_SRC=https://plausible.io/js/script.js
PLAUSIBLE_OPTIONS='{
  "outbound_links": true,
  "file_downloads": true,
  "tagged_events": true
}'
```

#### Custom Analytics
```bash
CUSTOM_ANALYTICS_SRC=https://youranalytics.com/script.js
CUSTOM_ANALYTICS_CONFIG='{
  "apiKey": "your-api-key",
  "endpoint": "https://api.youranalytics.com/track",
  "batchSize": 10
}'
```

## Privacy & Compliance

### GDPR Compliance
The system includes built-in GDPR compliance features:
- Consent banner with accept/decline options
- Consent state persistence in localStorage
- Analytics loading only after consent
- IP anonymization and cookie controls

### Consent Management
```javascript
// Check consent status
const hasConsent = window.AnalyticsManager.checkConsent();

// Programmatically set consent
window.AnalyticsManager.setConsent(true);

// Show consent banner manually
window.AnalyticsManager.showConsentBanner();
```

## Performance Tracking

The system automatically tracks Core Web Vitals:
- **LCP** (Largest Contentful Paint)
- **FID** (First Input Delay)
- **CLS** (Cumulative Layout Shift)

Additional performance metrics:
- DNS lookup time
- Connection time
- Request/response time
- DOM load time
- Total page load time

## Error Tracking

Automatic error tracking includes:
- JavaScript errors with stack traces
- Unhandled promise rejections
- Custom error events

```javascript
// Track custom errors
events.errorEncountered('api_error', 'Failed to load user data');
```

## Debug Mode

Enable debug mode for development:
```bash
ANALYTICS_DEBUG=true
```

This shows a debug panel with:
- Current analytics status
- Provider information
- Consent state
- Test event button

## Security

### Content Security Policy
The middleware automatically includes CSP headers for supported analytics providers:
- Google Analytics domains
- Plausible Analytics domains
- Custom domains (requires manual CSP updates)

### Bot Protection
The existing middleware bot detection works seamlessly with analytics:
- Legitimate search engine bots are allowed
- Suspicious bots are flagged but analytics still tracks
- Analytics respects bot detection results

## Migration from Vercel Analytics

If migrating from Vercel Analytics:

1. Remove Vercel Analytics configuration
2. Set up new analytics provider
3. Update any custom tracking calls
4. Test in development mode

The new system provides the same functionality with better privacy controls and provider flexibility.

## Troubleshooting

### Common Issues

1. **Analytics not loading**
   - Check environment variables
   - Verify provider configuration
   - Check browser console for errors

2. **Consent banner not showing**
   - Ensure `ANALYTICS_CONSENT_REQUIRED=true`
   - Check if consent was already given
   - Verify script is loading

3. **Events not tracking**
   - Confirm analytics is initialized
   - Check consent status
   - Verify provider-specific setup

### Debug Checklist

1. Enable debug mode
2. Check browser developer tools console
3. Verify environment variables
4. Test with different providers
5. Check CSP headers in network tab

## Best Practices

1. **Privacy First**: Always consider user privacy and comply with local regulations
2. **Performance**: Analytics should not impact site performance significantly
3. **Testing**: Test analytics in different browsers and scenarios
4. **Documentation**: Keep track of custom events and their purposes
5. **Monitoring**: Regularly check that analytics is working correctly

## Support

For issues or questions:
1. Check this documentation
2. Review browser console for errors
3. Test with debug mode enabled
4. Verify environment configuration