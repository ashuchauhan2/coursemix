import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import SignUp from '@/app/(auth-pages)/sign-up/page';
import '../../../jest-dom-setup';

// Add jest-axe matcher
expect.extend(toHaveNoViolations);

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the Message component
jest.mock('@/components/ui/message', () => ({
  Message: ({ type, message }: { type: string; message: string }) => (
    <div data-testid={`message-${type}`} role={type === 'error' ? 'alert' : 'status'}>{message}</div>
  ),
  SearchParamsMessage: () => <div data-testid="search-params-message" />,
}));

describe('SignUp Page Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<SignUp />);
    
    // Run axe accessibility testing on the container
    const results = await axe(container);
    
    // Test should pass if there are no violations
    expect(results).toHaveNoViolations();
  });
  
  it('should have properly labeled form controls', () => {
    render(<SignUp />);
    
    // Check that form elements have proper labels
    const emailInput = screen.getByLabelText(/Email address/i);
    expect(emailInput).toHaveAttribute('id', 'email');
    expect(emailInput).toBeInTheDocument();
    
    // Check that the email input has required attribute for accessibility
    expect(emailInput).toHaveAttribute('required');
    
    // Check that buttons have accessible names
    const signUpButton = screen.getByRole('button', { name: /Sign up/i });
    expect(signUpButton).toBeInTheDocument();
    
    const signInButton = screen.getByRole('button', { name: /Sign in/i });
    expect(signInButton).toBeInTheDocument();
  });
  
  it('should have appropriate heading structure', () => {
    render(<SignUp />);
    
    // Check heading hierarchy
    const headings = screen.getAllByRole('heading');
    
    // There should be at least 2 headings (brand and page title)
    expect(headings.length).toBeGreaterThanOrEqual(2);
    
    // First heading should be Course Mix
    expect(headings[0]).toHaveTextContent('Course Mix');
    
    // Second heading should be about creating account
    expect(headings[1]).toHaveTextContent('Create your account');
  });
  
  it('should have appropriate input attributes', () => {
    render(<SignUp />);
    
    // Check for appropriate attributes
    const emailInput = screen.getByLabelText(/Email address/i);
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('required');
    expect(emailInput).toHaveAttribute('name', 'email');
  });
  
  it('should use semantic HTML elements', () => {
    render(<SignUp />);
    
    // Check for semantic form element
    const formElement = screen.getByRole('button', { name: /Sign up/i }).closest('form');
    expect(formElement).toBeInTheDocument();
    
    // Check for semantic label element (using more specific selector)
    const labelElements = screen.getAllByText(/Email address/i);
    const labelElement = labelElements.find(el => el.tagName.toLowerCase() === 'label');
    expect(labelElement).toBeInTheDocument();
    expect(labelElement?.tagName.toLowerCase()).toBe('label');
  });
}); 