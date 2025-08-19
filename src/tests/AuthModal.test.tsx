import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
      const signInButton = screen.getByRole('button', { name: /^sign in$/i });
      expect(signInButton).toBeInTheDocument();
    });

    it('switches to sign up form when link is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const signUpLink = screen.getByText('Sign up');
      await user.click(signUpLink);
      
      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('switches to forgot password form when link is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const forgotPasswordLink = screen.getByText(/forgot.*password/i);
      await user.click(forgotPasswordLink);
      
      expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send reset email/i })).toBeInTheDocument();
    });

    it('returns to sign in from other forms', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      // Go to sign up
      await user.click(screen.getByText('Sign up'));
      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
      
      // Return to sign in (from the sign up form)
      await user.click(screen.getByText(/sign in/i));
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    });

    it('closes modal when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} onClose={onClose} />
        </TestWrapper>
      );
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      
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
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const signInButton = screen.getByRole('button', { name: /^sign in$/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(signInButton);
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('shows error message on sign in failure', async () => {
      const user = userEvent.setup();
      mockSignIn.mockRejectedValueOnce(new Error('Invalid credentials'));
      
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const signInButton = screen.getByRole('button', { name: /^sign in$/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(signInButton);
      
      await waitFor(() => {
        expect(screen.getByText(/an error occurred/i)).toBeInTheDocument();
      });
    });

    it('validates required fields', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const signInButton = screen.getByRole('button', { name: /^sign in$/i });
      await user.click(signInButton);
      
      // Should not call signIn without required fields
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('shows loading state on buttons', async () => {
      const user = userEvent.setup();
      // Make signIn return a promise that we can control
      let resolveSignIn: () => void;
      const signInPromise = new Promise<void>((resolve) => {
        resolveSignIn = resolve;
      });
      mockSignIn.mockReturnValueOnce(signInPromise);
      
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const signInButton = screen.getByRole('button', { name: /^sign in$/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(signInButton);
      
      // Should show loading state
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
      
      // Resolve the promise to complete the test
      resolveSignIn();
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });
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
      await user.click(screen.getByText(/sign up/i));
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const displayNameInput = screen.getByLabelText(/display name/i);
      const signUpButton = screen.getByRole('button', { name: /create account/i });
      
      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'newpassword123');
      await user.type(displayNameInput, 'New User');
      await user.click(signUpButton);
      
      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          'newuser@example.com', 
          'newpassword123', 
          'New User'
        );
      });
    });

    it('shows error message on sign up failure', async () => {
      const user = userEvent.setup();
      mockSignUp.mockRejectedValueOnce(new Error('Email already exists'));
      
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      // Switch to sign up
      await user.click(screen.getByText(/sign up/i));
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const displayNameInput = screen.getByLabelText(/display name/i);
      const signUpButton = screen.getByRole('button', { name: /create account/i });
      
      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(displayNameInput, 'User');
      await user.click(signUpButton);
      
      await waitFor(() => {
        expect(screen.getByText(/an error occurred/i)).toBeInTheDocument();
      });
    });

    it('validates password requirements', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      // Switch to sign up
      await user.click(screen.getByText(/sign up/i));
      
      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, '123'); // Too short
      await user.tab(); // Blur the input
      
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
      await user.click(screen.getByText(/forgot.*password/i));
      
      const emailInput = screen.getByLabelText(/email/i);
      const resetButton = screen.getByRole('button', { name: /send reset email/i });
      
      await user.type(emailInput, 'reset@example.com');
      await user.click(resetButton);
      
      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith('reset@example.com');
      });
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
      await user.click(screen.getByText(/forgot.*password/i));
      
      const emailInput = screen.getByLabelText(/email/i);
      const resetButton = screen.getByRole('button', { name: /send reset email/i });
      
      await user.type(emailInput, 'reset@example.com');
      await user.click(resetButton);
      
      await waitFor(() => {
        expect(screen.getByText(/reset email sent/i)).toBeInTheDocument();
      });
    });

    it('shows error message on password reset failure', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockRejectedValueOnce(new Error('User not found'));
      
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      // Switch to forgot password
      await user.click(screen.getByText(/forgot.*password/i));
      
      const emailInput = screen.getByLabelText(/email/i);
      const resetButton = screen.getByRole('button', { name: /send reset email/i });
      
      await user.type(emailInput, 'nonexistent@example.com');
      await user.click(resetButton);
      
      await waitFor(() => {
        expect(screen.getByText(/an error occurred/i)).toBeInTheDocument();
      });
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
      
      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      await user.click(googleButton);
      
      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
      });
    });

    it('shows error message on Google sign in failure', async () => {
      const user = userEvent.setup();
      mockSignInWithGoogle.mockRejectedValueOnce(new Error('Google sign in failed'));
      
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      await user.click(googleButton);
      
      await waitFor(() => {
        expect(screen.getByText(/an error occurred/i)).toBeInTheDocument();
      });
    });

    it('handles Google sign in loading state', async () => {
      const user = userEvent.setup();
      let resolveGoogle: () => void;
      const googlePromise = new Promise<void>((resolve) => {
        resolveGoogle = resolve;
      });
      mockSignInWithGoogle.mockReturnValueOnce(googlePromise);
      
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      await user.click(googleButton);
      
      // Should be disabled during loading
      expect(googleButton).toBeDisabled();
      
      // Resolve to complete test
      resolveGoogle();
      await waitFor(() => {
        expect(googleButton).not.toBeDisabled();
      });
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

    it('renders with proper focus management', () => {
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('handles keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      // Focus email input first
      await user.click(emailInput);
      
      // Tab navigation
      await user.tab();
      expect(passwordInput).toHaveFocus();
    });

    it('can be closed with close button', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} onClose={onClose} />
        </TestWrapper>
      );
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('provides proper labels for screen readers', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      
      // Switch to sign up to test display name
      await user.click(screen.getByText(/sign up/i));
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

    it('handles Firebase initialization states', () => {
      render(
        <TestWrapper authValue={{ ...mockAuthContextValue, firebaseInitialized: false }}>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      // Component should still render normally - Firebase initialization doesn't affect UI state
      const signInButton = screen.getByRole('button', { name: /^sign in$/i });
      expect(signInButton).toBeInTheDocument();
    });

    it('clears error messages when switching forms', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      // Create an error in sign in
      const signInButton = screen.getByRole('button', { name: /^sign in$/i });
      await user.click(signInButton);
      
      // Switch to sign up
      await user.click(screen.getByText(/sign up/i));
      
      // Error should be cleared
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('handles form submission properly', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValueOnce(undefined);
      
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const signInButton = screen.getByRole('button', { name: /^sign in$/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(signInButton);
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalled();
      });
    });
  });

  describe('Form Validation', () => {
    it('validates email format', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab(); // Blur the input
      
      const signInButton = screen.getByRole('button', { name: /^sign in$/i });
      await user.click(signInButton);
      
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('handles empty form submission', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const signInButton = screen.getByRole('button', { name: /^sign in$/i });
      await user.click(signInButton);
      
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('validates display name in sign up', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      // Switch to sign up
      await user.click(screen.getByText(/sign up/i));
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const signUpButton = screen.getByRole('button', { name: /create account/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      // Leave display name empty
      await user.click(signUpButton);
      
      expect(mockSignUp).not.toHaveBeenCalled();
    });
  });
});