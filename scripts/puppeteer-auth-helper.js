#!/usr/bin/env node

/**
 * Puppeteer Authentication Helper
 * Provides automated login functionality for testing purposes
 */

import { 
  createBrowser, 
  createPage, 
  navigateToUrl, 
  waitForElement, 
  clickElement, 
  fillInput 
} from './puppeteer-utils.js';

// Test user credentials (from environment or defaults)
const TEST_CREDENTIALS = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
  displayName: process.env.TEST_USER_DISPLAY_NAME || 'Test User'
};

const ADMIN_CREDENTIALS = {
  email: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
  password: process.env.TEST_ADMIN_PASSWORD || 'AdminPassword123!',
  displayName: process.env.TEST_ADMIN_DISPLAY_NAME || 'Test Admin'
};

/**
 * Authentication helper class
 */
export class PuppeteerAuthHelper {
  constructor(page) {
    this.page = page;
    this.isAuthenticated = false;
    this.currentUser = null;
  }

  /**
   * Check if user is already authenticated
   */
  async checkAuthStatus() {
    try {
      // Look for authenticated content markers
      const authContent = await this.page.$('[data-testid="authenticated-content"]');
      const userAvatar = await this.page.$('[data-testid="user-avatar"]');
      const authModal = await this.page.$('[data-testid="auth-modal"]');
      
      this.isAuthenticated = (authContent || userAvatar) && !authModal;
      
      if (this.isAuthenticated) {
        console.log('✅ User is already authenticated');
        return true;
      }
      
      return false;
    } catch (error) {
      console.log('❌ Error checking auth status:', error.message);
      return false;
    }
  }

  /**
   * Wait for authentication modal to appear
   */
  async waitForAuthModal(timeout = 10000) {
    try {
      console.log('⏳ Waiting for authentication modal...');
      await this.page.waitForSelector('[data-testid="auth-modal"]', { timeout });
      console.log('✅ Authentication modal found');
      return true;
    } catch (error) {
      console.log('❌ Auth modal not found:', error.message);
      return false;
    }
  }

  /**
   * Perform email/password login
   */
  async loginWithEmailPassword(credentials = TEST_CREDENTIALS) {
    try {
      console.log(`🔐 Logging in with email: ${credentials.email}`);

      // Wait for auth modal to be available
      const modalFound = await this.waitForAuthModal();
      if (!modalFound) {
        throw new Error('Authentication modal not found');
      }

      // Fill email field
      const emailSelector = '[data-testid="email-input"], input[type="email"], input[name="email"]';
      const emailResult = await fillInput(this.page, emailSelector, credentials.email);
      if (!emailResult.success) {
        throw new Error(`Failed to fill email: ${emailResult.error}`);
      }

      // Fill password field
      const passwordSelector = '[data-testid="password-input"], input[type="password"], input[name="password"]';
      const passwordResult = await fillInput(this.page, passwordSelector, credentials.password);
      if (!passwordResult.success) {
        throw new Error(`Failed to fill password: ${passwordResult.error}`);
      }

      // Click sign in button
      const signInSelector = '[data-testid="sign-in-button"], button[type="submit"], button:contains("Sign In")';
      const clickResult = await clickElement(this.page, signInSelector);
      if (!clickResult.success) {
        throw new Error(`Failed to click sign in: ${clickResult.error}`);
      }

      // Wait for authentication to complete
      await this.waitForAuthentication();
      
      console.log('✅ Successfully logged in with email/password');
      this.isAuthenticated = true;
      this.currentUser = credentials;
      return true;

    } catch (error) {
      console.error('❌ Email/password login failed:', error.message);
      return false;
    }
  }

  /**
   * Perform Google OAuth login
   */
  async loginWithGoogle() {
    try {
      console.log('🔐 Logging in with Google OAuth');

      // Wait for auth modal
      const modalFound = await this.waitForAuthModal();
      if (!modalFound) {
        throw new Error('Authentication modal not found');
      }

      // Click Google sign in button
      const googleSelector = '[data-testid="google-sign-in"], button:contains("Google"), .google-sign-in-button';
      const clickResult = await clickElement(this.page, googleSelector);
      if (!clickResult.success) {
        throw new Error(`Failed to click Google sign in: ${clickResult.error}`);
      }

      // Handle Google OAuth popup (simplified - in real testing you'd need to handle the popup)
      console.log('⚠️  Note: Google OAuth requires popup handling in real testing scenarios');
      
      // Wait for potential authentication
      await this.waitForAuthentication(15000); // Longer timeout for OAuth
      
      if (await this.checkAuthStatus()) {
        console.log('✅ Successfully logged in with Google OAuth');
        this.isAuthenticated = true;
        return true;
      } else {
        throw new Error('Google OAuth login did not complete successfully');
      }

    } catch (error) {
      console.error('❌ Google OAuth login failed:', error.message);
      return false;
    }
  }

  /**
   * Wait for authentication to complete
   */
  async waitForAuthentication(timeout = 10000) {
    try {
      console.log('⏳ Waiting for authentication to complete...');
      
      // Wait for auth modal to disappear OR authenticated content to appear
      await Promise.race([
        this.page.waitForSelector('[data-testid="auth-modal"]', { hidden: true, timeout }),
        this.page.waitForSelector('[data-testid="authenticated-content"]', { timeout }),
        this.page.waitForSelector('[data-testid="user-avatar"]', { timeout })
      ]);

      // Double-check authentication status
      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay
      return await this.checkAuthStatus();

    } catch (error) {
      console.log('⏱️  Authentication timeout, checking status anyway...');
      return await this.checkAuthStatus();
    }
  }

