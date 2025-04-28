# Backend Deployment Instructions

Use the following settings when creating a new backend project in Vercel:

## Project Configuration

1. **Root Directory**: 
   - Set to `apps/backend`

2. **Framework Preset**:
   - Set to `Other`

3. **Build Command**:
   - Set to `pnpm build`

4. **Output Directory**:
   - Set to `dist`

5. **Install Command**:
   - Set to `pnpm install`

## Environment Variables

Add the following environment variables:s

```
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://flattr.io
JWT_SECRET=your_secret
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
COOKIE_DOMAIN=flattr.io
ALLOWED_ORIGINS=https://flattr.io,https://www.flattr.io
```

## Domain Setup

After deployment:
1. Go to Settings > Domains
2. Add `api.flattr.io` as the domain
3. Configure the DNS settings as instructed by Vercel

## Important Notes

When deploying the backend as a separate project:
- Make sure the Vercel CLI uses the `apps/backend` directory as the root
- The `vercel.json` file in the backend directory has all the necessary configuration
- After deployment, update any frontend API URLs to point to `https://api.flattr.io`
- Ensure the CORS settings allow your frontend domain

## Troubleshooting

If you encounter build issues:
- Check if the NestJS CLI is properly installed as a dependency
- Ensure the build script in `package.json` is `"build": "nest build"`
- Verify that your environment variables are correctly set in Vercel 