#!/usr/bin/env node
import { glob } from 'glob';
import fs from 'fs/promises';
import parser from '@babel/parser';
import _traverse from '@babel/traverse';
import _generate from '@babel/generator';

const traverse = _traverse.default;
const generate = _generate.default;

const FORBIDDEN_CONSOLE_METHODS = [
  'log',
  'debug',
  'info',
  'trace',
  'group',
  'groupEnd',
];

async function removeConsoles(filePath) {
  try {
    const code = await fs.readFile(filePath, 'utf-8');
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });

    let fileModified = false;
    traverse(ast, {
      CallExpression(path) {
        const callee = path.get('callee');
        if (callee.isMemberExpression()) {
          const obj = callee.get('object');
          const prop = callee.get('property');
          if (obj.isIdentifier({ name: 'console' }) && FORBIDDEN_CONSOLE_METHODS.some(method => prop.isIdentifier({ name: method }))) {
            path.remove();
            fileModified = true;
          }
        }
      },
    });

    if (fileModified) {
      const { code: newCode } = generate(ast, {
        retainLines: true,
        comments: true,
      });

      if (code !== newCode) {
        await fs.writeFile(filePath, newCode, 'utf-8');
        console.log(`Processed and updated: ${filePath}`);
      }
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
  }
}

async function main() {
  const files = await glob('src/**/*.{ts,tsx}');
  const chunkSize = 20;
  for (let i = 0; i < files.length; i += chunkSize) {
    const chunk = files.slice(i, i + chunkSize);
    await Promise.all(chunk.map(file => removeConsoles(file)));
  }
  console.log('Finished removing console statements.');
}

main();
