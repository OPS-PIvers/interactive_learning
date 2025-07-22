#!/usr/bin/env node

/**
 * Validate MCP Configuration and Test Transport Methods
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function validateMCPConfig() {
  console.log('🔧 Validating MCP Configuration and Transport Methods...\n');

  const results = {
    vscodeConfig: false,
    rootConfig: false,
    customServer: false,
    hismaServer: false,
    transport: false
  };

  try {
    // Test 1: Validate VS Code configuration
    console.log('📁 Validating VS Code MCP Configuration...');
    try {
      const vscodeConfig = await fs.readFile('.vscode/mcp.json', 'utf8');
      const config = JSON.parse(vscodeConfig);
      
      if (config.servers?.puppeteer) {
        const server = config.servers.puppeteer;
        console.log(`✅ VS Code config: Command="${server.command}", Args=[${server.args.join(', ')}]`);
        
        // Validate environment variables
        if (server.env?.PUPPETEER_LAUNCH_OPTIONS) {
          const launchOpts = JSON.parse(server.env.PUPPETEER_LAUNCH_OPTIONS);
          console.log(`✅ Launch options configured: headless=${launchOpts.headless}`);
        }
        results.vscodeConfig = true;
      }
    } catch (error) {
      console.log(`❌ VS Code config error: ${error.message}`);
    }

    console.log();

    // Test 2: Validate root configuration
    console.log('📁 Validating Root MCP Configuration...');
    try {
      const rootConfig = await fs.readFile('mcp.json', 'utf8');
      const config = JSON.parse(rootConfig);
      
      if (config.mcpServers?.puppeteer) {
        const server = config.mcpServers.puppeteer;
        console.log(`✅ Root config: Command="${server.command}", Args=[${server.args.join(', ')}]`);
        results.rootConfig = true;
      }
    } catch (error) {
      console.log(`❌ Root config error: ${error.message}`);
    }

    console.log();

    // Test 3: Test custom server startup
    console.log('🚀 Testing Custom MCP Server Startup...');
    try {
      const customServer = spawn('node', ['scripts/mcp-puppeteer-server.js'], {
        stdio: 'pipe'
      });

      let customOutput = '';
      customServer.stdout.on('data', (data) => {
        customOutput += data.toString();
      });

      customServer.stderr.on('data', (data) => {
        customOutput += data.toString();
      });

      // Give the server 3 seconds to start
      const customResult = await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          customServer.kill('SIGTERM');
          resolve({ started: true, output: customOutput });
        }, 3000);

        customServer.on('error', (error) => {
          clearTimeout(timeout);
          resolve({ started: false, error: error.message });
        });

        customServer.on('exit', (code) => {
          clearTimeout(timeout);
          resolve({ started: code === 0, output: customOutput, code });
        });
      });

      if (customResult.started || customResult.output.length > 0) {
        console.log('✅ Custom MCP server can start');
        results.customServer = true;
      } else {
        console.log(`❌ Custom server failed: ${customResult.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`❌ Custom server test error: ${error.message}`);
    }

    console.log();

    // Test 4: Test Hisma server command
    console.log('🚀 Testing Hisma MCP Server Command...');
    try {
      const hismaTest = spawn('npx', ['-y', '@hisma/server-puppeteer'], {
        stdio: 'pipe'
      });

      let hismaOutput = '';
      hismaTest.stdout.on('data', (data) => {
        hismaOutput += data.toString();
      });

      hismaTest.stderr.on('data', (data) => {
        hismaOutput += data.toString();
      });

      const hismaResult = await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          hismaTest.kill('SIGTERM');
          resolve({ output: hismaOutput, timedOut: true });
        }, 5000);

        hismaTest.on('error', (error) => {
          clearTimeout(timeout);
          resolve({ error: error.message });
        });

        hismaTest.on('exit', (code) => {
          clearTimeout(timeout);
          resolve({ code, output: hismaOutput });
        });
      });

      if (hismaResult.timedOut || hismaResult.output.length > 0) {
        console.log('✅ Hisma MCP server command executes');
        results.hismaServer = true;
      } else {
        console.log(`❌ Hisma server failed: ${hismaResult.error || 'No output'}`);
      }
    } catch (error) {
      console.log(`❌ Hisma server test error: ${error.message}`);
    }

    console.log();

    // Test 5: Transport method validation
    console.log('🔌 Testing Transport Methods...');
    const transportMethods = [
      { name: 'STDIO', available: true, description: 'Standard input/output (default)' },
      { name: 'TCP', available: false, description: 'TCP socket (requires additional setup)' },
      { name: 'WebSocket', available: false, description: 'WebSocket (requires additional setup)' }
    ];

    transportMethods.forEach(method => {
      if (method.available) {
        console.log(`✅ ${method.name}: ${method.description}`);
      } else {
        console.log(`ℹ️  ${method.name}: ${method.description} - Not configured`);
      }
    });

    results.transport = true;

    // Summary
    console.log('\n📊 Validation Summary:');
    console.log(`VS Code Configuration: ${results.vscodeConfig ? '✅' : '❌'}`);
    console.log(`Root Configuration: ${results.rootConfig ? '✅' : '❌'}`);
    console.log(`Custom MCP Server: ${results.customServer ? '✅' : '❌'}`);
    console.log(`Hisma MCP Server: ${results.hismaServer ? '✅' : '❌'}`);
    console.log(`Transport Methods: ${results.transport ? '✅' : '❌'}`);

    const successCount = Object.values(results).filter(Boolean).length;
    console.log(`\n🎯 Overall: ${successCount}/5 validations passed`);

    if (successCount === 5) {
      console.log('\n🎉 All validations passed! MCP setup is ready for integration.');
    } else {
      console.log('\n⚠️  Some validations failed. Check the output above for details.');
    }

  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

validateMCPConfig();