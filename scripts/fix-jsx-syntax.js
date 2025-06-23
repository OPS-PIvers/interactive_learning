#!/usr/bin/env node

/**
 * JSX Syntax Fixer Script
 * This script finds and fixes common JSX syntax errors that cause build failures
 * 
 * Usage: node scripts/fix-jsx-syntax.js
 */

const fs = require('fs');
const path = require('path');

// Target file path
const filePath = path.join(__dirname, '../src/client/components/InteractiveModule.tsx');

console.log('🔧 JSX Syntax Fixer');
console.log('===================');

if (!fs.existsSync(filePath)) {
  console.error('❌ InteractiveModule.tsx not found at:', filePath);
  process.exit(1);
}

// Read the current file content
let content = fs.readFileSync(filePath, 'utf8');
let originalContent = content;
let fixesApplied = 0;

console.log('📖 Reading file:', filePath);

// Define the fixes to apply
const fixes = [
  {
    name: 'Fix malformed JSX comments',
    pattern: /\*\*\*\/\*\s*([^*]*?)\s*\*\/\*\*\*/g,
    replacement: '{/* $1 */}',
    description: 'Replace ***/* comment */*/** with {/* comment */}'
  },
  {
    name: 'Fix malformed style attributes',
    pattern: /style=\*\*\*\s*([^*]*?)\s*\*\*\*/g,
    replacement: 'style={{ $1 }}',
    description: 'Replace style=*** prop *** with style={{ prop }}'
  },
  {
    name: 'Fix malformed JSX expressions',
    pattern: /\*\*\*([^*&]+?)&&\s*\(/g,
    replacement: '{$1 && (',
    description: 'Replace ***variable && ( with {variable && ('
  },
  {
    name: 'Fix malformed JSX variable references',
    pattern: /\*\*\*([a-zA-Z_$][a-zA-Z0-9_$]*)\*\*\*/g,
    replacement: '{$1}',
    description: 'Replace ***variable*** with {variable}'
  },
  {
    name: 'Fix malformed closing patterns',
    pattern: /\*\*\*\s*>/g,
    replacement: '>',
    description: 'Replace ***> with >'
  }
];

// Apply each fix
fixes.forEach((fix, index) => {
  const beforeCount = (content.match(fix.pattern) || []).length;
  if (beforeCount > 0) {
    content = content.replace(fix.pattern, fix.replacement);
    const afterCount = (content.match(fix.pattern) || []).length;
    const fixed = beforeCount - afterCount;
    if (fixed > 0) {
      console.log(`✅ ${fix.name}: Fixed ${fixed} occurrence(s)`);
      console.log(`   ${fix.description}`);
      fixesApplied += fixed;
    }
  }
});

// Check for any remaining *** patterns
const remainingIssues = (content.match(/\*\*\*/g) || []).length;
if (remainingIssues > 0) {
  console.log(`⚠️  Warning: ${remainingIssues} remaining *** patterns found`);
  console.log('   Manual review may be required');
}

// Save the fixed content if changes were made
if (content !== originalContent) {
  fs.writeFileSync(filePath, content);
  console.log(`\n🎉 Applied ${fixesApplied} fixes successfully!`);
  console.log('📝 File updated:', filePath);
  console.log('\n📋 Next steps:');
  console.log('   1. Review the changes: git diff');
  console.log('   2. Test the build: npm run build');
  console.log('   3. Commit changes: git add . && git commit -m "fix: JSX syntax errors"');
  console.log('   4. Push changes: git push');
} else {
  console.log('✨ No JSX syntax issues found - file is already clean!');
}

// Additional validation
console.log('\n🔍 Validation Summary:');
console.log('─────────────────────');
console.log(`Original file size: ${originalContent.length} characters`);
console.log(`Updated file size: ${content.length} characters`);
console.log(`Changes made: ${content !== originalContent ? 'Yes' : 'No'}`);
console.log(`Fixes applied: ${fixesApplied}`);
console.log(`Remaining *** patterns: ${remainingIssues}`);

if (remainingIssues === 0 && fixesApplied > 0) {
  console.log('\n🚀 Ready for deployment!');
} else if (remainingIssues > 0) {
  console.log('\n⚠️  Manual review recommended');
}
