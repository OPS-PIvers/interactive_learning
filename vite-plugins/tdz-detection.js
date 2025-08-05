// vite-plugins/tdz-detection.js - Custom TDZ and Runtime Error Detection Plugin
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
const traverse = traverseModule.default || traverseModule;

/**
 * Custom Vite plugin for detecting Temporal Dead Zone and runtime error patterns
 * that ESLint might miss or that are specific to our application architecture.
 */
export function tdzDetectionPlugin(options = {}) {
  const {
    failOnError = false,
    warningOnly = true,
    patterns = [],
  } = options;

  return {
    name: 'tdz-detection',
    
    transform(code, id) {
      // Only process TypeScript/JavaScript files
      if (!/\.[jt]sx?$/.test(id) || id.includes('node_modules')) {
        return null;
      }

      try {
        const ast = parse(code, {
          sourceType: 'module',
          plugins: [
            'typescript',
            'jsx',
            'decorators-legacy',
            'classProperties',
            'optionalChaining',
            'nullishCoalescingOperator',
          ],
        });

        const issues = [];

        traverse(ast, {
          // Detect potential TDZ issues with destructuring
          VariableDeclarator(path) {
            if (path.node.init && path.node.id.type === 'ObjectPattern') {
              // Check for destructuring that might access undefined properties
              const hasComplex = path.node.id.properties.some(prop => 
                prop.type === 'ObjectProperty' && prop.computed
              );
              
              if (hasComplex) {
                issues.push({
                  type: 'potential-tdz',
                  message: 'Complex destructuring pattern may cause TDZ issues',
                  line: path.node.loc?.start.line || 0,
                });
              }
            }
          },

          // Detect member expressions that might fail at runtime
          MemberExpression(path) {
            const { object, property } = path.node;
            
            // Check for chained property access without optional chaining
            if (object.type === 'MemberExpression' && !path.node.optional) {
              // Look for patterns like obj.prop1.prop2 without ?. operator
              let current = path;
              let chainLength = 0;
              
              while (current && current.node.type === 'MemberExpression') {
                chainLength++;
                current = current.get('object');
                if (chainLength > 2 && !path.node.optional) {
                  issues.push({
                    type: 'unsafe-chain',
                    message: 'Deep property access without optional chaining may cause runtime errors',
                    line: path.node.loc?.start.line || 0,
                  });
                  break;
                }
              }
            }
          },

          // Detect async/await patterns that might cause issues
          AwaitExpression(path) {
            const parent = path.parent;
            
            // Check if await is used in a way that might cause TDZ
            if (parent.type === 'VariableDeclarator') {
              const sibling = path.getSibling('init');
              if (sibling && sibling.node && sibling.node.type === 'Identifier') {
                issues.push({
                  type: 'async-tdz',
                  message: 'Async/await pattern may cause temporal dead zone issues',
                  line: path.node.loc?.start.line || 0,
                });
              }
            }
          },

          // Detect React Hook patterns that might violate rules
          CallExpression(path) {
            const { callee } = path.node;
            
            if (callee.type === 'Identifier' && callee.name.startsWith('use')) {
              // Check if hook is called conditionally (basic detection)
              let current = path.parent;
              while (current) {
                if (current.type === 'IfStatement' || 
                    current.type === 'ConditionalExpression' ||
                    current.type === 'LogicalExpression') {
                  issues.push({
                    type: 'conditional-hook',
                    message: `Hook '${callee.name}' may be called conditionally`,
                    line: path.node.loc?.start.line || 0,
                  });
                  break;
                }
                current = current.parent;
              }
            }
          },

          // Detect InteractionType usage patterns (specific to our app)
          ImportDeclaration(path) {
            const source = path.node.source.value;
            
            if (source.includes('shared/types') && 
                path.node.specifiers.some(spec => 
                  spec.imported && spec.imported.name === 'InteractionType'
                )) {
              issues.push({
                type: 'deprecated-import',
                message: 'InteractionType should be imported from shared/enums to avoid circular dependencies',
                line: path.node.loc?.start.line || 0,
              });
            }
          },
        });

        // Report issues
        if (issues.length > 0) {
          const errorPrefix = failOnError ? 'ERROR' : 'WARNING';
          const filePath = id.replace(process.cwd(), '');
          
          console.log(`\n🔍 ${errorPrefix}: TDZ Detection found ${issues.length} potential issues in ${filePath}:`);
          
          issues.forEach(issue => {
            console.log(`  Line ${issue.line}: [${issue.type}] ${issue.message}`);
          });

          if (failOnError && !warningOnly) {
            throw new Error(`TDZ Detection failed: Found ${issues.length} issues in ${filePath}`);
          }
        }

        return null; // Don't transform the code
      } catch (error) {
        if (error.name === 'SyntaxError') {
          // Ignore syntax errors in this plugin - let other tools handle them
          return null;
        }
        throw error;
      }
    },
  };
}

export default tdzDetectionPlugin;