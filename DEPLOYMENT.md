# Deployment Guide

## Netlify Deployment

### Prerequisites

1. Netlify account
2. GitHub repository connected to Netlify
3. Node.js 18+ installed locally

### Environment Variables

Set these in Netlify dashboard (Site settings → Environment variables):

```
VITE_API_URL=
NODE_ENV=production
```

### Automatic Deployment

The site is configured for automatic deployment on push to main branch.

**Build settings:**
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

### Manual Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy to production
netlify deploy --prod
```

### Local Development with Netlify Functions

```bash
# Start Netlify dev server (includes functions)
npm run dev

# Or start Vite only
npm run dev:vite
```

The dev server will be available at `http://localhost:8888`

### Build Optimization

The build is optimized for:
- Modern browsers (ES2015+)
- Code splitting for better caching
- Minification with Terser
- Gzip/Brotli compression

### Performance Targets

- Lighthouse score > 90
- First Contentful Paint < 1.5s
- Time to Interactive < 3.0s
- Cumulative Layout Shift < 0.1

### Monitoring

After deployment, monitor:
- Netlify Analytics for traffic
- Netlify Functions logs for API errors
- Browser console for client-side errors

### Rollback

To rollback to a previous deployment:

1. Go to Netlify dashboard
2. Navigate to Deploys
3. Find the previous successful deploy
4. Click "Publish deploy"

### Custom Domain

To add a custom domain:

1. Go to Site settings → Domain management
2. Add custom domain
3. Configure DNS records as instructed
4. Enable HTTPS (automatic with Let's Encrypt)

### CI/CD Pipeline

The deployment pipeline:

1. **Push to GitHub** → Triggers Netlify build
2. **Build** → Runs `npm run build`
3. **Test** → Runs `npm test` (if configured)
4. **Deploy** → Publishes to Netlify CDN
5. **Monitor** → Track performance and errors

### Troubleshooting

**Build fails:**
- Check build logs in Netlify dashboard
- Verify all dependencies are in package.json
- Ensure Node version matches (18+)

**Functions not working:**
- Check function logs in Netlify dashboard
- Verify function path in netlify.toml
- Test locally with `netlify dev`

**Environment variables not working:**
- Ensure variables are prefixed with `VITE_`
- Redeploy after adding new variables
- Check variable names match exactly
