// This file extends Jest's expect with Testing Library's matchers
import '@testing-library/jest-dom';

// This is needed for TypeScript to recognize the matchers added by jest-dom
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveTextContent(text: string | RegExp): R;
      toHaveAttribute(attr: string, value?: string): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeChecked(): R;
      toBeVisible(): R;
      toHaveClass(className: string): R;
      // Add any other matchers you need
    }
  }
}

// Add a dummy test to prevent Jest from throwing an error
// about this file not containing any tests
describe('Jest DOM Setup', () => {
  it('should load successfully', () => {
    expect(true).toBe(true);
  });
}); 