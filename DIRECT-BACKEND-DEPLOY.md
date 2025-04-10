# Direct Backend Deployment to Vercel

Due to issues with monorepo deployments in Vercel, follow these steps to deploy the backend directly:

## Prerequisites
1. Install the Vercel CLI: `npm install -g vercel`
2. Login to Vercel: `vercel login`

## Steps to Deploy

### 1. Build the backend locally
```bash
cd web/apps/backend
npm install
npm run build
```

### 2. Deploy using Vercel CLI from the backend directory
```bash
cd web/apps/backend
vercel --prod
```

### 3. Configure Environment Variables
When prompted by the Vercel CLI, make sure to set all required environment variables:

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

## Verification
After deployment, verify the API is working by accessing:
```
https://your-deployment-url/auth/ping
```
You should see "pong" as the response.

## Update Frontend
Update your frontend environment to point to the new backend URL:
```
NEXT_PUBLIC_API_URL=https://your-backend-deployment-url
``` 