#!/usr/bin/env node

/**
 * Test script to verify ESLint configuration works correctly across all packages
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packages = ['packages/shared', 'packages/server', 'packages/client'];

console.log('🧪 Testing ESLint configuration across monorepo packages...\n');

let allPassed = true;

for (const pkg of packages) {
  console.log(`Testing ${pkg}...`);
  
  try {
    // Check if package has source files
    const srcDir = path.join(pkg, 'src');
    if (!fs.existsSync(srcDir)) {
      console.log(`  ⚠️  No src directory found, skipping`);
      continue;
    }

    // Run ESLint on the package
    const result = execSync(`npm run lint --workspace=@dnd-tracker/${path.basename(pkg)}`, { 
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    console.log(`  ✅ ESLint passed for ${pkg}`);
  } catch (error) {
    console.log(`  ❌ ESLint failed for ${pkg}`);
    console.log(`     Error: ${error.message}`);
    allPassed = false;
  }
}

console.log(`\n${allPassed ? '✅ All ESLint tests passed!' : '❌ Some ESLint tests failed!'}`);
process.exit(allPassed ? 0 : 1);