# Deploying Frontend and Backend as Separate Vercel Projects

Due to persistent npm registry connection issues in monorepo deployments, the best approach is to deploy the frontend and backend as separate Vercel projects.

## Frontend Deployment (Next.js)

1. Create a new Vercel project
2. Connect to your GitHub repository
3. Set the following configuration:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: Leave default (Next.js will auto-detect)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `pnpm install --no-scripts`

4. Add all environment variables from `.env.local`
5. Deploy the project

## Backend Deployment (NestJS)

1. Create a new Vercel project
2. Connect to your GitHub repository
3. Set the following configuration:
   - **Framework Preset**: Other
   - **Root Directory**: `apps/backend`
   - **Build Command**: Leave empty (we're using direct builds)
   - **Output Directory**: Leave empty (we're using direct builds)
   - **Install Command**: Leave empty (we're using direct builds)

4. Add all environment variables from `.env.production`
5. Deploy the project

## Connecting Frontend and Backend

After deployment, you'll have two URLs:
- Frontend: `https://your-frontend.vercel.app`
- Backend: `https://your-backend.vercel.app`

Update the frontend to point to your backend:
1. Add a new environment variable in the frontend project settings:
   - `NEXT_PUBLIC_API_URL=https://your-backend.vercel.app`

2. Update any API fetch calls to use this URL

## Custom Domains

Once everything is working correctly, you can add custom domains:
- Frontend: `www.flattr.io`
- Backend: `api.flattr.io`

## Troubleshooting

If you encounter deployment issues:

1. **Registry Errors**: These are common with monorepo setups. Using separate projects with smaller dependency trees helps avoid them.

2. **CORS Issues**: Make sure your backend allows requests from your frontend domain:
   - Check the `ALLOWED_ORIGINS` in the backend `.env.production`
   - Verify the CORS headers in the backend `vercel.json`

3. **Build Failures**: Check the build logs to identify specific issues
   - Frontend: Look for Next.js specific errors
   - Backend: Make sure all dependencies are correctly listed

4. **Runtime Errors**: Monitor logs in the Vercel dashboard
   - Use browser dev tools to check for frontend issues
   - Use Vercel logs to diagnose backend issues 