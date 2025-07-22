#!/usr/bin/env node

/**
 * Custom MCP Puppeteer Server
 * Integrates existing Puppeteer utilities with MCP protocol
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { createAuthenticatedSession, PuppeteerAuthHelper } from './puppeteer-auth-helper.js';

class CustomPuppeteerServer {
  constructor() {
    this.server = new Server(
      {
        name: 'custom-puppeteer',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.browser = null;
    this.page = null;
    this.screenshots = new Map();
    this.consoleLogs = [];
    this.authHelper = null;

    this.setupToolHandlers();
    this.setupResourceHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'puppeteer_navigate',
            description: 'Navigate to a URL',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'URL to navigate to',
                },
                launchOptions: {
                  type: 'object',
                  description: 'Puppeteer launch options',
                },
                allowDangerous: {
                  type: 'boolean',
                  description: 'Allow dangerous launch options',
                  default: false,
                },
              },
              required: ['url'],
            },
          },
          {
            name: 'puppeteer_screenshot',
            description: 'Take a screenshot',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Screenshot name',
                },
                selector: {
                  type: 'string',
                  description: 'CSS selector to screenshot',
                },
                width: {
                  type: 'number',
                  description: 'Screenshot width',
                  default: 800,
                },
                height: {
                  type: 'number',
                  description: 'Screenshot height',
                  default: 600,
                },
                encoded: {
                  type: 'boolean',
                  description: 'Return base64 encoded image',
                  default: false,
                },
              },
              required: ['name'],
            },
          },
          {
            name: 'puppeteer_click',
            description: 'Click an element',
            inputSchema: {
              type: 'object',
              properties: {
                selector: {
                  type: 'string',
                  description: 'CSS selector to click',
                },
              },
              required: ['selector'],
            },
          },
          {
            name: 'puppeteer_fill',
            description: 'Fill an input field',
            inputSchema: {
              type: 'object',
              properties: {
                selector: {
                  type: 'string',
                  description: 'CSS selector of input field',
                },
                value: {
                  type: 'string',
                  description: 'Value to fill',
                },
              },
              required: ['selector', 'value'],
            },
          },
          {
            name: 'puppeteer_evaluate',
            description: 'Execute JavaScript in the page',
            inputSchema: {
              type: 'object',
              properties: {
                script: {
                  type: 'string',
                  description: 'JavaScript code to execute',
                },
              },
              required: ['script'],
            },
          },
          {
            name: 'puppeteer_login',
            description: 'Authenticate with the application',
            inputSchema: {
              type: 'object',
              properties: {
                method: {
                  type: 'string',
                  enum: ['email', 'google', 'bypass'],
                  description: 'Authentication method to use',
                  default: 'email',
                },
                email: {
                  type: 'string',
                  description: 'Email for email/password authentication',
                },
                password: {
                  type: 'string',
                  description: 'Password for email/password authentication',
                },
              },
            },
          },
          {
            name: 'puppeteer_logout',
            description: 'Log out the current user',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'puppeteer_auth_status',
            description: 'Check current authentication status',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'puppeteer_navigate':
            return await this.handleNavigate(request.params.arguments);
          case 'puppeteer_screenshot':
            return await this.handleScreenshot(request.params.arguments);
          case 'puppeteer_click':
            return await this.handleClick(request.params.arguments);
          case 'puppeteer_fill':
            return await this.handleFill(request.params.arguments);
          case 'puppeteer_evaluate':
            return await this.handleEvaluate(request.params.arguments);
          case 'puppeteer_login':
            return await this.handleLogin(request.params.arguments);
          case 'puppeteer_logout':
            return await this.handleLogout(request.params.arguments);
          case 'puppeteer_auth_status':
            return await this.handleAuthStatus(request.params.arguments);
          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  setupResourceHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources = [
        {
          uri: 'console://logs',
          mimeType: 'text/plain',
          name: 'Console Logs',
          description: 'Browser console output',
        },
      ];

      // Add screenshot resources
      for (const [name] of this.screenshots) {
        resources.push({
          uri: `screenshot://${name}`,
          mimeType: 'image/png',
          name: `Screenshot: ${name}`,
          description: `Screenshot captured with name: ${name}`,
        });
      }

      return { resources };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const url = new URL(request.params.uri);

      if (url.protocol === 'console:') {
        return {
          contents: [
            {
              uri: request.params.uri,
              mimeType: 'text/plain',
              text: this.consoleLogs.join('\n'),
            },
          ],
        };
      }

      if (url.protocol === 'screenshot:') {
        const name = url.hostname;
        const screenshot = this.screenshots.get(name);
        if (!screenshot) {
          throw new Error(`Screenshot not found: ${name}`);
        }

        return {
          contents: [
            {
              uri: request.params.uri,
              mimeType: 'image/png',
              blob: screenshot,
            },
          ],
        };
      }

      throw new Error(`Unsupported resource: ${request.params.uri}`);
    });
  }

  async ensureBrowser(launchOptions = {}) {
    if (!this.browser) {
      const defaultOptions = {
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-setuid-sandbox'],
      };

      this.browser = await puppeteer.launch({
        ...defaultOptions,
        ...launchOptions,
      });
    }
    return this.browser;
  }

  async ensurePage() {
    const browser = await this.ensureBrowser();
    if (!this.page) {
      this.page = await browser.newPage();
      
      // Set up console logging
      this.page.on('console', (msg) => {
        const timestamp = new Date().toISOString();
        this.consoleLogs.push(`[${timestamp}] ${msg.type()}: ${msg.text()}`);
      });

      // Initialize auth helper
      this.authHelper = new PuppeteerAuthHelper(this.page);
    }
    return this.page;
  }

  async handleNavigate(args) {
    const { url, launchOptions, allowDangerous } = args;
    
    if (launchOptions) {
      await this.closeBrowser();
      await this.ensureBrowser(launchOptions);
    }

    const page = await this.ensurePage();
    await page.goto(url, { waitUntil: 'networkidle0' });

    return {
      content: [
        {
          type: 'text',
          text: `Navigated to: ${url}`,
        },
      ],
    };
  }

  async handleScreenshot(args) {
    const { name, selector, width = 800, height = 600, encoded = false } = args;
    
    const page = await this.ensurePage();
    await page.setViewport({ width, height });

    let screenshot;
    if (selector) {
      const element = await page.$(selector);
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }
      screenshot = await element.screenshot();
    } else {
      screenshot = await page.screenshot({ fullPage: true });
    }

    this.screenshots.set(name, screenshot);

    if (encoded) {
      const base64 = screenshot.toString('base64');
      return {
        content: [
          {
            type: 'text',
            text: `data:image/png;base64,${base64}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Screenshot captured: ${name}`,
        },
      ],
    };
  }

  async handleClick(args) {
    const { selector } = args;
    const page = await this.ensurePage();

    await page.waitForSelector(selector, { timeout: 10000 });
    await page.click(selector);

    return {
      content: [
        {
          type: 'text',
          text: `Clicked: ${selector}`,
        },
      ],
    };
  }

  async handleFill(args) {
    const { selector, value } = args;
    const page = await this.ensurePage();

    await page.waitForSelector(selector, { timeout: 10000 });
    await page.focus(selector);
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await page.type(selector, value);

    return {
      content: [
        {
          type: 'text',
          text: `Filled "${selector}" with: ${value}`,
        },
      ],
    };
  }

  async handleEvaluate(args) {
    const { script } = args;
    const page = await this.ensurePage();

    const result = await page.evaluate(script);

    return {
      content: [
        {
          type: 'text',
          text: `Result: ${JSON.stringify(result, null, 2)}`,
        },
      ],
    };
  }

  async handleLogin(args) {
    const { method = 'email', email, password } = args;
    
    const page = await this.ensurePage();

    // Use default test credentials if not provided
    const credentials = {
      email: email || process.env.TEST_USER_EMAIL || 'test@localhost.dev',
      password: password || process.env.TEST_USER_PASSWORD || 'TestPassword123!',
      displayName: process.env.TEST_USER_DISPLAY_NAME || 'Test User'
    };

    try {
      let success = false;
      
      switch (method) {
        case 'email':
          success = await this.authHelper.loginWithEmailPassword(credentials);
          break;
        case 'google':
          success = await this.authHelper.loginWithGoogle();
          break;
        case 'bypass':
          success = await this.authHelper.enableDevBypass();
          break;
        default:
          throw new Error(`Unknown authentication method: ${method}`);
      }

      if (success) {
        return {
          content: [
            {
              type: 'text',
              text: `Successfully authenticated using ${method} method. User: ${credentials.email}`,
            },
          ],
        };
      } else {
        throw new Error(`Authentication failed using ${method} method`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Authentication error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async handleLogout(args) {
    try {
      if (!this.authHelper) {
        throw new Error('No authentication helper available');
      }

      const success = await this.authHelper.logout();
      
      if (success) {
        return {
          content: [
            {
              type: 'text',
              text: 'Successfully logged out',
            },
          ],
        };
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Logout error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async handleAuthStatus(args) {
    try {
      if (!this.authHelper) {
        await this.ensurePage(); // This will create the auth helper
      }

      const isAuthenticated = await this.authHelper.checkAuthStatus();
      const currentUser = this.authHelper.getCurrentUser();

      return {
        content: [
          {
            type: 'text',
            text: `Authentication Status: ${isAuthenticated ? 'Authenticated' : 'Not Authenticated'}${
              currentUser ? `\nCurrent User: ${currentUser.email || currentUser.displayName}` : ''
            }`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Auth status check error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.authHelper = null;
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    process.on('SIGINT', async () => {
      await this.closeBrowser();
      process.exit(0);
    });
  }
}

const server = new CustomPuppeteerServer();
server.start().catch(console.error);