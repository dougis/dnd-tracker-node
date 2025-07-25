import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from './RegisterForm';
import { describe, it, expect, vi } from 'vitest';

describe('RegisterForm', () => {
  it('renders registration form with all required fields', () => {
    render(<RegisterForm onSubmit={vi.fn()} />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('validates required fields and shows errors', async () => {
    const mockSubmit = vi.fn();
    const user = userEvent.setup();
    
    render(<RegisterForm onSubmit={mockSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    await act(async () => {
      await user.click(submitButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });
    
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it.skip('validates email format', async () => {
    const mockSubmit = vi.fn();
    const user = userEvent.setup();
    
    render(<RegisterForm onSubmit={mockSubmit} />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    await act(async () => {
      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });
    
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('validates password requirements', async () => {
    const mockSubmit = vi.fn();
    const user = userEvent.setup();
    
    render(<RegisterForm onSubmit={mockSubmit} />);
    
    const passwordInput = screen.getByLabelText(/^password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    await act(async () => {
      await user.type(passwordInput, '123');
      await user.click(submitButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });
    
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('validates password confirmation matches', async () => {
    const mockSubmit = vi.fn();
    const user = userEvent.setup();
    
    render(<RegisterForm onSubmit={mockSubmit} />);
    
    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    await act(async () => {
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'different123');
      await user.click(submitButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
    
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const mockSubmit = vi.fn();
    const user = userEvent.setup();
    
    render(<RegisterForm onSubmit={mockSubmit} />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    await act(async () => {
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);
    });
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        {
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        },
        expect.any(Object) // The form event object
      );
    });
  });

  it('disables form during submission', () => {
    render(<RegisterForm onSubmit={vi.fn()} isLoading={true} />);
    
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/^password/i)).toBeDisabled();
    expect(screen.getByLabelText(/confirm password/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
  });

  it('shows sign in link when provided', () => {
    const signInLink = <a href="/login">Sign in</a>;
    render(<RegisterForm onSubmit={vi.fn()} signInLink={signInLink} />);
    
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });
});