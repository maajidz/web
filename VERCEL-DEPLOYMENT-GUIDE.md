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

## Root Deployment (Not Recommended)

If you're deploying from the root of the monorepo (not recommended), you'll need to avoid recursive Turbo invocations:

1. Use the specialized `vercel-build` or `vercel-build-backend` scripts:
   - **Build Command**: `npm run vercel-build` (for frontend)
   - **Build Command**: `npm run vercel-build-backend` (for backend)

2. Alternatively, directly call the build scripts in the desired app:
   - **Build Command**: `cd apps/web && npm run build` (for frontend)
   - **Build Command**: `cd apps/backend && npm run build` (for backend)

## Environment Variables

Make sure to set all required environment variables in the Vercel project settings.

## Troubleshooting

1. **Recursive Turbo Invocations**: If you see an error about recursive Turbo invocations, ensure you're not using `turbo run build` in your build command. Instead, use the direct build commands mentioned above.

2. **npm Registry Issues**: 
   - Try using `npm` instead of `pnpm` for installation commands
   - Consider creating a temporary branch for deployment purposes only
   - Use the `.npmrc` files in each project directory to set registry options and retry settings

3. **For Critical Deployments**: Consider using the Vercel CLI with `--prod` flag from a local environment