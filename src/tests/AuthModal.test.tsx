import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthModal } from '../client/components/AuthModal';
import { AuthContext, AuthProvider } from '../lib/authContext';

// Mock Firebase auth functions
const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockSignInWithGoogle = vi.fn();
const mockResetPassword = vi.fn();

const mockAuthContextValue = {
  user: null,
  loading: false,
  signIn: mockSignIn,
  signUp: mockSignUp,
  signInWithGoogle: mockSignInWithGoogle,
  logout: vi.fn(),
  resetPassword: mockResetPassword,
  switchAccount: vi.fn(),
  firebaseInitialized: true,
};

// Test wrapper with auth context
const TestWrapper: React.FC<{ children: React.ReactNode; authValue?: any }> = ({ 
  children, 
  authValue = mockAuthContextValue 
}) => (
  <AuthContext.Provider value={authValue}>
    {children}
  </AuthContext.Provider>
);

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
};

describe('AuthModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering and Navigation', () => {
    it('renders sign in form by default', () => {
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
      
      // Get the specific Sign In submit button (not the Google Sign In button)
      const signInButton = screen.getByRole('button', { name: /^Sign In$/i });
      expect(signInButton).toBeInTheDocument();
    });

    it('switches to sign up form when link is clicked', () => {
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const signUpLink = screen.getByRole('button', { name: 'Sign up' });
      fireEvent.click(signUpLink);
      
      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('switches to forgot password form when link is clicked', () => {
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const forgotPasswordLink = screen.getByRole('button', { name: /forgot your password/i });
      fireEvent.click(forgotPasswordLink);
      
      expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send reset email/i })).toBeInTheDocument();
    });

    it('returns to sign in from other forms', () => {
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      // Go to sign up
      fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));
      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
      
      // Return to sign in (from the sign up form)
      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    });

    it('closes modal when close button is clicked', () => {
      const onClose = vi.fn();
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} onClose={onClose} />
        </TestWrapper>
      );
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not render when isOpen is false', () => {
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} isOpen={false} />
        </TestWrapper>
      );
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Sign In Functionality', () => {
    it('submits sign in form with valid credentials', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValueOnce(undefined);
      
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const signInButton = screen.getByRole('button', { name: 'Sign In' });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(signInButton);
      
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('shows error message on sign in failure', async () => {
      const user = userEvent.setup();
      mockSignIn.mockRejectedValueOnce({ code: 'auth/wrong-password' });
      
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const signInButton = screen.getByRole('button', { name: 'Sign In' });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(signInButton);
      
      expect(await screen.findByText('Incorrect password.')).toBeInTheDocument();
    });

    it('validates required fields', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const signInButton = screen.getByRole('button', { name: 'Sign In' });
      await user.click(signInButton);
      
      // Should not call signIn without required fields
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('disables form during loading', async () => {
      render(
        <TestWrapper authValue={{ ...mockAuthContextValue, loading: true }}>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const submitButton = screen.getByRole('button', { name: /loading/i });
      expect(submitButton).toBeDisabled();

      // Inputs should also be disabled. Let's check one.
      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toBeDisabled();
    });
  });

  describe('Sign Up Functionality', () => {
    it('submits sign up form with valid data', async () => {
      const user = userEvent.setup();
      mockSignUp.mockResolvedValueOnce(undefined);
      
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      // Switch to sign up
      await user.click(screen.getByRole('button', { name: 'Sign up' }));
      
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const displayNameInput = screen.getByLabelText(/display name/i);
      const signUpButton = screen.getByRole('button', { name: /create account/i });
      
      await user.type(displayNameInput, 'New User');
      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'newpassword123');
      await user.click(signUpButton);
      
      expect(mockSignUp).toHaveBeenCalledWith(
        'newuser@example.com',
        'newpassword123',
        'New User'
      );
    });

    it('shows error message on sign up failure', async () => {
      const user = userEvent.setup();
      mockSignUp.mockRejectedValueOnce({ code: 'auth/email-already-in-use' });
      
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      // Switch to sign up
      await user.click(screen.getByRole('button', { name: 'Sign up' }));
      
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const displayNameInput = screen.getByLabelText(/display name/i);
      const signUpButton = screen.getByRole('button', { name: /create account/i });
      
      await user.type(displayNameInput, 'User');
      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(signUpButton);
      
      expect(await screen.findByText('An account already exists with this email address.')).toBeInTheDocument();
    });

    it('validates password requirements', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      // Switch to sign up
      await user.click(screen.getByRole('button', { name: 'Sign up' }));
      
      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, '123'); // Too short
      
      // Should show password requirements or validation message
      const signUpButton = screen.getByRole('button', { name: /create account/i });
      await user.click(signUpButton);
      
      expect(mockSignUp).not.toHaveBeenCalled();
    });
  });

  describe('Password Reset Functionality', () => {
    it('submits password reset form', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockResolvedValueOnce(undefined);
      
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      // Switch to forgot password
      await user.click(screen.getByRole('button', { name: /forgot your password/i }));
      
      const emailInput = screen.getByLabelText(/email address/i);
      const resetButton = screen.getByRole('button', { name: /send reset email/i });
      
      await user.type(emailInput, 'reset@example.com');
      await user.click(resetButton);
      
      expect(mockResetPassword).toHaveBeenCalledWith('reset@example.com');
    });

    it('shows success message after password reset', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockResolvedValueOnce(undefined);
      
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      // Switch to forgot password
      await user.click(screen.getByRole('button', { name: /forgot your password/i }));
      
      const emailInput = screen.getByLabelText(/email address/i);
      const resetButton = screen.getByRole('button', { name: /send reset email/i });
      
      await user.type(emailInput, 'reset@example.com');
      await user.click(resetButton);
      
      expect(await screen.findByText(/reset email sent/i)).toBeInTheDocument();
    });

    it('shows error message on password reset failure', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockRejectedValueOnce({ code: 'auth/user-not-found' });
      
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      // Switch to forgot password
      await user.click(screen.getByRole('button', { name: /forgot your password/i }));
      
      const emailInput = screen.getByLabelText(/email address/i);
      const resetButton = screen.getByRole('button', { name: /send reset email/i });
      
      await user.type(emailInput, 'nonexistent@example.com');
      await user.click(resetButton);
      
      expect(await screen.findByText('No account found with this email address.')).toBeInTheDocument();
    });
  });

  describe('Google Sign In', () => {
    it('handles Google sign in', async () => {
      const user = userEvent.setup();
      mockSignInWithGoogle.mockResolvedValueOnce(undefined);
      
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      await user.click(googleButton);
      
      expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
    });

    it('shows error message on Google sign in failure', async () => {
      const user = userEvent.setup();
      mockSignInWithGoogle.mockRejectedValueOnce({ code: 'auth/popup-closed-by-user' });
      
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      await user.click(googleButton);
      
      expect(await screen.findByText('Sign-in was cancelled.')).toBeInTheDocument();
    });

    it('disables Google button during loading', () => {
      render(
        <TestWrapper authValue={{ ...mockAuthContextValue, loading: true }}>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      expect(googleButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby');
    });

    it('focuses on the email input initially when signing in', () => {
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveFocus();
    });

    it('focuses on the display name input initially when signing up', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      await user.click(screen.getByRole('button', { name: 'Sign up' }));

      const displayNameInput = screen.getByLabelText(/display name/i);
      expect(displayNameInput).toHaveFocus();
    });

    it('handles keyboard navigation correctly for sign in form', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      expect(emailInput).toHaveFocus();

      await user.tab();
      expect(passwordInput).toHaveFocus();
    });

    it('handles keyboard navigation correctly for sign up form', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );

      await user.click(screen.getByRole('button', { name: 'Sign up' }));

      const displayNameInput = screen.getByLabelText(/display name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(displayNameInput).toHaveFocus();

      await user.tab();
      expect(emailInput).toHaveFocus();

      await user.tab();
      expect(passwordInput).toHaveFocus();
    });

    it('closes on Escape key', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} onClose={onClose} />
        </TestWrapper>
      );
      
      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('provides proper labels for screen readers', () => {
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      
      // Switch to sign up to test display name
      fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('requires auth context to function', () => {
      // This test verifies that the component is properly integrated with auth context
      // The component should render successfully when provided with valid auth context
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    });

    it('disables form if firebase is not initialized', () => {
      render(
        <TestWrapper authValue={{ ...mockAuthContextValue, firebaseInitialized: false }}>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const signInButton = screen.getByRole('button', { name: 'Sign In' });
      expect(signInButton).toBeDisabled();
    });

    it('clears error messages when switching forms', async () => {
      const user = userEvent.setup();
      mockSignIn.mockRejectedValueOnce({ code: 'auth/wrong-password' });
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      // Create an error in sign in
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: 'Sign In' }));
      expect(await screen.findByText('Incorrect password.')).toBeInTheDocument();
      
      // Switch to sign up
      await user.click(screen.getByRole('button', { name: 'Sign up' }));
      
      // Error should be cleared
      expect(screen.queryByText('Incorrect password.')).not.toBeInTheDocument();
    });

    it('prevents form submission during loading', async () => {
      const user = userEvent.setup();

      let resolveSignIn: (value: unknown) => void;
      const signInPromise = new Promise((resolve) => {
        resolveSignIn = resolve;
      });
      mockSignIn.mockImplementation(() => signInPromise);

      const { rerender } = render(
        <TestWrapper authValue={{ ...mockAuthContextValue, loading: false }}>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const signInButton = screen.getByRole('button', { name: 'Sign In' });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      
      await user.click(signInButton);
      expect(mockSignIn).toHaveBeenCalledTimes(1);

      // Re-render with loading state true
      rerender(
        <TestWrapper authValue={{ ...mockAuthContextValue, loading: true }}>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );

      const loadingButton = screen.getByRole('button', { name: /loading/i });
      expect(loadingButton).toBeDisabled();

      // A second click should not trigger the mock again because the button is disabled
      await user.click(loadingButton);
      expect(mockSignIn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Form Validation', () => {
    it('validates email format', () => {
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);
      
      const signInButton = screen.getByRole('button', { name: 'Sign In' });
      fireEvent.click(signInButton);
      
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('handles empty form submission', () => {
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const signInButton = screen.getByRole('button', { name: 'Sign In' });
      fireEvent.click(signInButton);
      
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('validates display name in sign up', () => {
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      // Switch to sign up
      fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const signUpButton = screen.getByRole('button', { name: /create account/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      // Leave display name empty
      fireEvent.click(signUpButton);
      
      expect(mockSignUp).not.toHaveBeenCalled();
    });
  });
});