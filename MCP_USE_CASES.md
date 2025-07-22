# Puppeteer MCP Use Cases and Examples

This document provides common use cases and practical examples for using the Puppeteer MCP with Claude Code.

## 🎯 Common Use Cases

### 1. Website Testing and QA

**Use Case**: Automated testing of web applications

**Claude Commands**:
```bash
# Test login flow
claude "Navigate to http://localhost:3000, fill the email field with test@example.com, fill password with testpass, click login button, and screenshot the result"

# Test responsive design
claude "Navigate to our app, set viewport to mobile size, take screenshot, then set to desktop and screenshot again"

# Check for broken links
claude "Navigate to our homepage and execute JavaScript to find all broken links"
```

**Benefits**:
- Quick visual verification of UI changes
- Automated regression testing
- Cross-browser compatibility checks

### 2. Competitive Analysis

**Use Case**: Analyze competitor websites and features

**Claude Commands**:
```bash
# Screenshot competitor homepage
claude "Navigate to competitor.com, take full page screenshot named 'competitor-homepage'"

# Analyze pricing page
claude "Go to competitor.com/pricing, screenshot the pricing table, and execute JavaScript to extract all price points"

# Check mobile responsiveness
claude "Navigate to competitor.com, set viewport to iPhone size, screenshot mobile version"
```

**Benefits**:
- Visual comparison of competitor features
- Price monitoring
- UI/UX inspiration gathering

### 3. Web Scraping and Data Collection

**Use Case**: Extract data from websites for analysis

**Claude Commands**:
```bash
# Extract product information
claude "Navigate to product page, execute JavaScript to get all product titles and prices, return as JSON"

# Collect contact information
claude "Go to company directory, execute JavaScript to extract all email addresses on the page"

# Monitor content changes
claude "Navigate to news site, screenshot the headlines section, execute JavaScript to get article titles"
```

**Benefits**:
- Automated data collection
- Content monitoring
- Market research automation

### 4. Development and Debugging

**Use Case**: Debug web applications and test features

**Claude Commands**:
```bash
# Debug JavaScript errors
claude "Navigate to localhost:3000, take screenshot, then check console logs for any errors"

# Test form validation
claude "Go to our signup form, try submitting with empty fields, screenshot error messages"

# Performance testing
claude "Navigate to our app, execute JavaScript to measure page load time and report performance metrics"
```

**Benefits**:
- Quick debugging workflows
- Visual verification of fixes
- Performance monitoring

### 5. Content Management

**Use Case**: Manage and verify content updates

**Claude Commands**:
```bash
# Verify content updates
claude "Navigate to our blog, screenshot the latest posts section, check if new article is visible"

# Check SEO elements
claude "Go to our homepage, execute JavaScript to get all meta tags, title, and heading structure"

# Validate forms
claude "Test our contact form by filling all fields with test data and submitting"
```

**Benefits**:
- Content verification workflows
- SEO auditing
- Form testing automation

## 🛠️ Practical Examples

### Example 1: E-commerce Product Testing

```bash
# Complete e-commerce workflow test
claude "Navigate to our shop, search for 'laptop', click first product, add to cart, proceed to checkout, and screenshot each step"
```

This will:
1. Navigate to the e-commerce site
2. Perform a product search
3. Select and view product details
4. Add item to shopping cart
5. Navigate through checkout process
6. Capture screenshots at each step

### Example 2: Social Media Monitoring

```bash
# Monitor social media mentions
claude "Navigate to Twitter search for our brand name, screenshot the results, execute JavaScript to count mentions"
```

This will:
1. Go to Twitter search
2. Search for brand mentions
3. Capture visual evidence
4. Extract quantitative data

### Example 3: Documentation Verification

```bash
# Verify documentation links work
claude "Navigate to our docs site, execute JavaScript to find all external links, test each one, and report which are broken"
```

This will:
1. Load documentation site
2. Find all external links
3. Test link validity
4. Provide broken link report

### Example 4: Interactive Learning Module Testing

**For your specific project**:

```bash
# Test hotspot functionality
claude "Navigate to localhost:3000, wait for interactive module to load, click on a hotspot, screenshot the result"

# Test mobile responsiveness
claude "Go to our app, set viewport to mobile, test touch interactions on hotspots, screenshot mobile view"

# Test timeline events
claude "Navigate to our training module, execute JavaScript to trigger timeline events, screenshot each event"
```

## 🎨 Creative Workflows

### Automated Screenshot Gallery

```bash
# Create design comparison gallery
claude "Navigate to our app, take screenshots at different viewport sizes (mobile, tablet, desktop), save each with descriptive names"
```

### Content Audit Workflow

```bash
# Comprehensive content audit
claude "Navigate through all main pages of our site, screenshot each, execute JavaScript to extract all text content, and identify missing alt tags"
```

### Performance Monitoring

```bash
# Monitor site performance
claude "Navigate to our homepage, execute JavaScript to get Core Web Vitals, screenshot the page, and report performance scores"
```

## 🔧 Advanced Techniques

### Custom JavaScript Execution

You can execute complex JavaScript for advanced interactions:

```javascript
// Example: Extract all form data
claude "Execute JavaScript: Array.from(document.forms).map(form => ({ name: form.name, fields: Array.from(form.elements).map(el => el.name) }))"
```

### Chaining Multiple Actions

Combine multiple MCP tools in one request:

```bash
claude "Navigate to login page, fill credentials, submit form, wait for dashboard, take screenshot, then navigate to profile page and screenshot that too"
```

### Resource Management

Access screenshots and console logs as resources:

```bash
# After taking screenshots, ask Claude:
"Show me the screenshot named 'homepage' and summarize what's visible"
"What errors appear in the console logs?"
```

## 🚀 Integration with Development Workflow

### Pre-commit Testing

```bash
# Add to your CI/CD pipeline
npm run mcp:workflow test
claude "Navigate to localhost:3000, test main user journeys, report any visual or functional issues"
```

### Bug Report Generation

```bash
# Generate comprehensive bug reports
claude "Navigate to the bug page, screenshot the issue, check console for errors, execute JavaScript to get browser info, compile a detailed bug report"
```

### Feature Verification

```bash
# Verify new features work correctly
claude "Navigate to the new feature page, test all interactive elements, screenshot successful interactions, verify expected behavior"
```

## 💡 Pro Tips

1. **Use Descriptive Screenshot Names**: This makes it easier to reference specific screenshots later
2. **Combine Visual and Data Extraction**: Take screenshots AND extract data for comprehensive analysis
3. **Test Mobile First**: Always test mobile responsiveness for modern web apps
4. **Chain Actions Efficiently**: Combine multiple steps in one Claude request for faster workflows
5. **Leverage Console Logs**: Use browser console output to debug JavaScript issues
6. **Use Viewport Control**: Test different screen sizes by setting viewport dimensions

## 🔍 Debugging Common Issues

### MCP Tool Not Available

```bash
# Check if MCP servers are running
claude mcp list
npm run mcp:validate
```

### Browser Launch Issues

```bash
# Use debug mode to see browser window
npm run mcp:workflow debug-hisma
```

### Element Not Found

```bash
# Use JavaScript to explore page structure
claude "Execute JavaScript to list all clickable elements on the page"
```

### Screenshot Issues

```bash
# Check if screenshot was captured
claude "List all available screenshot resources"
```

This comprehensive guide should help you make the most of the Puppeteer MCP integration for testing, debugging, and automating web interactions with Claude Code!