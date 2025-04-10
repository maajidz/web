#!/bin/bash

# Install pnpm if not installed
if ! command -v pnpm &> /dev/null
then
    echo "Installing pnpm..."
    npm install -g pnpm
fi

# Remove node_modules and lockfiles to start fresh
echo "Cleaning up existing node_modules and lockfiles..."
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
rm -f package-lock.json
rm -f pnpm-lock.yaml

# Install dependencies with pnpm
echo "Installing dependencies with pnpm..."
pnpm install

echo "Setup complete! You can now use pnpm to manage your monorepo." 