import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FeaturesPage from '@/app/(footer-pages)/features/page';

// Mock next/link as it might be used in the button later
jest.mock('next/link', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <a href={href}>{children}</a>;
  };
});

describe('FeaturesPage', () => {
  beforeEach(() => {
    render(<FeaturesPage />);
  });

  it('renders the main heading and description', () => {
    expect(screen.getByRole('heading', { name: /CourseMix Features/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/CourseMix provides Brock University students with a comprehensive suite/i)).toBeInTheDocument();
  });

  it('renders the main feature sections with titles and descriptions', () => {
    const mainFeatures = [
      { title: /Personalized Course Planning/i, description: /Create optimized course schedules/i },
      { title: /Dynamic Course Adjustment/i, description: /Adapt your academic plans as needed/i },
      { title: /Course Insights/i, description: /Access comprehensive course data/i },
      { title: /Community Feedback/i, description: /Discuss and rate courses with peers/i },
    ];

    mainFeatures.forEach(feature => {
      expect(screen.getByRole('heading', { name: feature.title, level: 2 })).toBeInTheDocument();
      expect(screen.getByText(feature.description)).toBeInTheDocument();
    });
  });

  it('renders the "Additional Features" section', () => {
    expect(screen.getByRole('heading', { name: /Additional Features/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByText(/Degree Progress Tracking/i)).toBeInTheDocument();
    expect(screen.getByText(/Grades Calculator/i)).toBeInTheDocument();
    expect(screen.getByText(/Term Progress Bar/i)).toBeInTheDocument();
    expect(screen.getByText(/Mobile Compatibility/i)).toBeInTheDocument();
    expect(screen.getByText(/Reading Week Tracker/i)).toBeInTheDocument();
    expect(screen.getByText(/Data Security/i)).toBeInTheDocument();
  });

  it('renders the final CTA section', () => {
    expect(screen.getByRole('heading', { name: /Ready to Optimize Your Academic Journey\?/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByText(/Join thousands of Brock University students/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Get Started Today/i })).toBeInTheDocument();
    // If the button should link somewhere, add: expect(screen.getByRole('button', { name: /Get Started Today/i }).closest('a')).toHaveAttribute('href', '/expected-link');
  });
}); 