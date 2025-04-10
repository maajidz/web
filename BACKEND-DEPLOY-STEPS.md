# Backend-Only Deployment Steps

Follow these simple steps to deploy just the backend to Vercel:

## Option 1: Deploy from GitHub

1. Create a separate repository for the backend:
   ```bash
   git clone https://github.com/maajidz/web.git temp-repo
   cd temp-repo
   mkdir backend-only
   cp -r apps/backend/* backend-only/
   cd backend-only
   git init
   git add .
   git commit -m "Initial backend-only commit"
   # Create a new GitHub repo and push to it
   git remote add origin https://github.com/maajidz/flattr-backend.git
   git push -u origin main
   ```

2. Import the new repository in Vercel
   - No configuration needed - the `vercel.json` handles everything

## Option 2: Deploy using Vercel CLI (Simplest)

1. Install Vercel CLI if not already installed:
   ```bash
   npm install -g vercel
   ```

2. Navigate to the backend directory:
   ```bash
   cd apps/backend
   ```

3. Deploy directly:
   ```bash
   vercel --prod
   ```
   
   Follow the prompts and choose "No" when asked about build settings - 
   our `vercel.json` already has everything configured.

## Option 3: Deploy using the Vercel Dashboard

1. Go to https://vercel.com/new
2. Select "Import Git Repository"
3. Enter your GitHub repo URL
4. Set the following:
   - Root Directory: `apps/backend`
   - Framework Preset: Other
   - Build Command: (leave empty)
   - Output Directory: (leave empty)

5. Click Deploy

## Environment Variables

Make sure to add these environment variables in the Vercel project settings:

```
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://www.flattr.io
BACKEND_URL=https://api.flattr.io
JWT_SECRET=your-secret
JWT_EXPIRATION=7d
COOKIE_SECRET=your-cookie-secret
COOKIE_DOMAIN=flattr.io
ALLOWED_ORIGINS=https://www.flattr.io,https://*.vercel.app,https://*.flattr.io
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-key
LOG_LEVEL=info
``` 