# Puppeteer MCP Setup Guide

This guide explains how to set up and use the Puppeteer Model Context Protocol (MCP) server in your Interactive Learning Hub project.

## 🎯 Overview

The MCP Puppeteer integration provides browser automation capabilities that can be used with Claude and other AI assistants. This setup includes:

- **Hisma Puppeteer Server**: A pre-built MCP server for browser automation
- **Custom MCP Server**: A tailored server that integrates with existing Puppeteer utilities
- **Configuration Files**: Ready-to-use configurations for different environments

## 📦 Installation

The MCP dependencies are already installed:

```json
{
  "devDependencies": {
    "@hisma/server-puppeteer": "^0.6.5",
    "@modelcontextprotocol/sdk": "^1.16.0"
  }
}
```

## ⚙️ Configuration Files

### VS Code Configuration (`.vscode/mcp.json`)

```json
{
  "servers": {
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@hisma/server-puppeteer"],
      "env": {
        "PUPPETEER_LAUNCH_OPTIONS": "{\"headless\": true, \"args\": [\"--no-sandbox\", \"--disable-dev-shm-usage\", \"--disable-setuid-sandbox\"]}",
        "ALLOW_DANGEROUS": "true"
      }
    }
  }
}
```

### Claude Desktop Configuration (`mcp.json`)

```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@hisma/server-puppeteer"],
      "env": {
        "PUPPETEER_LAUNCH_OPTIONS": "{\"headless\": true, \"args\": [\"--no-sandbox\", \"--disable-dev-shm-usage\", \"--disable-setuid-sandbox\"]}",
        "ALLOW_DANGEROUS": "true"
      }
    }
  }
}
```

## 🚀 Usage

### Available NPM Scripts

```bash
# Start custom MCP server
npm run mcp:server

# Start Hisma MCP server
npm run mcp:test

# Launch MCP inspector for debugging
npm run mcp:inspect
```

### Available MCP Tools

The Puppeteer MCP server provides these tools:

1. **puppeteer_navigate**
   - Navigate to any URL
   - Configure browser launch options
   - Handle different page load strategies

2. **puppeteer_screenshot**
   - Capture full page or element screenshots
   - Return base64 encoded images
   - Configurable viewport dimensions

3. **puppeteer_click**
   - Click elements using CSS selectors
   - Enhanced element detection
   - Error handling for missing elements

4. **puppeteer_fill**
   - Fill input fields and forms
   - Clear existing content
   - Support for various input types

5. **puppeteer_evaluate**
   - Execute JavaScript in the browser
   - Return results to the AI assistant
   - Full access to page DOM and APIs

### MCP Resources

The server provides access to:

- **Console Logs** (`console://logs`): Browser console output
- **Screenshots** (`screenshot://<name>`): Captured screenshots

## 🔧 Enhanced Puppeteer Utilities

The project includes enhanced Puppeteer utilities with better error handling:

### Key Features

- **Enhanced Error Classification**: Categorizes errors for better debugging
- **Robust Element Detection**: Checks for element existence and visibility
- **Improved Navigation**: Better HTTP status and response handling
- **Form Interaction**: Enhanced input filling with clear-first option
- **Screenshot Management**: Organized screenshot capture and storage

### Usage Examples

```javascript
import { 
  createBrowser, 
  createPage, 
  navigateToUrl, 
  waitForElement, 
  clickElement, 
  fillInput 
} from './scripts/puppeteer-utils.js';

const browser = await createBrowser();
const page = await createPage(browser);

// Enhanced navigation with detailed error info
const result = await navigateToUrl(page, 'https://example.com');
if (!result.success) {
  console.log(`Navigation failed: ${result.category} - ${result.error}`);
}

// Enhanced element interaction
const clickResult = await clickElement(page, '#submit-button');
const fillResult = await fillInput(page, '#email-input', 'user@example.com');
```

## 🐛 Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure Docker/container has proper permissions
2. **Timeout Issues**: Adjust timeout values in configuration
3. **Element Not Found**: Use enhanced error messages to debug selectors
4. **Browser Launch Failures**: Check launch options and system requirements

