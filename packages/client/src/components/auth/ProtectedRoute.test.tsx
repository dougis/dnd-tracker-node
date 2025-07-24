import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from './ProtectedRoute';
import { describe, it, expect, vi } from 'vitest';

// Mock the router since we don't have it set up yet
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useRouter: () => ({
    navigate: mockNavigate,
  }),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders children when user is authenticated', () => {
    render(
      <ProtectedRoute isAuthenticated={true}>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('redirects to login when user is not authenticated', () => {
    render(
      <ProtectedRoute isAuthenticated={false}>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' });
  });

  it('shows loading state while authentication status is being determined', () => {
    render(
      <ProtectedRoute isAuthenticated={undefined}>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('passes custom redirect path', () => {
    render(
      <ProtectedRoute isAuthenticated={false} redirectTo="/custom-login">
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/custom-login' });
  });
});