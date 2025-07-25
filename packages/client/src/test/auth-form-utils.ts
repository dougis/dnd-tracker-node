import { screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

// Standard test setup for auth form tests
export const setupAuthFormTest = () => ({
  mockSubmit: vi.fn(),
  user: userEvent.setup(),
});

// Base helper for getting standard form elements with customizable selectors
export const getFormElements = (config: {
  passwordSelector?: RegExp;
  submitButtonText?: RegExp;
  includeConfirmPassword?: boolean;
}) => {
  const elements: any = {
    emailInput: screen.getByLabelText(/email/i),
    passwordInput: screen.getByLabelText(config.passwordSelector || /password/i),
    submitButton: screen.getByRole('button', { name: config.submitButtonText || /submit/i }),
  };

  if (config.includeConfirmPassword) {
    elements.confirmPasswordInput = screen.getByLabelText(/confirm password/i);
  }

  return elements;
};

// Helper to get registration form elements
export const getAuthFormElements = () => getFormElements({
  passwordSelector: /^password/i,
  submitButtonText: /create account/i,
  includeConfirmPassword: true,
});

// Helper for basic form element lookup (email, password, submit) for registration
export const getBasicFormElements = () => getFormElements({
  passwordSelector: /^password/i,
  submitButtonText: /create account/i,
  includeConfirmPassword: false,
});

// Helper for login form elements
export const getLoginFormElements = () => getFormElements({
  passwordSelector: /password/i,
  submitButtonText: /sign in/i,
  includeConfirmPassword: false,
});

// Generic helper for filling form fields
export const fillFormFields = async (user: any, fields: Array<{element: HTMLElement, value: string}>) => {
  await act(async () => {
    for (const field of fields) {
      if (field.value) {
        await user.type(field.element, field.value);
      }
    }
  });
};

// Helper for filling out registration form with test data
export const fillRegistrationForm = async (user: any, email = 'test@example.com', password = 'password123', confirmPassword = 'password123') => {
  const { emailInput, passwordInput, confirmPasswordInput } = getAuthFormElements();
  
  await fillFormFields(user, [
    { element: emailInput, value: email },
    { element: passwordInput, value: password },
    { element: confirmPasswordInput, value: confirmPassword }
  ]);
};

// Helper for filling out login form with test data
export const fillLoginForm = async (user: any, email = 'test@example.com', password = 'password123') => {
  const { emailInput, passwordInput } = getLoginFormElements();
  
  await fillFormFields(user, [
    { element: emailInput, value: email },
    { element: passwordInput, value: password }
  ]);
};

// Generic helper for submitting form 
export const submitForm = async (user: any, buttonText = /create account/i) => {
  const submitButton = screen.getByRole('button', { name: buttonText });
  
  await act(async () => {
    await user.click(submitButton);
  });
};

// Helper for submitting login form
export const submitLoginForm = async (user: any) => {
  await submitForm(user, /sign in/i);
};

// Helper for form validation expectations
export const expectValidationError = (errorText: string) => {
  expect(screen.getByText(errorText)).toBeInTheDocument();
};

// Helper for form submission expectations
export const expectFormSubmission = (mockSubmit: any, expectedData: any) => {
  expect(mockSubmit).toHaveBeenCalledWith(
    expectedData,
    expect.any(Object) // The form event object
  );
};

// Helper for form not being called
export const expectFormNotSubmitted = (mockSubmit: any) => {
  expect(mockSubmit).not.toHaveBeenCalled();
};

// Helper for disabled form elements
export const expectDisabledForm = (formType: 'login' | 'register' = 'register') => {
  expect(screen.getByLabelText(/email/i)).toBeDisabled();
  expect(screen.getByLabelText(formType === 'register' ? /^password/i : /password/i)).toBeDisabled();
  
  if (formType === 'register') {
    expect(screen.getByLabelText(/confirm password/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
  } else {
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  }
};

// Helper for error message display
export const expectErrorMessage = (errorMessage: string) => {
  expect(screen.getByText(errorMessage)).toBeInTheDocument();
  expect(screen.getByRole('alert')).toBeInTheDocument();
};

// Helper for link presence
export const expectLinkPresence = (linkText: string, description: string) => {
  expect(screen.getByText(new RegExp(description, 'i'))).toBeInTheDocument();
  expect(screen.getByRole('link', { name: new RegExp(linkText, 'i') })).toBeInTheDocument();
};