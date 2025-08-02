# Digital Ocean Deployment Guide

## What I've Done For You ✅

1. **Installed Digital Ocean CLI** (`doctl`)
2. **Created deployment specification** (`.do/app.yaml`)
3. **Configured all necessary files**:
   - Dockerfile with security hardening
   - Health check endpoints
   - Rate limiting and bot protection
   - CDN configuration files
   - Analytics setup

## What You Need To Do 🔧

### Step 1: Authenticate Digital Ocean CLI
```bash
# You'll need to create an API token first:
# 1. Go to https://cloud.digitalocean.com/account/api/tokens
# 2. Click "Generate New Token"
# 3. Give it a name like "doctl-cli"
# 4. Copy the token

# Then authenticate:
doctl auth init
# Paste your token when prompted
```

### Step 2: Create the App
```bash
# Option A: Use the CLI (after authentication)
cd /Users/spaceplushy/portfolio
doctl apps create --spec .do/app.yaml

# Option B: Use the Web Console
# 1. Go to https://cloud.digitalocean.com/apps
# 2. Click "Create App"
# 3. Choose "GitHub" as source
# 4. Authorize Digital Ocean to access your GitHub
# 5. Select repository: SpacePlushy/portfolio
# 6. Select branch: build-fixes
# 7. Click "Next" through the setup
# 8. Choose "Basic" plan ($5/month)
# 9. Click "Create Resources"
```

### Step 3: (Optional) Add Custom Domain
If you have a custom domain:
```bash
# In Digital Ocean App dashboard:
# 1. Go to Settings → Domains
# 2. Add your domain
# 3. Update your DNS records:
#    - A Record: @ -> (Digital Ocean will show the IP)
#    - CNAME: www -> your-app.ondigitalocean.app
```

### Step 4: (Optional) Configure Analytics
If you want to add analytics later:
```bash
# In App dashboard → Settings → App-Level Environment Variables
# Add one of these:

# For Google Analytics:
ANALYTICS_PROVIDER=ga4
GA4_MEASUREMENT_ID=G-XXXXXXXXXX

# For Plausible:
ANALYTICS_PROVIDER=plausible
PLAUSIBLE_DOMAIN=yourdomain.com
```

## Deployment Commands

### Deploy Latest Changes
```bash
# The app auto-deploys when you push to the branch
git push origin build-fixes

# Or force a manual deploy
doctl apps create-deployment <app-id>
```

### Check App Status
```bash
# Get your app ID
doctl apps list

# Check deployment status
doctl apps get <app-id>

# View logs
doctl apps logs <app-id>
```

### Test Your Deployment
```bash
# Once deployed, test the health endpoint
curl https://your-app.ondigitalocean.app/api/health

# Should return:
# {
#   "status": "healthy",
#   "timestamp": "...",
#   "response_time_ms": ...,
#   "checks": { ... }
# }
```

## Cost Estimate
- **Basic Plan**: $5/month (512 MB RAM, 1 vCPU)
- **Professional Plan**: $12/month (1 GB RAM, 1 vCPU) - Recommended for production
- **CDN**: Free with Digital Ocean Spaces ($5/month for storage)

## Quick Checklist
- [ ] Create Digital Ocean account
- [ ] Generate API token
- [ ] Create app (CLI or Web)
- [ ] Wait for initial deployment (5-10 minutes)
- [ ] Test health endpoint
- [ ] Configure custom domain (optional)
- [ ] Set up CDN (optional)

## Support Resources
- Digital Ocean App Platform Docs: https://docs.digitalocean.com/products/app-platform/
- Support ticket: https://cloud.digitalocean.com/support/tickets/new
- Community: https://www.digitalocean.com/community/questions

## Notes
- The app is configured to auto-deploy when you push to the `build-fixes` branch
- All security features are enabled by default
- The health check will ensure your app stays online
- Logs are available in the Digital Ocean dashboard