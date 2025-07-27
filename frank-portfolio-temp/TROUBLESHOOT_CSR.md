# Customer Service Representative (CSR) Subdomain 404 Troubleshooting Guide

## 🚨 Current Issue
- `swe.palmisano.io` works ✅
- `csr.palmisano.io` returns 404 error ❌

This is definitely a DNS/Vercel configuration issue, not a code issue.

## 🔍 Step-by-Step Diagnosis

### Step 1: Check Vercel Domains
1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Domains**
2. Verify you see ALL THREE domains:
   - `palmisano.io`
   - `swe.palmisano.io` 
   - `csr.palmisano.io`

**If `csr.palmisano.io` is missing:**
- Click **Add Domain**
- Enter `csr.palmisano.io`
- Follow Vercel's instructions

### Step 2: Check Domain Status in Vercel
Each domain should show:
- ✅ **Valid Configuration** 
- ✅ **SSL Certificate Issued**

**If `csr.palmisano.io` shows errors:**
- Click on the domain for detailed instructions
- Follow Vercel's specific DNS requirements

### Step 3: Verify DNS in Namecheap
Go to **Namecheap** → **Domain List** → **palmisano.io** → **Advanced DNS**

**Required records:**
```
Type: A
Host: @
Value: 76.76.21.21
TTL: Automatic

Type: CNAME
Host: www
Value: cname.vercel-dns.com
TTL: Automatic

Type: CNAME
Host: swe
Value: cname.vercel-dns.com
TTL: Automatic

Type: CNAME
Host: csr
Value: cname.vercel-dns.com
TTL: Automatic
```

### Step 4: DNS Propagation Test
Run these commands in terminal:

```bash
# Check if CSR subdomain resolves
nslookup csr.palmisano.io

# Check if SWE resolves (working one)
nslookup swe.palmisano.io

# Compare the results
```

**Expected result for both:**
```
Non-authoritative answer:
csr.palmisano.io    canonical name = cname.vercel-dns.com.
```

### Step 5: Online DNS Checker
Use https://dnschecker.org/:
1. Enter `csr.palmisano.io`
2. Select "CNAME" 
3. Check if it resolves to `cname.vercel-dns.com` globally

## 🛠 Common Fixes

### Fix 1: Missing Domain in Vercel
**Most likely cause!** Add `csr.palmisano.io` to your Vercel project.

### Fix 2: Missing DNS Record
Add the CNAME record in Namecheap:
```
Type: CNAME
Host: csr
Value: cname.vercel-dns.com
```

### Fix 3: Wrong DNS Value
Make sure the CNAME points to `cname.vercel-dns.com` (not an IP address).

### Fix 4: DNS Cache
Clear your DNS cache:
```bash
# macOS
sudo dscacheutil -flushcache

# Windows  
ipconfig /flushdns
```

## 📞 What to Check Right Now

1. **In Vercel Dashboard**: Do you see `csr.palmisano.io` listed in domains?
2. **In Namecheap DNS**: Do you see a CNAME record for `csr`?
3. **DNS Test**: Does `nslookup csr.palmisano.io` return `cname.vercel-dns.com`?

## 🚀 Quick Test
Try this temporary test to verify the code works:

**Option 1: Force Customer Service Representative mode locally**
1. Temporarily edit `src/middleware.ts`
2. Change line 12 to: `let variant = 'csr' // Force CSR for testing`
3. Run `npm run dev`
4. Visit `http://localhost:3000` - should show Customer Service Representative content

**Option 2: Test with query parameter**
Add this to middleware for testing:
```typescript
// Add after line 9 in middleware.ts
const variant = request.nextUrl.searchParams.get('variant') || 
  (subdomain === 'swe' ? 'swe' : subdomain === 'csr' ? 'csr' : 'general')
```

Then test: `https://swe.palmisano.io?variant=csr`