# Hybrid Deployment Guide for AmazeBid (amazebid.co)

## Architecture Overview

This guide covers deploying AmazeBid using a hybrid architecture:
- **Frontend**: Vercel (React app)
- **Backend**: VPS (Express server + Socket.io)
- **Domain**: amazebid.co (Squarespace)

```
User Browser → amazebid.co (Vercel) → api.amazebid.co (VPS)
```

## Prerequisites

- Domain: amazebid.co (Squarespace)
- GitHub account
- Vercel account
- VPS with Ubuntu 20.04+ (DigitalOcean, AWS, Linode, etc.)
- Node.js 20+ installed locally

## Part 1: Frontend Deployment (Vercel)

### Step 1: Prepare Frontend for Vercel

The project already includes `vercel.json` configuration.

### Step 2: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit for hybrid deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/amazebid.git
git push -u origin main
```

### Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variables:
   - `VITE_API_URL`: `https://api.amazebid.co`
   - `VITE_ADMIN_EMAIL`: `Nhatlinhckm2016@gmail.com`
   - `GEMINI_API_KEY`: Your Gemini API key
6. Click "Deploy"

### Step 4: Add Custom Domain in Vercel

1. Go to project Settings → Domains
2. Add `amazebid.co`
3. Add `www.amazebid.co`
4. Vercel will provide DNS records to add

### Step 5: Configure DNS in Squarespace

Follow the instructions in `DNS_SETUP_GUIDE.md` to configure DNS records.

## Part 2: Backend Deployment (VPS)

### Step 1: Connect to VPS

```bash
ssh root@your-vps-ip
```

### Step 2: Install Dependencies

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Nginx
apt install -y nginx

# Install Certbot for SSL
apt install -y certbot python3-certbot-nginx
```

### Step 3: Setup Application Directory

```bash
# Create app directory
mkdir -p /var/www/amazebid-api
cd /var/www/amazebid-api

# Clone repository (or upload files)
git clone https://github.com/YOUR_USERNAME/amazebid.git .
```

### Step 4: Configure Environment Variables

```bash
# Copy environment template
cp .env.production .env

# Edit with your values
nano .env
```

Required variables:
```env
NODE_ENV=production
PORT=3000
GEMINI_API_KEY=your_key_here
CORS_ORIGIN=https://amazebid.co,https://www.amazebid.co
RESEND_API_KEY=your_resend_key
DATABASE_URL=your_database_url
```

### Step 5: Build and Run with Docker

```bash
# Build Docker image
docker build -t amazebid-api .

# Run container
docker run -d \
  --name amazebid-api \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env \
  amazebid-api
```

### Step 6: Configure Nginx Reverse Proxy

```bash
# Create Nginx config
nano /etc/nginx/sites-available/api.amazebid.co
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name api.amazebid.co;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/api.amazebid.co /etc/nginx/sites-enabled/

# Test Nginx config
nginx -t

# Restart Nginx
systemctl restart nginx
```

### Step 7: Setup SSL Certificate

```bash
# Obtain SSL certificate
certbot --nginx -d api.amazebid.co

# Test auto-renewal
certbot renew --dry-run
```

### Step 8: Setup Process Manager (Optional but Recommended)

Install PM2 for better process management:

```bash
# Install PM2 globally
npm install -g pm2

# Start application with PM2
cd /var/www/amazebid-api
pm2 start server.ts --name amazebid-api

# Setup PM2 to start on boot
pm2 startup
pm2 save
```

## Part 3: Testing and Verification

### Test Frontend
```bash
# Check frontend
curl https://amazebid.co
curl https://www.amazebid.co
```

### Test Backend API
```bash
# Check API health
curl https://api.amazebid.co/api/health

# Test API endpoint
curl https://api.amazebid.co/api/products
```

### Test CORS
Open browser console and test API calls from frontend to ensure CORS is working correctly.

## Part 4: Monitoring and Maintenance

### View Docker Logs
```bash
docker logs -f amazebid-api
```

### View PM2 Logs (if using PM2)
```bash
pm2 logs amazebid-api
pm2 monit
```

### Restart Services
```bash
# Restart Docker container
docker restart amazebid-api

# Restart PM2 process
pm2 restart amazebid-api

# Restart Nginx
systemctl restart nginx
```

### Update Application
```bash
cd /var/www/amazebid-api
git pull origin main
docker build -t amazebid-api .
docker stop amazebid-api
docker rm amazebid-api
docker run -d --name amazebid-api --restart unless-stopped -p 3000:3000 --env-file .env amazebid-api
```

## Troubleshooting

### Frontend Issues
- **Build fails**: Check Vercel build logs
- **Environment variables missing**: Verify Vercel environment settings
- **API calls failing**: Check CORS configuration and API URL

### Backend Issues
- **Container not starting**: Check Docker logs
- **Port already in use**: `lsof -i :3000` to find process
- **Database connection**: Verify DATABASE_URL in .env
- **SSL certificate**: Ensure DNS is propagated before requesting cert

### DNS Issues
- **Propagation delay**: Wait 15-48 hours for DNS propagation
- **Incorrect records**: Verify DNS records in Squarespace
- **CNAME vs A**: Ensure correct record types for each subdomain

## Security Best Practices

1. **Firewall Configuration**
```bash
# Configure UFW firewall
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

2. **SSH Security**
- Disable root login
- Use SSH keys only
- Change default SSH port

3. **Environment Variables**
- Never commit .env files
- Use strong secrets
- Rotate keys regularly

4. **Regular Updates**
```bash
# Update system regularly
apt update && apt upgrade -y

# Update Docker images
docker pull amazebid-api:latest
```

## Cost Estimate

- **Vercel**: Free (Hobby plan)
- **VPS**: $5-20/month (DigitalOcean, Linode, etc.)
- **Domain**: Already owned (Squarespace)
- **SSL**: Free (Let's Encrypt)

**Total**: ~$5-20/month

## Support

For issues:
- Check logs in both Vercel and VPS
- Verify DNS propagation
- Test API endpoints directly
- Check CORS configuration

See `DNS_SETUP_GUIDE.md` for detailed DNS configuration instructions.
