import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import TestimonialsPage from '@/app/(footer-pages)/testimonials/page';

// Mock next/link
jest.mock('next/link', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <a href={href}>{children}</a>;
  };
});

describe('TestimonialsPage', () => {
  beforeEach(() => {
    render(<TestimonialsPage />);
  });

  it('renders the main heading and description', () => {
    expect(screen.getByRole('heading', { name: /Student Testimonials/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Don't just take our word for it/i)).toBeInTheDocument();
  });

  it('renders all testimonials with name, program/year, and quote', () => {
    // Find testimonial cards by looking for the quote SVG element within them.
    // This assumes the SVG is a reliable indicator of a testimonial card.
    const quoteSvgs = screen.getAllByRole('img', { hidden: true }); // SVGs might be hidden from accessibility tree
    // Filter SVGs based on a unique path data or viewBox if possible, 
    // or assume all SVGs found this way are the quote icons for now.
    // Example: Find SVGs with a specific path 'd' attribute if consistent
    // const quoteSvgs = screen.getAllByRole('img', { hidden: true }).filter(svg => 
    //   svg.querySelector('path[d^="M14.017"]')); 

    expect(quoteSvgs.length).toBeGreaterThan(1); // Check multiple quote icons are found

    // Get the parent card element for checking content
    const firstCardElement = quoteSvgs[0].closest('div.bg-gray-50') ?? quoteSvgs[0].parentElement;

    if (!firstCardElement) {
        throw new Error("Could not find parent card element for the first quote SVG.");
    }
    // Assert the type before passing to within
    const firstCard = firstCardElement as HTMLElement;

    // Check content within the inferred card
    expect(within(firstCard).getByRole('heading', { name: /Jordan Lee/i })).toBeInTheDocument();
    expect(within(firstCard).getByText(/Computer Science, 3rd Year/i)).toBeInTheDocument();
    expect(within(firstCard).getByText(/transformed my course registration experience/i)).toBeInTheDocument();

    // Could add similar checks for other known testimonials if needed
  });

  it('renders the "Join Our Community" section with a button linking to sign-up', () => {
    expect(screen.getByRole('heading', { name: /Join Our Community/i })).toBeInTheDocument();
    const button = screen.getByRole('button', { name: /Create Your Free Account/i });
    expect(button).toBeInTheDocument();
    expect(button.closest('a')).toHaveAttribute('href', '/sign-up');
  });

  it('renders the "Share Your Experience" section with contact email', () => {
    expect(screen.getByRole('heading', { name: /Share Your Experience/i })).toBeInTheDocument();
    expect(screen.getByText(/Are you a CourseMix user with a story to share\?/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /coursemixtroubleshoot@gmail.com/i })).toHaveAttribute('href', 'mailto:coursemixtroubleshoot@gmail.com');
  });
}); 