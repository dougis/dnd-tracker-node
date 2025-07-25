import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';
import { describe, it, expect, vi } from 'vitest';
import { 
  setupAuthFormTest,
  getLoginFormElements,
  fillLoginForm,
  submitLoginForm,
  expectValidationError,
  expectFormSubmission,
  expectFormNotSubmitted,
  expectDisabledForm,
  expectErrorMessage,
  expectLinkPresence
} from '../../test/auth-form-utils';

describe('LoginForm', () => {
  it('renders login form with email and password fields', () => {
    render(<LoginForm onSubmit={vi.fn()} />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('validates required fields and shows errors', async () => {
    const { mockSubmit, user } = setupAuthFormTest();
    
    render(<LoginForm onSubmit={mockSubmit} />);
    
    await submitLoginForm(user);
    
    await waitFor(() => {
      expectValidationError('Email is required');
      expectValidationError('Password is required');
    });
    
    expectFormNotSubmitted(mockSubmit);
  });

  it.skip('validates email format', async () => {
    const { mockSubmit, user } = setupAuthFormTest();
    
    render(<LoginForm onSubmit={mockSubmit} />);
    
    await fillLoginForm(user, 'invalid.email', 'password123');
    await submitLoginForm(user);
    
    await waitFor(() => {
      expectValidationError('Invalid email format');
    });
    
    expectFormNotSubmitted(mockSubmit);
  });

  it('submits form with valid data', async () => {
    const { mockSubmit, user } = setupAuthFormTest();
    
    render(<LoginForm onSubmit={mockSubmit} />);
    
    await fillLoginForm(user);
    await submitLoginForm(user);
    
    await waitFor(() => {
      expectFormSubmission(mockSubmit, {
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('displays error message for locked account', () => {
    const errorMessage = 'Account is locked due to too many failed login attempts';
    
    render(<LoginForm onSubmit={vi.fn()} error={errorMessage} />);
    
    expectErrorMessage(errorMessage);
  });

  it('disables form during submission', () => {
    render(<LoginForm onSubmit={vi.fn()} isLoading={true} />);
    
    expectDisabledForm('login');
  });

  it('shows sign up link when provided', () => {
    const signUpLink = <a href="/register">Sign up</a>;
    render(<LoginForm onSubmit={vi.fn()} signUpLink={signUpLink} />);
    
    expectLinkPresence('sign up', "don't have an account");
  });
});