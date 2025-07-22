# Authentication Testing and Bypass System

This document explains the comprehensive authentication testing system that allows you to bypass login for testing purposes and provides automated authentication for Puppeteer/MCP testing.

## 🎯 Overview

The authentication testing system provides three main solutions:

1. **Development Authentication Bypass** - Skip login entirely during development
2. **Test User Credentials** - Pre-configured test accounts for automated testing  
3. **MCP Authentication Tools** - Integrated authentication commands for Claude/Puppeteer

## 🚧 Development Authentication Bypass

### Quick Enable for Testing

To bypass authentication entirely for testing:

1. **Environment Variable Method**:
   ```bash
   # In .env.local
   VITE_DEV_AUTH_BYPASS=true
   VITE_DEV_USER_EMAIL=dev@localhost
   VITE_DEV_USER_NAME=Development User
   ```

2. **Restart your development server**:
   ```bash
   npm run dev
   ```

3. **Verify bypass is active**:
   - You should see a warning in console: "🚧 Development authentication bypass is ENABLED"
   - The app should load directly without showing login modal
   - You'll be logged in as the configured development user

### How It Works

The bypass system works by:
- Creating a mock Firebase User object when bypass is enabled
- Intercepting the AuthContext to use the mock user instead of real authentication
- Only activating in development mode (`import.meta.env.DEV === true`)
- Automatically creating test projects and data for the mock user

### Security Notes

- ⚠️ **Development only**: Only works in development mode
- ⚠️ **Not for production**: Automatically disabled in production builds
- ⚠️ **No real data**: Uses mock user data, no access to real Firebase data

## 👤 Test User Credentials

### Pre-configured Test Users

The system includes pre-configured test accounts:

```javascript
// Default test user
EMAIL: test@localhost.dev  
PASSWORD: TestPassword123!
NAME: Test User

// Admin test user  
EMAIL: admin@localhost.dev
PASSWORD: AdminPassword123!
NAME: Test Admin
```

### Environment Configuration

Configure test credentials in `.env.local`:

```bash
# Test User Credentials for Puppeteer Testing
TEST_USER_EMAIL=test@localhost.dev
TEST_USER_PASSWORD=TestPassword123!
TEST_USER_DISPLAY_NAME=Test User

TEST_ADMIN_EMAIL=admin@localhost.dev  
TEST_ADMIN_PASSWORD=AdminPassword123!
TEST_ADMIN_DISPLAY_NAME=Test Admin
```

### Using Test Credentials

```javascript
import { getTestCredentials, getAdminCredentials } from './src/lib/testAuthUtils.js';

// Get default test user
const testUser = getTestCredentials();
console.log(testUser.email); // test@localhost.dev

// Get admin test user  
const adminUser = getAdminCredentials();
console.log(adminUser.email); // admin@localhost.dev
```

## 🤖 MCP Authentication Tools

### Available MCP Commands

With the updated MCP integration, you can now use these authentication commands with Claude:

#### 1. Login Command
```bash
# Login with default test credentials
claude "Use puppeteer_login to authenticate with the app"

# Login with specific credentials  
claude "Use puppeteer_login with email test@localhost.dev and password TestPassword123!"

# Login using development bypass
claude "Use puppeteer_login with bypass method to skip authentication"
```

#### 2. Authentication Status
```bash
# Check if currently authenticated
claude "Use puppeteer_auth_status to check if I'm logged in"
```

#### 3. Logout
```bash  
# Logout current user
claude "Use puppeteer_logout to sign out"
```

### Automated Testing Workflows

#### Example 1: Complete Testing Workflow
```bash
claude "Navigate to localhost:3000, login with test credentials, screenshot the dashboard, test creating a new project, and screenshot the result"
```

#### Example 2: Authentication Flow Testing  
```bash
claude "Test the complete authentication flow: navigate to app, check auth status, login, verify successful authentication, then logout and confirm logout"
```

#### Example 3: Bypass Testing
```bash
claude "Navigate to localhost:3000, use bypass authentication, screenshot the authenticated state, and test the main app features"
```

## 🛠️ Development Scripts

### NPM Scripts Available

```bash
# Test authentication system
npm run auth:test

# Run authentication demo
npm run auth:demo  

# Test authentication (alias)
npm run test:auth
```

### Puppeteer Authentication Helper

Use the authentication helper directly in scripts:

```javascript
import { createAuthenticatedSession } from './scripts/puppeteer-auth-helper.js';

// Create authenticated session with default test user
const { browser, page, authHelper } = await createAuthenticatedSession();

// Create session with specific credentials
const { browser, page, authHelper } = await createAuthenticatedSession({
  credentials: { 
    email: 'custom@test.com', 
    password: 'CustomPass123!' 
  }
});

// Create session with bypass authentication
const { browser, page, authHelper } = await createAuthenticatedSession({
  method: 'bypass'
});
```

## 🔧 Configuration Options

### Environment Variables

