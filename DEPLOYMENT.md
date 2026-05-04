# Build and Deployment Configuration

## Quick Start for Appwrite Sites

1. **Connect to Git Repository:**
  ```bash
  git init
  git add .
  git commit -m "Initial static site"
  git remote add origin <your-repo-url>
  git push -u origin main
  ```

2. **Create an Appwrite Site (Console):**
  - Go to your Appwrite Console
  - Create a new Site resource and note the `SITE_ID`
  - Configure DNS or use the default Appwrite URL

3. **Deploy with Appwrite CLI:**
  - Build your site locally so `public/` contains the output (if applicable)
  - Deploy:
    ```bash
    npm install -g appwrite-cli
    appwrite client --endpoint "https://<your-appwrite>/v1" --project-id "<PROJECT_ID>" --key "<API_KEY>"
    appwrite sites createDeployment --siteId "<SITE_ID>" --activate true --code "public" --json
    ```

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

### Option 1: Appwrite Sites (Easiest for static)
```bash
npm install -g appwrite-cli
# Authenticate first:
appwrite client --endpoint "https://<your-appwrite>/v1" --project-id "<PROJECT_ID>" --key "<API_KEY>"
# Then deploy the public/ directory:
appwrite sites createDeployment --siteId "<SITE_ID>" --activate true --code "public" --json
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

Appwrite deployment is triggered by the repository GitHub Actions workflow on merge.

## Monitoring

-- Check deployment status in the Appwrite Console
-- Monitor site performance
-- Check browser console for broken links

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
