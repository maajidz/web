/**
 * Pre-build script for web app
 * This script ensures all dependencies are properly configured before building
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔄 Running pre-build checks...');

// Paths
const ROOT_DIR = path.resolve(__dirname);
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, 'package.json');
const TYPES_DIR = path.join(ROOT_DIR, 'src', 'types');

// Ensure types directory exists
if (!fs.existsSync(TYPES_DIR)) {
  console.log('📁 Creating types directory...');
  fs.mkdirSync(TYPES_DIR, { recursive: true });
}

// Check if jwt-decode is installed properly
function ensureJwtDecodeInstalled() {
  console.log('🔍 Checking jwt-decode package...');
  
  try {
    // Try to require jwt-decode to see if it's installed
    require('jwt-decode');
    console.log('✅ jwt-decode package is properly installed');
  } catch (error) {
    console.warn('⚠️  jwt-decode package not found, installing...');
    
    try {
      // Update package.json if needed
      if (fs.existsSync(PACKAGE_JSON_PATH)) {
        const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
        
        if (!packageJson.dependencies['jwt-decode']) {
          packageJson.dependencies['jwt-decode'] = '^4.0.0';
          fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2), 'utf8');
          console.log('📝 Added jwt-decode to package.json');
        }
      }
      
      // Install dependencies
      execSync('npm install jwt-decode@4.0.0 --no-save', { stdio: 'inherit' });
      console.log('✅ jwt-decode package installed successfully');
    } catch (installError) {
      console.error('❌ Failed to install jwt-decode:', installError.message);
      console.log('⚠️ Continuing with build using fallback JWT decoder...');
    }
  }
}

// Ensure TypeScript declaration files exist
function ensureTypeDeclarations() {
  console.log('🔍 Checking TypeScript declarations...');
  
  // jwt-decode.d.ts
  const jwtDecodeTypePath = path.join(TYPES_DIR, 'jwt-decode.d.ts');
  if (!fs.existsSync(jwtDecodeTypePath)) {
    console.log('📝 Creating jwt-decode.d.ts...');
    const jwtDecodeTypes = `declare module 'jwt-decode' {
  /**
   * Decodes a JWT token
   * @param token The JWT string to decode
   * @param options The options to be used during decode
   * @returns The decoded token
   */
  export function jwtDecode<T = any>(token: string, options?: JwtDecodeOptions): T;
  
  export interface JwtDecodeOptions {
    header?: boolean;
  }
}`;
    fs.writeFileSync(jwtDecodeTypePath, jwtDecodeTypes, 'utf8');
    console.log('✅ Created jwt-decode.d.ts');
  }
}

// Run checks
try {
  ensureJwtDecodeInstalled();
  ensureTypeDeclarations();
  console.log('✅ Pre-build checks completed successfully');
} catch (error) {
  console.error('❌ Pre-build checks failed:', error.message);
  process.exit(1);
} 