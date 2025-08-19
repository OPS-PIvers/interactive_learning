import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

    it('switches to sign up form when link is clicked', () => {
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const signUpLink = screen.getByText('Sign up');
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
      
      const forgotPasswordLink = screen.getByText('Forgot your password?');
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
      fireEvent.click(screen.getByText('Sign up'));
      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
      
      // Return to sign in (from the sign up form)
      fireEvent.click(screen.getByText(/sign in/i));
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
      mockSignIn.mockResolvedValueOnce(undefined);
      
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const signInButton = screen.getByRole('button', { name: /^sign in$/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(signInButton);
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('shows error message on sign in failure', async () => {
      const errorMessage = 'Invalid credentials';
      mockSignIn.mockRejectedValueOnce(new Error(errorMessage));
      
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const signInButton = screen.getByRole('button', { name: /sign in/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(signInButton);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('validates required fields', async () => {
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const signInButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(signInButton);
      
      // Should not call signIn without required fields
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('disables form during loading', async () => {
      render(
        <TestWrapper authValue={{ ...mockAuthContextValue, loading: true }}>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const signInButton = screen.getByRole('button', { name: /sign in/i });
      const emailInput = screen.getByLabelText(/email/i);
      
      expect(signInButton).toBeDisabled();
      expect(emailInput).toBeDisabled();
    });
  });

  describe('Sign Up Functionality', () => {
    it('submits sign up form with valid data', async () => {
      mockSignUp.mockResolvedValueOnce(undefined);
      
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      // Switch to sign up
      fireEvent.click(screen.getByText(/sign up/i));
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const displayNameInput = screen.getByLabelText(/display name/i);
      const signUpButton = screen.getByRole('button', { name: /create account/i });
      
      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });
      fireEvent.change(displayNameInput, { target: { value: 'New User' } });
      fireEvent.click(signUpButton);
      
      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          'newuser@example.com', 
          'newpassword123', 
          'New User'
        );
      });
    });

    it('shows error message on sign up failure', async () => {
      const errorMessage = 'Email already exists';
      mockSignUp.mockRejectedValueOnce(new Error(errorMessage));
      
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      // Switch to sign up
      fireEvent.click(screen.getByText(/sign up/i));
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const displayNameInput = screen.getByLabelText(/display name/i);
      const signUpButton = screen.getByRole('button', { name: /create account/i });
      
      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(displayNameInput, { target: { value: 'User' } });
      fireEvent.click(signUpButton);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('validates password requirements', () => {
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      // Switch to sign up
      fireEvent.click(screen.getByText(/sign up/i));
      
      const passwordInput = screen.getByLabelText(/password/i);
      fireEvent.change(passwordInput, { target: { value: '123' } }); // Too short
      fireEvent.blur(passwordInput);
      
      // Should show password requirements or validation message
      const signUpButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(signUpButton);
      
      expect(mockSignUp).not.toHaveBeenCalled();
    });
  });

  describe('Password Reset Functionality', () => {
    it('submits password reset form', async () => {
      mockResetPassword.mockResolvedValueOnce(undefined);
      
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      // Switch to forgot password
      fireEvent.click(screen.getByText(/forgot password/i));
      
      const emailInput = screen.getByLabelText(/email/i);
      const resetButton = screen.getByRole('button', { name: /send reset email/i });
      
      fireEvent.change(emailInput, { target: { value: 'reset@example.com' } });
      fireEvent.click(resetButton);
      
      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith('reset@example.com');
      });
    });

    it('shows success message after password reset', async () => {
      mockResetPassword.mockResolvedValueOnce(undefined);
      
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      // Switch to forgot password
      fireEvent.click(screen.getByText(/forgot password/i));
      
      const emailInput = screen.getByLabelText(/email/i);
      const resetButton = screen.getByRole('button', { name: /send reset email/i });
      
      fireEvent.change(emailInput, { target: { value: 'reset@example.com' } });
      fireEvent.click(resetButton);
      
      await waitFor(() => {
        expect(screen.getByText(/reset email sent/i)).toBeInTheDocument();
      });
    });

    it('shows error message on password reset failure', async () => {
      const errorMessage = 'User not found';
      mockResetPassword.mockRejectedValueOnce(new Error(errorMessage));
      
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      // Switch to forgot password
      fireEvent.click(screen.getByText(/forgot password/i));
      
      const emailInput = screen.getByLabelText(/email/i);
      const resetButton = screen.getByRole('button', { name: /send reset email/i });
      
      fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } });
      fireEvent.click(resetButton);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe('Google Sign In', () => {
    it('handles Google sign in', async () => {
      mockSignInWithGoogle.mockResolvedValueOnce(undefined);
      
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      fireEvent.click(googleButton);
      
      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
      });
    });

    it('shows error message on Google sign in failure', async () => {
      const errorMessage = 'Google sign in failed';
      mockSignInWithGoogle.mockRejectedValueOnce(new Error(errorMessage));
      
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      fireEvent.click(googleButton);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('disables Google button during loading', () => {
      render(
        <TestWrapper authValue={{ ...mockAuthContextValue, loading: true }}>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const googleButton = screen.getByRole('button', { name: /continue with google/i });
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

    it('focuses first input when opened', () => {
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveFocus();
    });

    it('handles keyboard navigation', () => {
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      // Tab navigation
      fireEvent.keyDown(emailInput, { key: 'Tab' });
      expect(passwordInput).toHaveFocus();
    });

    it('closes on Escape key', () => {
      const onClose = vi.fn();
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} onClose={onClose} />
        </TestWrapper>
      );
      
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('provides proper labels for screen readers', () => {
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      
      // Switch to sign up to test display name
      fireEvent.click(screen.getByText(/create account/i));
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
      
      // Should show loading state or disabled forms
      const signInButton = screen.getByRole('button', { name: /sign in/i });
      expect(signInButton).toBeDisabled();
    });

    it('clears error messages when switching forms', () => {
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      // Create an error in sign in
      const signInButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(signInButton);
      
      // Switch to sign up
      fireEvent.click(screen.getByText(/sign up/i));
      
      // Error should be cleared
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('prevents form submission during loading', () => {
      render(
        <TestWrapper authValue={{ ...mockAuthContextValue, loading: true }}>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const signInButton = screen.getByRole('button', { name: /sign in/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(signInButton);
      
      expect(mockSignIn).not.toHaveBeenCalled();
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
      
      const signInButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(signInButton);
      
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('handles empty form submission', () => {
      render(
        <TestWrapper>
          <AuthModal {...defaultProps} />
        </TestWrapper>
      );
      
      const signInButton = screen.getByRole('button', { name: /sign in/i });
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
      fireEvent.click(screen.getByText(/sign up/i));
      
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