# Vercel Deployment Guide for CopticBook

## Prerequisites
- Git repository initialized (✅ Done)
- Vercel account (create one at https://vercel.com)
- Vercel CLI installed (optional, for command-line deployment)

## Files Created for Deployment

1. **vercel.json** - Vercel configuration for SPA routing and asset caching
2. **copy-assets.js** - Script to copy public assets to build output
3. **.vercelignore** - Files to exclude from deployment
4. **Updated App.tsx** - Changed font URLs from localhost:8082 to relative paths
5. **Updated package.json** - Added build and vercel-build scripts

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Commit and push your changes:**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment with fixed headers"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to https://vercel.com/dashboard
   - Click "Add New" → "Project"
   - Import your Git repository
   - Vercel will auto-detect the configuration from vercel.json

3. **Configure build settings** (if needed):
   - Framework Preset: Other
   - Build Command: `npm run vercel-build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Deploy:**
   - Click "Deploy"
   - Wait for the build to complete (~2-5 minutes)
   - Your app will be live at `https://your-project-name.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment with fixed headers"
   git push origin main
   ```

4. **Deploy:**
   ```bash
   vercel
   ```

   Follow the prompts to configure your project.

5. **Deploy to production:**
   ```bash
   vercel --prod
   ```

## Testing the Build Locally (Optional)

Before deploying, you can test the production build locally:

```bash
# Build the app
npm run build

# Serve the dist folder using a static server
npx serve dist
```

Then open http://localhost:3000 to test the production build.

## What Happens During Deployment

1. Vercel installs dependencies via `npm install`
2. Runs `expo export -p web` to build the React Native web app
3. Runs `copy-assets.js` to copy public assets to dist directory
4. Serves the dist directory with proper SPA routing
5. Assets are cached with long expiration headers

## Key Changes Made

- **Font URLs**: Changed from `http://localhost:8082/assets/fonts/...` to `/assets/fonts/...`
- **Build Output**: Configured to export to `dist` directory
- **Asset Copying**: Public assets are automatically copied to build output
- **SPA Routing**: All routes redirect to index.html for client-side routing

## Troubleshooting

### Fonts not loading
- Make sure public/assets/fonts directory contains Coptic.ttf and CS New Athanasius.ttf
- Check browser console for 404 errors
- Verify copy-assets.js ran successfully in build logs

### XML files not loading
- Verify public/assets/xml directory is copied to dist
- Check that copy-assets.js completed successfully

### Build fails
- Check build logs in Vercel dashboard
- Verify all dependencies are in package.json (not just devDependencies)
- Make sure Node.js version is compatible (Vercel uses Node 18+ by default)

## Post-Deployment

After deployment:
- Test all functionality (Bible, Agpeya, liturgies, etc.)
- Test font rendering
- Test date picker and settings
- Test on different browsers and devices
- Set up a custom domain if desired (in Vercel dashboard)

## Environment Variables (if needed in future)

If you need to add environment variables:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add variables for development, preview, and production

## Continuous Deployment

Once connected to Git:
- Every push to `main` branch automatically deploys to production
- Every pull request creates a preview deployment
- You can configure branch deployments in Vercel settings
