# Build and Deployment Configuration

## Quick Start for Vercel

1. **Connect to Git Repository:**
   ```bash
   git init
   git add .
   git commit -m "Initial static site"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Import to Vercel:**
   - Go to vercel.com
   - Click "New Project"
   - Import from Git
   - Configure:
     - Build Command: (leave empty - no build needed)
     - Output Directory: `public`
     - Root Directory: `.`

3. **Deploy:**
   - Click "Deploy"
   - Site will be live at `writerity.vercel.app`

## Environment Setup

### Prerequisites
- Node.js 14+ installed
- npm or yarn

### Installation
```bash
npm install
```

## Development

### Test Locally
```bash
npm start
```

Opens http://localhost:8000 in browser automatically.

### Manual Serve
```bash
npm run serve
```

Then open http://localhost:8000

## Production Deployment

### Option 1: Vercel (Easiest)
```bash
npm install -g vercel
vercel
```

### Option 2: GitHub Pages
Create `.github/workflows/publish.yml`:
```yaml
name: Publish

on:
  push:
    branches: [main]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
```

### Option 3: Docker
Create `Dockerfile`:
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t writerity-static .
docker run -p 8000:8000 writerity-static
```

### Option 4: AWS S3 + CloudFront
```bash
# Install AWS CLI
pip install awscli

# Configure credentials
aws configure

# Upload to S3
aws s3 sync public/ s3://writerity-static-site/

# Set as static website hosting
aws s3 website s3://writerity-static-site/ \
  --index-document index.html \
  --error-document index.html
```

## Maintenance

### Update Content
```bash
npm run crawl
```

### Test Changes
```bash
npm start
```

### Push Updates
```bash
git add public/
git commit -m "Update site content"
git push
```

Vercel will automatically redeploy on push.

## Monitoring

- Check deployment status at vercel.com dashboard
- Monitor site performance
- Check browser console for broken links

## Troubleshooting

### Site shows blank page
- Check browser console for errors
- Verify `public/index.html` exists
- Clear browser cache (Ctrl+Shift+Delete)

### Links broken
- Ensure all links are relative paths
- Check URL rewriting in crawler.js

### Images not loading
- This is expected - images are external URLs
- To include images, modify crawler.js
