#!/bin/bash

# Function to clean up background processes on exit
cleanup() {
  echo "Cleaning up processes..."
  if [ -n "$TURBO_PID" ]; then
    kill -TERM "$TURBO_PID" 2>/dev/null || true
  fi
  exit 0
}

# Set up trap to catch SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

# Start Turborepo development
pnpm run dev & TURBO_PID=$!

# Wait for any process to exit
wait

# Clean up
cleanup 