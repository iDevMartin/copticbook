#!/usr/bin/env node

/**
 * Post-build script to copy public directory to dist
 * This ensures all static assets are available in the production build
 */

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, 'public');
const targetDir = path.join(__dirname, 'dist');

// Check if dist directory exists
if (!fs.existsSync(targetDir)) {
  console.log('❌ dist directory not found. Run build first.');
  process.exit(1);
}

// Copy public directory to dist
function copyRecursive(src, dest) {
  const stats = fs.statSync(src);

  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const files = fs.readdirSync(src);
    files.forEach(file => {
      copyRecursive(
        path.join(src, file),
        path.join(dest, file)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log('📁 Copying public assets to dist...');
copyRecursive(sourceDir, targetDir);
console.log('✅ Public assets copied successfully!');