```bash
# Firebase Configuration (for real authentication)
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
# ... other Firebase config

# Firebase Emulator (for local development)
VITE_USE_FIREBASE_EMULATOR=true

# Development Bypass
VITE_DEV_AUTH_BYPASS=false
VITE_DEV_USER_ID=dev-test-user-123
VITE_DEV_USER_EMAIL=dev@localhost
VITE_DEV_USER_NAME=Development User

# Test Credentials
TEST_USER_EMAIL=test@localhost.dev
TEST_USER_PASSWORD=TestPassword123!
TEST_USER_DISPLAY_NAME=Test User

# Puppeteer Configuration
PUPPETEER_TEST_URL=http://localhost:3000
PUPPETEER_HEADLESS=true
PUPPETEER_TIMEOUT=30000
```

### Authentication Methods

The system supports three authentication methods:

1. **`email`** - Email/password authentication using test credentials
2. **`google`** - Google OAuth (requires additional popup handling in tests)  
3. **`bypass`** - Development bypass (no real authentication)

## 🚀 Getting Started

### Option 1: Quick Development Bypass

For fastest testing setup:

1. Enable bypass in `.env.local`:
   ```bash
   VITE_DEV_AUTH_BYPASS=true
   ```

2. Restart dev server:
   ```bash
   npm run dev
   ```

3. App loads directly authenticated as development user

### Option 2: Test User Authentication

For more realistic testing:

1. Configure test credentials in `.env.local`:
   ```bash
   TEST_USER_EMAIL=test@localhost.dev
   TEST_USER_PASSWORD=TestPassword123!
   ```

2. Use MCP login commands:
   ```bash
   claude "Navigate to localhost:3000 and login with test credentials"
   ```

### Option 3: Real Firebase Authentication

For full authentication testing:

1. Set up Firebase project and credentials
2. Configure Firebase environment variables
3. Use email/password or Google OAuth authentication
4. Test with real user accounts

## 📋 Testing Scenarios

### Scenario 1: New User Testing
```bash
# Test complete new user flow
claude "Navigate to app, check if login required, create new account, verify email workflow, login, and test initial setup"
```

### Scenario 2: Existing User Testing  
```bash
# Test existing user workflow
claude "Login with test@localhost.dev, navigate to dashboard, test existing projects, create new project, and test all main features"
```

### Scenario 3: Authentication Edge Cases
```bash
# Test authentication error handling
claude "Test login with wrong password, test login with non-existent user, test password reset flow, test session timeout"
```

### Scenario 4: Mobile Authentication
```bash
# Test mobile authentication flow
claude "Set viewport to mobile, navigate to app, test touch login interactions, verify mobile authentication UI"
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Bypass Not Working
- **Check**: `VITE_DEV_AUTH_BYPASS=true` in `.env.local`
- **Check**: Development server restarted after adding environment variable
- **Check**: Browser console for bypass activation warning

#### 2. Test Credentials Not Working
- **Check**: Test user exists in Firebase (or using emulator)
- **Check**: Correct email/password in environment variables  
- **Check**: Firebase authentication enabled for email/password

#### 3. MCP Authentication Commands Not Available
- **Check**: MCP server is running with authentication tools
- **Check**: Custom MCP server (not just Hisma) is being used
- **Check**: Claude MCP integration is properly configured

#### 4. Puppeteer Authentication Helper Failing
- **Check**: Page is fully loaded before attempting authentication
- **Check**: Authentication modal selectors match current UI
- **Check**: Network connectivity for authentication requests

### Debug Mode

Enable debug logging:

```bash
# Enable verbose logging
export DEBUG=*
npm run auth:demo

# Run with browser visible (not headless)
export PUPPETEER_HEADLESS=false
npm run auth:test
```

## 🔒 Security Considerations

### Development Safety

- ✅ **Development Only**: Bypass only works in development mode
- ✅ **No Production Access**: Automatically disabled in production builds
- ✅ **No Real Credentials**: Uses mock data, no access to real user information
- ✅ **Safe Test Credentials**: Test passwords are clearly marked as test-only

### Best Practices

1. **Never commit real credentials** to the repository
2. **Use test credentials only** for automated testing
3. **Disable bypass** before production deployments
4. **Regularly rotate test passwords** if using real Firebase accounts
5. **Use Firebase emulator** for local development when possible

## 📚 Additional Resources

### Related Files

- `src/lib/testAuthUtils.ts` - Test authentication utilities and bypass logic
- `scripts/puppeteer-auth-helper.js` - Puppeteer authentication automation
- `src/lib/authContext.tsx` - Main authentication context with bypass integration
- `scripts/mcp-puppeteer-server.js` - MCP server with authentication tools
- `.env.example` - Example environment configuration
- `.env.local` - Local environment variables (not committed)

### Documentation

- `MCP_PUPPETEER_SETUP.md` - MCP setup and configuration
- `MCP_USE_CASES.md` - Common MCP usage patterns
- `CLAUDE.md` - Project overview and architecture

The authentication testing system is now fully integrated and ready for use! You can ask Claude to perform any testing tasks and it will automatically handle authentication as needed.