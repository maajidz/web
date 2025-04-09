#!/bin/bash

# Function to clean up processes on exit
cleanup() {
    echo "Stopping all processes..."
    # Kill the Ngrok process
    kill $ngrok_pid 2>/dev/null
    # Kill the SSH tunnel process
    kill $ssh_pid 2>/dev/null
    exit 0
}

# Trap SIGINT (Ctrl+C) and call cleanup function
trap cleanup SIGINT

# Start the frontend
echo "Starting frontend..."
npm run dev &

# Start the backend
echo "Starting backend..."
( cd backend && npm run start:dev ) &

# Wait for the backend to start
sleep 5

# Start Ngrok for the backend
echo "Starting Ngrok..."
ngrok http 3001 --log=stdout &

# Capture the Ngrok process ID
ngrok_pid=$!

# Wait for Ngrok to initialize
sleep 5

# Establish SSH tunnel and capture the Pinggy.io URL
echo "Establishing SSH tunnel..."
ssh -p 443 -R0:localhost:3000 -L4300:localhost:4300 -o StrictHostKeyChecking=no -o ServerAliveInterval=30 7xmE3h76lS6@free.pinggy.io | while read line; do
    echo "$line" # Print SSH logs to the console
    # Check for the line containing the Pinggy.io URL
    if [[ $line == *"free.pinggy.io"* ]]; then
        # Extract the URL using a more complex regex
        pinggy_url=$(echo $line | grep -oP 'https://[a-z0-9-]+\.([0-9a-zA-Z-]+\.)?free\.pinggy\.link')
        echo "Pinggy.io URL: $pinggy_url"

        # Update the .env files with the new Pinggy.io URL
        echo "Updating ALLOWED_ORIGINS in .env and .env.local..."

        # Update backend/.env
        sed -i.bak "s|http://localhost:3000,http://192.168.1.18:3000,.*|http://localhost:3000,http://192.168.1.18:3000,$pinggy_url|" backend/.env

        # Update .env.local
        sed -i.bak "s|http://localhost:3000,http://192.168.1.18:3000,.*|http://localhost:3000,http://192.168.1.18:3000,$pinggy_url|" .env.local

        # Update NEXT_PUBLIC_BACKEND_CALLBACK_URL in .env.local
        sed -i.bak "s|NEXT_PUBLIC_BACKEND_CALLBACK_URL=.*|NEXT_PUBLIC_BACKEND_CALLBACK_URL=$pinggy_url/auth/true-sdk|" .env.local

        # Remove backup files created by sed
        rm backend/.env.bak
        rm .env.local.bak

        # Break the loop after updating the URL
        break
    fi
done &

# Capture the SSH tunnel process ID
ssh_pid=$!

# Keep the SSH tunnel running
wait $ssh_pid