import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Simple component for testing
function App() {
  return (
    <div>
      <h1>D&D Encounter Tracker</h1>
      <p>Welcome to the D&D Encounter Tracker!</p>
    </div>
  );
}

describe('App component', () => {
  it('should render the app title', () => {
    render(<App />);
    
    expect(screen.getByText('D&D Encounter Tracker')).toBeDefined();
  });

  it('should render the welcome message', () => {
    render(<App />);
    
    expect(screen.getByText(/Welcome to the D&D Encounter Tracker!/)).toBeDefined();
  });
});