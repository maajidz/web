# Flattr - Monorepo

This repository contains the Flattr application, structured as a Turborepo monorepo with Next.js frontend and NestJS backend.

## Project Structure

```
flattr/
├── apps/
│   ├── web/           # Next.js frontend
│   └── backend/       # NestJS backend
├── packages/
│   └── ui/            # Shared UI components
├── turbo.json         # Turborepo configuration
└── package.json       # Root package.json
```

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

## Deployment on Vercel

### Important: Deployment Configuration

To avoid recursive Turbo invocations when deploying to Vercel, use separate projects for frontend and backend.

#### Frontend Deployment:

1. Create a new project in Vercel
2. Set the following:
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Install Command**: `npm install --no-scripts`
   - **Output Directory**: `.next`

#### Backend Deployment:

1. Create a new project in Vercel
2. Set the following:
   - **Root Directory**: `apps/backend`
   - **Build Command**: `npm run build`
   - **Install Command**: `npm install --no-scripts`
   - **Output Directory**: `dist`

See the `VERCEL-DEPLOYMENT-GUIDE.md` file for more detailed deployment instructions and troubleshooting tips.
