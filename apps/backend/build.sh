#!/bin/bash
set -e

echo "Starting backend build process..."

# Install dependencies locally without relying on registry
if [ -d "node_modules" ]; then
  echo "Node modules exist, skipping install"
else
  echo "Installing dependencies with npm..."
  npm install --prefer-offline --no-audit --progress=false
fi

# Run the build
echo "Building the application..."
npm run build

echo "Build completed successfully!" 