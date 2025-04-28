import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TermsOfServicePage from '@/app/(footer-pages)/terms-of-service/page';

describe('TermsOfServicePage', () => {
  beforeEach(() => {
    render(<TermsOfServicePage />);
  });

  it('renders the main heading', () => {
    expect(screen.getByRole('heading', { name: /Terms of Service/i, level: 1 })).toBeInTheDocument();
  });

  it('renders the last updated date', () => {
    // Use regex to match the general pattern, as the exact date might change
    expect(screen.getByText(/Last updated: (January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}/i)).toBeInTheDocument();
  });

  it('renders all section headings', () => {
    const headings = [
      /Acceptance of Terms/i,
      /Use of Service/i,
      /User Accounts/i,
      /User Content/i,
      /Limitation of Liability/i,
      /Modifications to Service/i,
      /Governing Law/i,
    ];
    headings.forEach(heading => {
      expect(screen.getByRole('heading', { name: heading, level: 2 })).toBeInTheDocument();
    });
  });
}); 