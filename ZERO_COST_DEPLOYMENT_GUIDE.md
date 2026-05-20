# Zero Cost Deployment Guide for AmazeBid (amazebid.co)

## Overview
Deploy AmazeBid with **$0 monthly cost** using free-tier services.

## Architecture
- **Frontend**: Vercel (Free)
- **Backend**: Render.com (Free)
- **Domain**: amazebid.co (Already owned)

```
User Browser → amazebid.co (Vercel) → api.amazebid.co (Render)
```

## Cost Breakdown
- Vercel: $0 (Hobby plan)
- Render.com: $0 (Free web service)
- Domain: $0 (Already owned)
- SSL: $0 (Auto-provisioned)
- **Total: $0/month**

## Part 1: Frontend Deployment (Vercel)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/amazebid.git
git push -u origin main
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variables:
   - `VITE_API_URL`: `https://api.amazebid.co.onrender.com`
   - `VITE_ADMIN_EMAIL`: `Nhatlinhckm2016@gmail.com`
   - `GEMINI_API_KEY`: Your key
6. Click "Deploy"

### Step 3: Add Custom Domain
1. Go to Settings → Domains
2. Add `amazebid.co` and `www.amazebid.co`
3. Vercel will provide DNS records

## Part 2: Backend Deployment (Render.com)

### Step 1: Prepare Backend
Create `render.yaml` in project root:

```yaml
services:
  - type: web
    name: amazebid-api
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: GEMINI_API_KEY
        sync: false
      - key: CORS_ORIGIN
        value: https://amazebid.co,https://www.amazebid.co
```

### Step 2: Deploy to Render
1. Go to [render.com](https://render.com)
2. Sign up (free)
3. Click "New +" → "Web Service"
4. Connect GitHub repository
5. Configure:
   - **Name**: amazebid-api
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Branch**: main
6. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `3000`
   - `GEMINI_API_KEY`: Your key
   - `CORS_ORIGIN`: `https://amazebid.co,https://www.amazebid.co`
   - `DATABASE_URL`: (if using database)
   - `RESEND_API_KEY`: (if using email)
7. Click "Create Web Service"

### Step 3: Get Render URL
After deployment, Render will provide URL like:
`https://amazebid-api.onrender.com`

### Step 4: Add Custom Domain (Optional)
1. Go to Render dashboard → your service
2. Settings → Custom Domains
3. Add `api.amazebid.co`
4. Render will provide DNS records

## Part 3: DNS Configuration (Squarespace)

### Option A: Without Custom Backend Domain
If using Render's default URL:

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

Update frontend environment variable:
```
VITE_API_URL: https://amazebid-api.onrender.com
```

### Option B: With Custom Backend Domain
If you want `api.amazebid.co`:

```
Type: CNAME
Name: @
Data: cname.vercel.app
TTL: 4 hrs

Type: CNAME
Name: www
Data: cname.vercel.app
TTL: 4 hrs

Type: CNAME
Name: api
Data: [Render-provided CNAME]
TTL: 4 hrs
```

## Part 4: Update Frontend Configuration

### Update vite.config.ts
```typescript
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        tailwindcss(),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY || ''),
        'process.env.VITE_ADMIN_EMAIL': JSON.stringify(env.VITE_ADMIN_EMAIL || 'Nhatlinhckm2016@gmail.com'),
        'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'https://amazebid-api.onrender.com')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
```

### Update API calls in frontend
Replace localhost URLs with Render URL:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'https://amazebid-api.onrender.com';
```

## Part 5: Testing

### Test Frontend
```bash
curl https://amazebid.co
```

### Test Backend
```bash
curl https://amazebid-api.onrender.com/api/health
```

### Test from Frontend
Open browser console and test API calls to ensure CORS works.

## Free Tier Limitations

### Vercel (Hobby Plan)
- ✅ Unlimited bandwidth
- ✅ Automatic SSL
- ✅ Custom domains
- ⚠️ 100GB bandwidth/month (usually sufficient)
- ⚠️ Serverless functions timeout after 10s

### Render.com (Free Plan)
- ✅ 512MB RAM
- ✅ 0.1 CPU
- ✅ Free SSL
- ✅ Custom domains
- ⚠️ Spins down after 15min inactivity
- ⚠️ Cold start ~30s
- ⚠️ 750 hours/month runtime

### Workarounds for Limitations

**Render Spin-down Issue**
- Use external monitoring service (UptimeRobot)
- Set up cron job to ping every 10 minutes
- Or upgrade to paid plan ($7/month) if needed

**Cold Start**
- Optimize startup time
- Use smaller dependencies
- Consider Railway.app as alternative

## Alternative Free Services

### Railway.app
- $5 free credit/month
- No spin-down
- Better performance
- More generous limits

### Fly.io
- Free apps up to 3 regions
- No cold starts
- Global deployment
- More complex setup

### Heroku
- Free tier discontinued (Dec 2022)
- Not recommended

### Glitch.com
- Completely free
- Good for development
- Not production-ready
- Limited customization

### Replit
- Free tier available
- Always-on option ($20/month)
- Good for development
- Limited production use

## Monitoring

### Render Dashboard
- View logs in real-time
- Monitor resource usage
- Check deployment status

### Uptime Monitoring
Use free services:
- UptimeRobot (free)
- Pingdom (free tier)
- StatusCake (free)

## Scaling

When you need to scale:
1. **Render**: Upgrade to Starter ($7/month)
2. **Railway**: Pay as you go
3. **Vercel**: Upgrade to Pro ($20/month)

## Troubleshooting

### Render Service Not Starting
- Check build logs
- Verify environment variables
- Ensure package.json scripts are correct

### CORS Errors
- Verify CORS_ORIGIN includes your domains
- Check backend logs for CORS errors
- Test API directly with curl

### Cold Start Delays
- Optimize dependencies
- Reduce startup time
- Consider Railway.app alternative

### DNS Issues
- Wait for propagation (15-48 hours)
- Verify DNS records in Squarespace
- Check Render/Vercel domain settings

## Security

Even with free tiers:
- Use strong API keys
- Enable SSL (automatic)
- Set proper CORS origins
- Don't commit .env files
- Rotate secrets regularly

## Summary

**Zero Cost Architecture:**
- Frontend: Vercel (Free)
- Backend: Render.com (Free)
- Domain: amazebid.co (Owned)
- SSL: Automatic (Free)
- Monitoring: UptimeRobot (Free)

**Total Monthly Cost: $0**

**When to Upgrade:**
- High traffic (>1000 visitors/day)
- Need consistent performance (no cold starts)
- Require more resources
- Production SLA needed

This setup is perfect for:
- MVP launch
- Testing and validation
- Low-traffic applications
- Personal projects
- Portfolio sites
