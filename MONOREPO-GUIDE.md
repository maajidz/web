# Flattr Monorepo Setup Guide

This guide will help you migrate your existing project to a Turborepo monorepo structure.

## Prerequisites

- Node.js v20+
- pnpm v8+ (will be installed during setup if not present)
- Basic understanding of monorepo concepts

## Setup Steps

1. **Prepare your existing codebase**

   Before starting the migration, make sure you commit any changes to your existing codebase.

   ```bash
   git add .
   git commit -m "Commit before monorepo migration"
   ```

2. **Run the setup script**

   This script will create the monorepo structure and copy your existing files to the appropriate locations.

   ```bash
   chmod +x setup-monorepo.sh
   ./setup-monorepo.sh
   ```

3. **Install pnpm and dependencies**

   Run the pnpm setup script to install pnpm and all dependencies:

   ```bash
   chmod +x setup-pnpm.sh
   ./setup-pnpm.sh
   ```

4. **Start development**

   Now you can start the development environment:

   ```bash
   chmod +x dev.sh
   ./dev.sh
   ```

## Monorepo Structure

```
flattr/
├── apps/
│   ├── web/           # Next.js frontend
│   └── backend/       # NestJS backend
├── packages/
│   └── ui/            # Shared UI components
├── turbo.json         # Turborepo configuration
├── package.json       # Root package.json
└── pnpm-workspace.yaml # pnpm workspace configuration
```

## Common Issues and Solutions

### Error: `Module not found: Can't resolve '@flattr/ui'`

If you encounter this error when importing from the UI package, make sure:

1. You've run `pnpm install` to install all dependencies
2. The `transpilePackages` option in `apps/web/next.config.js` includes `"@flattr/ui"`
3. The paths in your `tsconfig.json` are correctly configured

### Error: `Invalid configuration object. Webpack has been initialized using a configuration object that does not match the API schema.`

This typically occurs when there's an issue with the Next.js configuration. Check:

1. Make sure you're using `next.config.js` (not `.ts` or `.mjs`)
2. The configuration object has the correct format

### pnpm Workspace Protocol Issues

If you see errors related to the `workspace:*` protocol:

1. Make sure you're using pnpm (not npm or yarn)
2. Check that your `.npmrc` file has the correct configuration

## Deploying to Vercel

When deploying to Vercel:

1. Create a new project in Vercel
2. Set the root directory as the monorepo root
3. Configure the build settings to build the specific app you want to deploy
4. Add all required environment variables

For the frontend, set:
- Build Command: `cd ../.. && pnpm turbo run build --filter=@flattr/web`
- Output Directory: `apps/web/.next`

For the backend, set:
- Build Command: `cd ../.. && pnpm turbo run build --filter=@flattr/backend`
- Output Directory: `apps/backend/dist` 