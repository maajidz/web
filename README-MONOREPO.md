# Flattr Monorepo

This is a Turborepo-based monorepo for the Flattr application, containing both the frontend and backend code.

## What's inside?

This monorepo uses [Turborepo](https://turbo.build/) for task orchestration and caching. It includes the following packages/apps:

### Apps and Packages

- `apps/web`: a [Next.js](https://nextjs.org/) application for the frontend
- `apps/backend`: a [NestJS](https://nestjs.com/) application for the backend API
- `packages/ui`: a shared React component library used by the web application
- `packages/eslint-config-custom`: shared ESLint configurations

### Utilities

This Turborepo has some additional tools already set up for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

## Getting Started

### Prerequisites

- Node.js (v20 or later)
- npm (v10 or later)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/flattr.git
cd flattr
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

Copy the example environment files and update them with your configuration:

```bash
cp apps/web/.env.local.example apps/web/.env.local
cp apps/backend/.env.example apps/backend/.env
```

### Development

To develop all apps and packages, run the following command:

```bash
npm run dev
```

Or use the provided script:

```bash
./dev.sh
```

### Build

To build all apps and packages, run the following command:

```bash
npm run build
```

### Useful Turborepo Commands

- `npm run dev` - Start all applications in development mode
- `npm run build` - Build all applications and packages
- `npm run lint` - Lint all applications and packages
- `npm run clean` - Clean up all build artifacts and caches

## Remote Caching

Turborepo can use a technique called [Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching) to share build artifacts across machines. By default, this is disabled. To enable Remote Caching:

1. Login to your Vercel account:

```
npx turbo login
```

2. Link your Turborepo to your Remote Cache:

```
npx turbo link
```

## Deployment

This monorepo is configured to deploy to Vercel. Each app is deployed as a separate project, but they are managed together in the same Git repository.

### Setting up Vercel Deployment

1. Create a new project on Vercel.
2. Connect it to your GitHub repository.
3. Configure the environment variables for each application.
4. Deploy the project.

## Adding New Packages or Apps

### Adding a New Package

```bash
mkdir -p packages/my-package
cd packages/my-package
npm init -y
```

### Adding a New App

```bash
mkdir -p apps/my-app
cd apps/my-app
# Initialize with the appropriate framework
# For example, to create a new Next.js app:
npx create-next-app --typescript
```

## License

[MIT](LICENSE) 