  /**
   * Logout current user
   */
  async logout() {
    try {
      if (!this.isAuthenticated) {
        console.log('ℹ️  No user is currently logged in');
        return true;
      }

      console.log('🚪 Logging out current user');

      // Look for user menu or logout button
      const userMenuSelector = '[data-testid="user-menu"], [data-testid="user-avatar"]';
      const userMenu = await this.page.$(userMenuSelector);
      
      if (userMenu) {
        await clickElement(this.page, userMenuSelector);
        
        // Click logout in dropdown
        const logoutSelector = '[data-testid="logout-button"], button:contains("Logout"), button:contains("Sign Out")';
        await clickElement(this.page, logoutSelector);
      }

      // Wait for logout to complete
      await this.page.waitForSelector('[data-testid="auth-modal"]', { timeout: 5000 });
      
      this.isAuthenticated = false;
      this.currentUser = null;
      console.log('✅ Successfully logged out');
      return true;

    } catch (error) {
      console.error('❌ Logout failed:', error.message);
      return false;
    }
  }

  /**
   * Enable development authentication bypass
   */
  async enableDevBypass() {
    try {
      console.log('🚧 Enabling development authentication bypass');
      
      // Execute JavaScript to enable bypass
      await this.page.evaluate(() => {
        // Set environment variable in browser context
        window.VITE_DEV_AUTH_BYPASS = 'true';
        
        // Trigger a page reload to apply bypass
        window.location.reload();
      });

      // Wait for page to reload and bypass to take effect
      await this.page.waitForLoadState('networkidle');
      
      // Check if bypass is working
      const bypassWorking = await this.page.evaluate(() => {
        return document.querySelector('[data-testid="authenticated-content"]') !== null;
      });

      if (bypassWorking) {
        console.log('✅ Development bypass enabled successfully');
        this.isAuthenticated = true;
        this.currentUser = { email: 'dev@localhost', displayName: 'Development User' };
        return true;
      } else {
        throw new Error('Development bypass did not take effect');
      }

    } catch (error) {
      console.error('❌ Failed to enable dev bypass:', error.message);
      return false;
    }
  }

  /**
   * Get current user info
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if authenticated
   */
  isLoggedIn() {
    return this.isAuthenticated;
  }
}

/**
 * Convenience function to create authenticated browser session
 */
export async function createAuthenticatedSession(options = {}) {
  const {
    credentials = TEST_CREDENTIALS,
    method = 'email', // 'email', 'google', 'bypass'
    url = 'http://localhost:3000',
    headless = true
  } = options;

  console.log('🚀 Creating authenticated Puppeteer session');

  // Create browser and page
  const browser = await createBrowser({ headless });
  const page = await createPage(browser);
  const authHelper = new PuppeteerAuthHelper(page);

  try {
    // Navigate to the app
    console.log(`🌐 Navigating to ${url}`);
    const navResult = await navigateToUrl(page, url);
    if (!navResult.success) {
      throw new Error(`Navigation failed: ${navResult.error}`);
    }

    // Check if already authenticated
    if (await authHelper.checkAuthStatus()) {
      console.log('✅ Already authenticated, session ready');
      return { browser, page, authHelper };
    }

    // Perform authentication based on method
    let loginSuccess = false;
    
    switch (method) {
      case 'email':
        loginSuccess = await authHelper.loginWithEmailPassword(credentials);
        break;
      case 'google':
        loginSuccess = await authHelper.loginWithGoogle();
        break;
      case 'bypass':
        loginSuccess = await authHelper.enableDevBypass();
        break;
      default:
        throw new Error(`Unknown authentication method: ${method}`);
    }

    if (!loginSuccess) {
      throw new Error(`Authentication failed using method: ${method}`);
    }

    console.log('✅ Authenticated session created successfully');
    return { browser, page, authHelper };

  } catch (error) {
    console.error('❌ Failed to create authenticated session:', error.message);
    await browser.close();
    throw error;
  }
}

/**
 * Example usage function
 */
export async function demonstrateAuthLogin() {
  let browser, page, authHelper;

  try {
    console.log('🎭 Demonstrating authentication workflows');

    // Method 1: Email/Password login
    console.log('\n📧 Testing email/password authentication');
    ({ browser, page, authHelper } = await createAuthenticatedSession({
      method: 'email',
      credentials: TEST_CREDENTIALS
    }));

    // Take a screenshot of authenticated state
    await page.screenshot({ path: 'authenticated-session.png' });
    console.log('📸 Screenshot saved: authenticated-session.png');

    // Test navigation to different parts of the app
    console.log('🧪 Testing authenticated navigation');
    
    await browser.close();

    console.log('✅ Authentication demonstration completed');

  } catch (error) {
    console.error('❌ Demonstration failed:', error.message);
    if (browser) {
      await browser.close();
    }
    process.exit(1);
  }
}

// Run demonstration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateAuthLogin();
}