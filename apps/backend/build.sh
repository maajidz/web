#!/bin/bash
set -e

echo "Starting backend build process..."

# Disable husky git hooks installation
export HUSKY=0
export HUSKY_SKIP_INSTALL=1

# Install dependencies locally without relying on registry
if [ -d "node_modules" ]; then
  echo "Node modules exist, skipping install"
else
  echo "Installing dependencies with npm..."
  npm install --prefer-offline --no-audit --progress=false --no-scripts
fi

# Run the build
echo "Building the application..."
npm run build

echo "Build completed successfully!" 