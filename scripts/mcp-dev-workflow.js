#!/usr/bin/env node

/**
 * MCP Development Workflow Script
 * Provides easy commands for common MCP development tasks
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const COMMANDS = {
  'test': 'Run all MCP tests',
  'validate': 'Validate MCP configuration',
  'start-hisma': 'Start Hisma MCP server',
  'start-custom': 'Start custom MCP server',
  'debug-hisma': 'Start Hisma server in debug mode',
  'debug-custom': 'Start custom server in debug mode',
  'claude-list': 'List Claude MCP servers',
  'claude-test': 'Test Claude MCP integration',
  'demo': 'Run MCP demonstration examples',
  'help': 'Show this help message'
};

async function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });

    process.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    process.on('error', reject);
  });
}

async function mcpWorkflow() {
  const command = process.argv[2];

  if (!command || command === 'help') {
    console.log('🛠️  MCP Development Workflow\n');
    console.log('Usage: node scripts/mcp-dev-workflow.js <command>\n');
    console.log('Available commands:');
    
    Object.entries(COMMANDS).forEach(([cmd, desc]) => {
      console.log(`  ${cmd.padEnd(15)} - ${desc}`);
    });
    
    console.log('\nExamples:');
    console.log('  node scripts/mcp-dev-workflow.js test');
    console.log('  node scripts/mcp-dev-workflow.js start-hisma');
    console.log('  npm run mcp:workflow test');
    return;
  }

  console.log(`🚀 Running MCP workflow: ${command}\n`);

  try {
    switch (command) {
      case 'test':
        console.log('📋 Running all MCP tests...');
        await runCommand('node', ['scripts/test-mcp-server.js']);
        console.log();
        await runCommand('node', ['scripts/validate-mcp-config.js']);
        console.log();
        await runCommand('node', ['scripts/test-claude-mcp-integration.js']);
        break;

      case 'validate':
        console.log('🔧 Validating MCP configuration...');
        await runCommand('node', ['scripts/validate-mcp-config.js']);
        break;

      case 'start-hisma':
        console.log('🌐 Starting Hisma MCP server...');
        console.log('Press Ctrl+C to stop the server');
        await runCommand('npx', ['@hisma/server-puppeteer']);
        break;

      case 'start-custom':
        console.log('⚙️  Starting custom MCP server...');
        console.log('Press Ctrl+C to stop the server');
        await runCommand('node', ['scripts/mcp-puppeteer-server.js']);
        break;

      case 'debug-hisma':
        console.log('🐛 Starting Hisma MCP server in debug mode...');
        process.env.DEBUG = '*';
        process.env.PUPPETEER_LAUNCH_OPTIONS = JSON.stringify({
          headless: false,
          devtools: true,
          slowMo: 100
        });
        await runCommand('npx', ['@hisma/server-puppeteer']);
        break;

      case 'debug-custom':
        console.log('🐛 Starting custom MCP server in debug mode...');
        process.env.DEBUG = '*';
        await runCommand('node', ['--inspect', 'scripts/mcp-puppeteer-server.js']);
        break;

      case 'claude-list':
        console.log('📋 Listing Claude MCP servers...');
        await runCommand('claude', ['mcp', 'list']);
        break;

      case 'claude-test':
        console.log('🤖 Testing Claude MCP integration...');
        await runCommand('node', ['scripts/test-claude-mcp-integration.js']);
        break;

      case 'demo':
        console.log('🎭 Running MCP demonstration...');
        await runMCPDemo();
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('Run "node scripts/mcp-dev-workflow.js help" for available commands');
        process.exit(1);
    }

    console.log('\n✅ Workflow completed successfully!');

  } catch (error) {
    console.error(`\n❌ Workflow failed: ${error.message}`);
    process.exit(1);
  }
}

async function runMCPDemo() {
  console.log('🎭 MCP Puppeteer Demonstration\n');
  
  const demoSteps = [
    '1. Starting Hisma MCP server...',
    '2. Testing browser navigation...',
    '3. Taking a screenshot...',
    '4. Testing form interaction...',
    '5. Executing JavaScript...'
  ];

  // This is a simulation of what would happen
  for (const step of demoSteps) {
    console.log(`   ${step}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n📖 Demo completed! Here\'s what you can do with MCP:');
  console.log('');
  console.log('🌐 Browser Navigation:');
  console.log('   Ask Claude: "Navigate to https://example.com"');
  console.log('');
  console.log('📸 Screenshots:');
  console.log('   Ask Claude: "Take a screenshot of the current page"');
  console.log('');
  console.log('🖱️  Element Interaction:');
  console.log('   Ask Claude: "Click the button with text \'Submit\'"');
  console.log('');
  console.log('📝 Form Filling:');
  console.log('   Ask Claude: "Fill the email field with test@example.com"');
  console.log('');
  console.log('⚡ JavaScript Execution:');
  console.log('   Ask Claude: "Get the page title using JavaScript"');
  console.log('');
  console.log('💡 Pro tip: You can combine multiple actions in one request!');
  console.log('   "Navigate to Google, search for \'MCP\', and screenshot the results"');
}

mcpWorkflow();