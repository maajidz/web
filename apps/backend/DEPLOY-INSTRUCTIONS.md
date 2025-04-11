# Backend Deployment Instructions (Stand-alone Project)

It appears that deploying the backend through the monorepo configuration is causing issues with Turborepo. As an alternative, you can deploy the backend as a stand-alone project using these steps:

## Approach 1: Deploy From Vercel Dashboard

1. **Create a New Project in Vercel**
   - Go to the Vercel Dashboard and click "Add New Project"
   - Import your GitHub repository

2. **Configure the Project**
   - Set the Framework Preset to: **Other**
   - Set the Root Directory to: **apps/backend**
   - Build Command: `pnpm build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`

3. **Add Environment Variables**
   - Add all required environment variables from your .env file
   - Be sure to include:
     ```
     NODE_ENV=production
     PORT=3000
     FRONTEND_URL=https://flattr.io
     JWT_SECRET=your_secret
     SUPABASE_URL=your_supabase_url
     SUPABASE_SERVICE_ROLE_KEY=your_service_key
     COOKIE_DOMAIN=flattr.io
     ```

4. **Deploy**
   - Click "Deploy" to start the deployment

## Approach 2: Direct Upload (If Git Method Fails)

If you're still encountering issues with the Git-based deployment, you can try a direct upload approach:

1. Build the backend locally:
   ```bash
   cd apps/backend
   pnpm install
   pnpm build
   ```

2. Use the Vercel CLI to deploy the dist folder directly:
   ```bash
   cd dist
   vercel --prod
   ```

## Important Notes

- Make sure your backend's `package.json` has the correct name `@flattr/backend`
- The backend should be added as a separate project in Vercel, not as part of the monorepo deployment
- Once deployed, add your custom domain (api.flattr.io) in the Vercel project settings

## Troubleshooting

If you continue to encounter issues with Turborepo in the Vercel environment, consider extracting the backend to a separate repository for deployment. 