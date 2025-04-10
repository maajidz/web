# Backend Deployment Instructions

Since we're experiencing persistent issues with deploying the backend as part of the monorepo, here's an alternative approach to deploy just the backend directory.

## Option 1: Deploy using GitHub

1. Create a new GitHub repository just for the backend code
2. Push only the `apps/backend` folder to this repository
3. Connect this repository to Vercel for deployment

```bash
# Clone your monorepo
git clone https://github.com/maajidz/web.git flattr-web

# Create a new repo for just the backend
mkdir flattr-backend
cd flattr-backend

# Initialize a new git repository
git init

# Copy the backend files
cp -r ../flattr-web/apps/backend/* .

# Create a .gitignore file
echo "node_modules\ndist\n.env" > .gitignore

# Commit and push to a new repository
git add .
git commit -m "Initial backend-only commit"
git remote add origin https://github.com/maajidz/flattr-backend.git
git push -u origin main
```

4. Import this repository in Vercel

## Option 2: Deploy using the Vercel CLI

1. Install the Vercel CLI: `npm install -g vercel`
2. Navigate to the backend directory: `cd apps/backend`
3. Run: `vercel --prod`

## Option 3: Create a separate branch

1. Create a new branch: `git checkout -b backend-only`
2. Remove everything except the backend folder:
```bash
git ls-files | grep -v "^apps/backend/" | xargs git rm -f
mv apps/backend/* .
rmdir -p apps/backend
git add .
git commit -m "Backend-only branch for deployment"
git push origin backend-only
```
3. Connect this branch to Vercel

## Recommended Configuration

For any of these methods, use these settings in Vercel:

- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install --no-scripts`

## Important Notes

- Make sure all environment variables are set in the Vercel project settings
- The backend API will be deployed to a URL like `https://flattr-backend.vercel.app`
- Update your frontend to point to this URL 