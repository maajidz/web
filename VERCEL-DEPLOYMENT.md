# Deploying Flattr to Vercel

This guide provides instructions for deploying the Flattr monorepo to Vercel.

## Prerequisites

- A Vercel account
- Access to the GitHub repository
- Domain name (www.flattr.io)

## Deployment Architecture

The Flattr application is deployed as a monorepo with two main components:

1. **Frontend application** (Next.js) - deployed at www.flattr.io
2. **Backend API** (NestJS) - deployed at api.flattr.io

## Setup Process

### Step 1: Set Up Vercel Project

1. Create a new project in Vercel
2. Connect to your GitHub repository
3. Configure the build settings:
   - Framework Preset: Other
   - Build Command: `pnpm turbo run build`
   - Output Directory: Leave empty (handled by our configuration)

### Step 2: Configure Custom Domains

1. Add `www.flattr.io` as the primary domain for the frontend
2. Add `api.flattr.io` as a domain for the backend API
   - You'll need to create a separate production deployment for the backend

### Step 3: Set Environment Variables

For each deployment, configure the appropriate environment variables in the Vercel dashboard:

#### Frontend Variables

Copy the values from `apps/web/.env.production` to your Vercel project environment variables.

#### Backend Variables

Copy the values from `apps/backend/.env.production` to your Vercel project environment variables for the API deployment.

### Step 4: Configure CORS and Cookies

Make sure the CORS settings in both your frontend and backend configurations allow communication between the domains:

- `www.flattr.io` should be allowed to make requests to `api.flattr.io`
- Cookies should be configured with the proper domain (`.flattr.io`)

### Step 5: Deploy

1. Deploy the application with the "Deploy" button in Vercel
2. Verify both the frontend and backend are working properly
3. Set up automatic deployments for future updates

## Monitoring & Logs

After deployment, you can monitor your application performance:

1. Visit the Vercel dashboard for logs and performance metrics
2. Use the built-in analytics to track usage patterns
3. Set up alerts for any errors or performance issues

## Troubleshooting

Common issues and their solutions:

### CORS Errors
- Ensure the backend `.env` files have the correct frontend URL in the allowed origins
- Check that the headers in `vercel.json` are properly configured

### Authentication Issues
- Verify that the JWT secrets match between frontend and backend
- Ensure cookie domains are properly set for cross-subdomain authentication

### API Connection Problems
- Check the API URL configuration in the frontend
- Verify that the routing in `vercel.json` is correctly set up

## Contact

For deployment support, contact the development team at support@flattr.io. 