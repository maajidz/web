# Backend Deployment to Vercel

Due to persistent npm registry connection issues on Vercel, follow these manual steps to deploy the backend:

## 1. Set Up a New Project in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Select your GitHub repository
4. Configure the project as follows:

## 2. Project Configuration

* **Framework Preset**: Other
* **Root Directory**: `apps/backend`
* **Build Command**: `./build.sh`
* **Output Directory**: `dist`
* **Install Command**: `npm install --prefer-offline --no-audit`

## 3. Environment Variables

Add all the environment variables from `.env.production`:

```
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://www.flattr.io
BACKEND_URL=https://api.flattr.io
JWT_SECRET=your-jwt-secret
JWT_EXPIRATION=7d
COOKIE_SECRET=your-cookie-secret
COOKIE_DOMAIN=flattr.io
ALLOWED_ORIGINS=https://www.flattr.io,https://*.vercel.app,https://*.flattr.io
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-key
LOG_LEVEL=info
```

## 4. Deploy

Click "Deploy" to start the deployment process.

## 5. Verify Deployment

1. After deployment completes, click on the deployment URL
2. Test the `/auth/ping` endpoint to verify the API is working

## Troubleshooting

If you encounter build issues related to npm registry connections:

1. Try to redeploy the project
2. Check the build logs for specific errors
3. Consider using npm instead of pnpm in the build process
4. Make sure the build.sh script has executable permissions

## Notes

* The backend API will be available at `https://your-project-name.vercel.app`
* Update your frontend `.env` file to point to this URL
* CORS is configured to allow requests from vercel.app domains 