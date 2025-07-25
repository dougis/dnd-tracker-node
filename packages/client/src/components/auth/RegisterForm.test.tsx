import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from './RegisterForm';
import { describe, it, expect, vi } from 'vitest';
import { 
  setupAuthFormTest, 
  getAuthFormElements, 
  getBasicFormElements,
  fillRegistrationForm,
  submitForm,
  expectValidationError,
  expectFormSubmission,
  expectFormNotSubmitted,
  expectDisabledForm,
  expectLinkPresence
} from '../../test/auth-form-utils';

describe('RegisterForm', () => {
  it('renders registration form with all required fields', () => {
    render(<RegisterForm onSubmit={vi.fn()} />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('validates required fields and shows errors', async () => {
    const { mockSubmit, user } = setupAuthFormTest();
    
    render(<RegisterForm onSubmit={mockSubmit} />);
    
    await submitForm(user);
    
    await waitFor(() => {
      expectValidationError('Email is required');
      expectValidationError('Password must be at least 8 characters');
    });
    
    expectFormNotSubmitted(mockSubmit);
  });

  it.skip('validates email format', async () => {
    const { mockSubmit, user } = setupAuthFormTest();
    
    render(<RegisterForm onSubmit={mockSubmit} />);
    
    await fillRegistrationForm(user, 'invalid-email', 'password123', 'password123');
    await submitForm(user);
    
    await waitFor(() => {
      expectValidationError('Invalid email format');
    });
    
    expectFormNotSubmitted(mockSubmit);
  });

  it('validates password requirements', async () => {
    const { mockSubmit, user } = setupAuthFormTest();
    
    render(<RegisterForm onSubmit={mockSubmit} />);
    
    const { passwordInput } = getBasicFormElements();
    
    await act(async () => {
      await user.type(passwordInput, '123');
    });
    await submitForm(user);
    
    await waitFor(() => {
      expectValidationError('Password must be at least 8 characters');
    });
    
    expectFormNotSubmitted(mockSubmit);
  });

  it('validates password confirmation matches', async () => {
    const { mockSubmit, user } = setupAuthFormTest();
    
    render(<RegisterForm onSubmit={mockSubmit} />);
    
    const { passwordInput, confirmPasswordInput } = getAuthFormElements();
    
    await act(async () => {
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'different123');
    });
    await submitForm(user);
    
    await waitFor(() => {
      expectValidationError('Passwords do not match');
    });
    
    expectFormNotSubmitted(mockSubmit);
  });

  it('submits form with valid data', async () => {
    const { mockSubmit, user } = setupAuthFormTest();
    
    render(<RegisterForm onSubmit={mockSubmit} />);
    
    await fillRegistrationForm(user);
    await submitForm(user);
    
    await waitFor(() => {
      expectFormSubmission(mockSubmit, {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });
    });
  });

  it('disables form during submission', () => {
    render(<RegisterForm onSubmit={vi.fn()} isLoading={true} />);
    
    expectDisabledForm('register');
  });

  it('shows sign in link when provided', () => {
    const signInLink = <a href="/login">Sign in</a>;
    render(<RegisterForm onSubmit={vi.fn()} signInLink={signInLink} />);
    
    expectLinkPresence('sign in', 'already have an account');
  });
});