# Vercel Deployment Guide for Flattr

This guide provides instructions for deploying the Flattr monorepo on Vercel when experiencing npm registry connection issues.

## Backend Deployment

### Project Settings:

1. Go to your Vercel dashboard and navigate to the backend project settings
2. Under "Build & Development Settings", configure:
   - **Root Directory**: `apps/backend`
   - **Framework Preset**: Node.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install --no-scripts`

### Before Deployment:

If the registry issues persist, try these steps:

1. Rename `package-vercel.json` to `package.json` in the backend directory:
   ```bash
   cd apps/backend
   cp package-vercel.json package.json
   git add package.json
   git commit -m "Use simplified package.json for deployment"
   git push
   ```

2. After deployment, revert the changes:
   ```bash
   cd apps/backend
   git checkout HEAD^ -- package.json
   git add package.json
   git commit -m "Restore original package.json"
   git push
   ```

## Frontend Deployment

### Project Settings:

1. Go to your Vercel dashboard and navigate to the frontend project settings
2. Under "Build & Development Settings", configure:
   - **Root Directory**: `apps/web`
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install --no-scripts`

### Before Deployment:

If the registry issues persist, try these steps:

1. Rename `package-vercel.json` to `package.json` in the web directory:
   ```bash
   cd apps/web
   cp package-vercel.json package.json
   git add package.json
   git commit -m "Use simplified package.json for deployment"
   git push
   ```

2. After deployment, revert the changes:
   ```bash
   cd apps/web
   git checkout HEAD^ -- package.json
   git add package.json
   git commit -m "Restore original package.json"
   git push
   ```

## Environment Variables

Make sure to set all required environment variables in the Vercel project settings.

## Troubleshooting

1. If you still face registry issues, try using `npm` instead of `pnpm` for installation commands
2. Consider creating a temporary branch for deployment purposes only
3. Use the `.npmrc` files in each project directory to set registry options and retry settings
4. For the most critical deployments, consider using the Vercel CLI with `--prod` flag from a local environment 