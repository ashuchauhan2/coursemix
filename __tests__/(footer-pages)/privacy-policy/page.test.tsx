import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PrivacyPolicyPage from '@/app/(footer-pages)/privacy-policy/page';

describe('PrivacyPolicyPage', () => {
  beforeEach(() => {
    render(<PrivacyPolicyPage />);
  });

  it('renders the main heading', () => {
    expect(screen.getByRole('heading', { name: /Privacy Policy/i, level: 1 })).toBeInTheDocument();
  });

  it('renders the last updated date', () => {
    // Use regex to match the general pattern, as the exact date might change
    expect(screen.getByText(/Last updated: (January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}/i)).toBeInTheDocument();
  });

  it('renders all section headings', () => {
    const headings = [
      /Introduction/i,
      /Information We Collect/i,
      /How We Use Your Information/i,
      /Data Sharing and Disclosure/i,
      /Data Security/i,
      /Your Rights/i,
      /Changes to This Policy/i,
      /Contact Us/i,
    ];
    headings.forEach(heading => {
      expect(screen.getByRole('heading', { name: heading, level: 2 })).toBeInTheDocument();
    });
  });

  it('renders the contact email address', () => {
    expect(screen.getByText(/coursemixtroubleshoot@gmail.com/i)).toBeInTheDocument();
  });
}); 