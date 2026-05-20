# DNS Setup Guide for amazebid.co (Squarespace)

## Overview
This guide explains how to configure DNS records for the hybrid deployment architecture of AmazeBid using Squarespace domain management.

## Architecture

### Option 1: Zero-Cost (Recommended)
- **Frontend**: Vercel (amazebid.co, www.amazebid.co)
- **Backend API**: Render.com (amazebid-api.onrender.com)

### Option 2: Traditional (Paid)
- **Frontend**: Vercel (amazebid.co, www.amazebid.co)
- **Backend API**: VPS (api.amazebid.co)

This guide covers both options. See `ZERO_COST_DEPLOYMENT_GUIDE.md` for detailed zero-cost setup.

## Step 1: Access Squarespace DNS Settings

1. Log in to your Squarespace account
2. Go to **Settings** > **Domains**
3. Select your domain `amazebid.co`
4. Click on **DNS Settings**

## Step 2: Remove Existing Records

Before adding new records, remove the existing Squarespace default records:

**Remove these records:**
- All A records pointing to Squarespace IPs (198.185.159.145, 198.185.159.144, 198.49.23.144, 198.49.23.145)
- CNAME record for `www` pointing to `ext-sq.squarespace.com`
- HTTPS record
- Domain Connect CNAME record

**Keep these records (if needed for email):**
- TXT records for DKIM, DMARC, SPF (if you use email services)

## Step 3: Add Frontend DNS Records (Vercel)

### After Deploying to Vercel

1. Deploy your frontend to Vercel first
2. Add custom domain in Vercel: `amazebid.co` and `www.amazebid.co`
3. Vercel will provide you with DNS records to verify

**Add these records in Squarespace:**

```
Type: CNAME
Name: @
Data: cname.vercel.app
TTL: 4 hrs

Type: CNAME
Name: www
Data: cname.vercel.app
TTL: 4 hrs
```

**Note:** Replace `cname.vercel.app` with the specific CNAME Vercel provides after you add your custom domain.

## Step 4: Add Backend DNS Records

### Option A: Zero-Cost (Render.com) - No DNS Changes Needed

For zero-cost deployment using Render.com, no additional DNS records are needed. The backend will use Render's default URL:
- `https://amazebid-api.onrender.com`

Simply update your frontend environment variable:
```
VITE_API_URL: https://amazebid-api.onrender.com
```

### Option B: Custom Backend Domain (Optional)

If you want `api.amazebid.co` pointing to Render.com:

1. Add custom domain in Render dashboard
2. Render will provide CNAME record
3. Add this record in Squarespace:

```
Type: CNAME
Name: api
Data: [Render-provided CNAME]
TTL: 4 hrs
```

### Option C: Traditional VPS Deployment

**Add this record in Squarespace:**

```
Type: A
Name: api
Data: [YOUR_VPS_IP_ADDRESS]
TTL: 4 hrs
```

Replace `[YOUR_VPS_IP_ADDRESS]` with your actual VPS IP address.

## Step 5: Verify DNS Propagation

After making changes, verify DNS propagation:

```bash
# Check A record for API subdomain
dig api.amazebid.co

# Check CNAME for main domain
dig amazebid.co CNAME

# Check www subdomain
dig www.amazebid.co CNAME
```

Or use online tools like:
- https://dnschecker.org
- https://whatsmydns.net

DNS propagation typically takes 15 minutes to 48 hours.

## Step 6: SSL Certificate Setup

### Frontend (Vercel)
- SSL is automatically handled by Vercel
- No additional configuration needed

### Backend (VPS)
You'll need to set up SSL on your VPS using Let's Encrypt:

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate for api.amazebid.co
sudo certbot --nginx -d api.amazebid.co

# Auto-renewal is configured automatically
```

## Complete DNS Configuration Example

Your final Squarespace DNS should look like this:

```
Type    Name    Data                            TTL
CNAME   @       cname.vercel.app                4 hrs
CNAME   www     cname.vercel.app                4 hrs
A       api     123.456.789.012                 4 hrs
TXT     @       v=spf1 -all                     4 hrs (if using email)
TXT     _dmarc  v=DMARC1; p=reject; sp=reject   4 hrs (if using email)
```

## Troubleshooting

### DNS not propagating
- Wait up to 48 hours for full propagation
- Clear your browser cache and DNS cache
- Check for typos in DNS records

### SSL certificate errors
- Ensure DNS is fully propagated before requesting SSL
- Check that your VPS firewall allows port 80 and 443
- Verify Nginx/Apache configuration

### CORS errors
- Ensure backend CORS configuration includes both domains
- Check that environment variables are set correctly
- Verify API endpoint URLs in frontend

## Next Steps

After DNS configuration:
1. Deploy frontend to Vercel
2. Deploy backend to VPS
3. Configure SSL on VPS
4. Update environment variables
5. Test the complete setup

See `HYBRID_DEPLOYMENT_GUIDE.md` for complete deployment instructions.
