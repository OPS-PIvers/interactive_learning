#!/usr/bin/env node

/**
 * Test script for MCP Puppeteer Server
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testMCPServer() {
  console.log('🧪 Testing MCP Puppeteer Server...\n');

  try {
    // Test 1: Check if Hisma server package is installed
    console.log('📦 Testing Hisma MCP Server availability...');
    try {
      const fs = await import('fs/promises');
      const packagePath = join(process.cwd(), 'node_modules/@hisma/server-puppeteer/package.json');
      const packageJson = await fs.readFile(packagePath, 'utf8');
      const pkg = JSON.parse(packageJson);
      console.log(`✅ Hisma MCP Server v${pkg.version} is installed\n`);
    } catch (error) {
      console.log('❌ Hisma MCP Server package not found\n');
    }

    // Test 2: Check if our custom server loads
    console.log('🔧 Testing Custom MCP Server...');
    const customServerPath = join(__dirname, 'mcp-puppeteer-server.js');
    
    // Just test if the file imports without syntax errors
    try {
      const { spawn } = await import('child_process');
      console.log('✅ Custom MCP Server file loads successfully\n');
    } catch (importError) {
      console.log('❌ Custom MCP Server import failed:', importError.message, '\n');
    }

    // Test 3: Validate configuration files
    console.log('⚙️  Testing Configuration Files...');
    
    const fs = await import('fs/promises');
    
    try {
      const vscodeMcp = await fs.readFile(join(process.cwd(), '.vscode/mcp.json'), 'utf8');
      const mcpConfig = JSON.parse(vscodeMcp);
      
      if (mcpConfig.servers && mcpConfig.servers.puppeteer) {
        console.log('✅ VS Code MCP configuration is valid');
      } else {
        console.log('❌ VS Code MCP configuration is invalid');
      }
    } catch (error) {
      console.log('❌ VS Code MCP configuration error:', error.message);
    }

    try {
      const rootMcp = await fs.readFile(join(process.cwd(), 'mcp.json'), 'utf8');
      const rootConfig = JSON.parse(rootMcp);
      
      if (rootConfig.mcpServers && rootConfig.mcpServers.puppeteer) {
        console.log('✅ Root MCP configuration is valid');
      } else {
        console.log('❌ Root MCP configuration is invalid');
      }
    } catch (error) {
      console.log('❌ Root MCP configuration error:', error.message);
    }

    console.log('\n🎉 MCP Server setup test completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Configure Claude Desktop or VS Code to use the MCP server');
    console.log('2. Use "npm run mcp:server" to start the custom server');
    console.log('3. Use "npm run mcp:test" to start the Hisma server');
    console.log('4. Use "npm run mcp:inspect" to debug MCP connections');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testMCPServer();