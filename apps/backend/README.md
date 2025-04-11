# Flattr Backend API

NestJS backend for the Flattr application.

## Deploying to Vercel as a Subdomain

Follow these steps to deploy the backend API as a subdomain (api.flattr.io) on Vercel.

### Step 1: Create a New Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" > "Project"
3. Import your Git repository
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `apps/backend`
   - **Build and Output Settings**:
     - Override default settings (Vercel.json should handle this)

### Step 2: Environment Variables

Add the following environment variables in the Vercel project settings:

```
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://flattr.io
BACKEND_URL=https://api.flattr.io
JWT_SECRET=your-secret-here
JWT_EXPIRATION=7d
COOKIE_SECRET=your-cookie-secret
COOKIE_DOMAIN=flattr.io
ALLOWED_ORIGINS=https://flattr.io,https://www.flattr.io
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-key
LOG_LEVEL=info
```

### Step 3: Add Custom Domain

1. In the Vercel dashboard, go to your backend project
2. Navigate to "Settings" > "Domains"
3. Add `api.flattr.io` as a custom domain
4. Follow Vercel's instructions to verify domain ownership and configure DNS

### Step 4: Deploy

Click "Deploy" or push changes to your repository to trigger a deployment.

## Local Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm run dev

# Build for production
pnpm run build

# Run in production mode
pnpm run start:prod
```

## API Documentation

The API serves various endpoints for authentication, user management, and application functionality.

### Key Endpoints:

- **Authentication**: `/auth/*`
- **User Profile**: `/users/*`

For a complete list of endpoints and documentation, run the application and visit `/docs` (Swagger documentation).

## Notes on Cross-Domain Communication

- The backend is configured to accept requests from the main Flattr domain via CORS
- Authentication cookies are set with the `.flattr.io` domain to allow sharing between subdomains
- The `vercel.json` file contains header configurations to enable secure cross-domain API requests 