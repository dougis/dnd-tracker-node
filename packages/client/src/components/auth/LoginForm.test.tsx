import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';
import { describe, it, expect, vi } from 'vitest';

describe('LoginForm', () => {
  it('renders login form with email and password fields', () => {
    render(<LoginForm onSubmit={vi.fn()} />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('validates required fields and shows errors', async () => {
    const mockSubmit = vi.fn();
    const user = userEvent.setup();
    
    render(<LoginForm onSubmit={mockSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await act(async () => {
      await user.click(submitButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
    
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it.skip('validates email format', async () => {
    const mockSubmit = vi.fn();
    const user = userEvent.setup();
    
    render(<LoginForm onSubmit={mockSubmit} />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'invalid.email');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });
    
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const mockSubmit = vi.fn();
    const user = userEvent.setup();
    
    render(<LoginForm onSubmit={mockSubmit} />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await act(async () => {
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
    });
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        {
          email: 'test@example.com',
          password: 'password123',
        },
        expect.any(Object) // The form event object
      );
    });
  });

  it('displays error message for locked account', () => {
    const errorMessage = 'Account is locked due to too many failed login attempts';
    
    render(<LoginForm onSubmit={vi.fn()} error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('disables form during submission', () => {
    render(<LoginForm onSubmit={vi.fn()} isLoading={true} />);
    
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/password/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });

  it('shows sign up link when provided', () => {
    const signUpLink = <a href="/register">Sign up</a>;
    render(<LoginForm onSubmit={vi.fn()} signUpLink={signUpLink} />);
    
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
  });
});