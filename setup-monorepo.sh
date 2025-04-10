#!/bin/bash

# Create necessary directories
mkdir -p apps/web/src
mkdir -p apps/web/public
mkdir -p apps/backend/src

# Copy frontend files
cp -r src/* apps/web/src/
cp -r public/* apps/web/public/
cp .env.local apps/web/
cp .env.local.example apps/web/
cp next.config.js apps/web/
cp next-env.d.ts apps/web/
cp tailwind.config.js apps/web/
cp postcss.config.js apps/web/
cp daisyui.d.ts apps/web/

# Copy backend files
cp -r backend/src/* apps/backend/src/
cp backend/.env apps/backend/
cp backend/.env.example apps/backend/
cp -r backend/migrations apps/backend/
cp -r backend/supabase apps/backend/

# Rename the root package files
mv root-package.json package.json
mv tsconfig.root.json tsconfig.json

# Add .turbo to .gitignore if not already present
if ! grep -q ".turbo" .gitignore; then
  echo ".turbo" >> .gitignore
fi

# Install pnpm if not already installed
if ! command -v pnpm &> /dev/null; then
  echo "Installing pnpm..."
  npm install -g pnpm
fi

echo "Monorepo structure has been set up. Now run './setup-pnpm.sh' to install dependencies with pnpm."