### Debug Mode

Enable debug mode with environment variables:

```bash
export PUPPETEER_LAUNCH_OPTIONS='{"headless": false, "devtools": true}'
export ALLOW_DANGEROUS="true"
```

### Testing the Setup

Run the test script to verify everything is working:

```bash
node scripts/test-mcp-server.js
```

## 🔒 Security Considerations

> ⚠️ **CAUTION**: The MCP Puppeteer server can access local files and network resources. Only use with trusted code and in secure environments.

- The server runs with `ALLOW_DANGEROUS: true` for container compatibility
- Browser launch options include security-reducing flags for headless operation
- Restrict network access in production environments
- Validate all user inputs before passing to Puppeteer functions

## 📚 Additional Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Puppeteer Documentation](https://pptr.dev/)
- [Hisma Server Repository](https://github.com/Hisma/servers-archived)

## 🤝 Integration with Claude Code

### Quick Start with Claude Code

The Puppeteer MCP is now fully integrated with Claude Code! Here's how to use it:

#### 1. MCP Servers are Pre-configured

```bash
# List all configured MCP servers
claude mcp list

# You should see:
# puppeteer-hisma: npx @hisma/server-puppeteer
# puppeteer-custom: node scripts/mcp-puppeteer-server.js (project scope)
```

#### 2. Available MCP Tools

Ask Claude to use these browser automation tools:

- **puppeteer_navigate**: Navigate to any URL
- **puppeteer_screenshot**: Capture page screenshots
- **puppeteer_click**: Click elements using CSS selectors
- **puppeteer_fill**: Fill form inputs
- **puppeteer_evaluate**: Execute JavaScript in browser
- **puppeteer_hover**: Hover over elements
- **puppeteer_select**: Select dropdown options

#### 3. Example Claude Queries

Try these commands with Claude Code:

```bash
# Basic navigation and screenshot
claude "Navigate to https://example.com and take a screenshot"

# Form interaction
claude "Go to Google, search for 'MCP', and screenshot the results"

# Element interaction
claude "Click the login button on the current page"

# JavaScript execution  
claude "Execute JavaScript to get all link texts on the page"

# Complex workflow
claude "Navigate to GitHub, search for 'puppeteer', click first result, and screenshot the repo"
```

#### 4. Development Workflow

Use the integrated workflow commands:

```bash
# Run all MCP tests
npm run mcp:workflow test

# Start MCP server for debugging
npm run mcp:workflow start-hisma

# Validate configuration
npm run mcp:validate

# Run demonstration
npm run mcp:demo
```

#### 5. Debug Mode

For troubleshooting, use debug mode:

```bash
# Debug Hisma server (opens browser window)
npm run mcp:workflow debug-hisma

# Debug custom server with Node inspector
npm run mcp:workflow debug-custom
```

### Resources Available to Claude

Claude has access to these MCP resources:

- **Console Logs** (`console://logs`): All browser console output
- **Screenshots** (`screenshot://<name>`): Captured screenshots by name

### Integration Status

✅ **Fully Integrated**: MCP servers are configured and tested  
✅ **Claude Code Ready**: Can use all Puppeteer tools through Claude  
✅ **Development Workflow**: Scripts available for testing and debugging  
✅ **Documentation**: Complete setup and usage guide  

### Troubleshooting Claude Integration

If Claude can't access MCP tools:

1. **Check server configuration**: `claude mcp list`
2. **Validate setup**: `npm run mcp:validate`
3. **Test integration**: `npm run mcp:workflow claude-test`
4. **Restart Claude Code**: Sometimes needed after configuration changes

### Performance Tips

- Use headless mode for production (default configuration)
- Enable debug mode only for development
- Screenshots are stored in memory and available as resources
- Console logs accumulate during browser session

The setup is now complete and fully integrated with Claude Code! 🎉

### Next Steps

1. Try the example queries above
2. Explore the workflow commands: `npm run mcp:workflow help`
3. Check out the test scripts for inspiration
4. Read the troubleshooting section if you encounter issues