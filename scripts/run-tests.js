#!/usr/bin/env node

/**
 * Script to run tests with coverage reporting
 * Usage:
 *   node scripts/run-tests.js [--coverage] [--component=<component-path>]
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Parse command line arguments
const args = process.argv.slice(2);
const includeCoverage = args.includes('--coverage');
const componentArg = args.find(arg => arg.startsWith('--component='));
const component = componentArg ? componentArg.split('=')[1] : null;

// Determine what to test
let testPath = '';
if (component) {
  // Convert component path to test path
  // e.g., app/(auth-pages)/sign-up/page.tsx -> __tests__/app/auth-pages/sign-up/page.test.tsx
  testPath = component
    .replace(/\((.*?)\)/g, '$1') // Replace (auth-pages) with auth-pages
    .replace(/\.tsx?$/, '') // Remove file extension
    .replace(/^app\//, '__tests__/app/'); // Replace app/ with __tests__/app/
  
  // Check if the specific test exists
  const testFile = `${testPath}.test.tsx`;
  if (!fs.existsSync(path.join(__dirname, '..', testFile))) {
    console.log(`Test file not found: ${testFile}`);
    testPath = path.dirname(testPath); // Test the directory instead
  } else {
    testPath = testFile;
  }
}

// Build the Jest command
let command = 'jest';

if (includeCoverage) {
  command += ' --coverage';
}

if (testPath) {
  command += ` ${testPath}`;
}

// Execute the command
try {
  console.log(`Running: ${command}`);
  execSync(command, { stdio: 'inherit' });
} catch (error) {
  console.error('Tests failed:', error.message);
  process.exit(1);
}

// If coverage was requested, print the coverage summary
if (includeCoverage) {
  try {
    const coverageSummary = require('../coverage/coverage-summary.json');
    console.log('\nCoverage Summary:');
    console.log('=================');
    
    for (const file in coverageSummary.total) {
      if (file !== 'branchMap' && file !== 'fnMap' && file !== 'statementMap') {
        const percent = coverageSummary.total[file].pct;
        const status = percent >= 80 ? '✅' : (percent >= 50 ? '⚠️' : '❌');
        console.log(`${file}: ${percent.toFixed(2)}% ${status}`);
      }
    }
  } catch (error) {
    console.log('Could not read coverage summary');
  }
} 