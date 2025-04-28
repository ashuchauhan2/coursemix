import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AboutUsPage from '@/app/(footer-pages)/about-us/page';

// Mock the TeamMember component
jest.mock('@/components/about-us', () => ({
  TeamMember: ({ name, role, Icon }: { name: string; role: string; Icon: React.ElementType }) => (
    <div data-testid={`team-member-${name.toLowerCase()}`}>
      <Icon data-testid={`icon-${name.toLowerCase()}`} />
      <h3>{name}</h3>
      <p>{role}</p>
    </div>
  ),
}));

// Mock react-icons (provide simple placeholders)
jest.mock('react-icons/fa', () => ({
  FaCode: () => <svg data-testid="icon-code"></svg>,
  FaTerminal: () => <svg data-testid="icon-terminal"></svg>,
  FaClipboardList: () => <svg data-testid="icon-clipboard"></svg>,
  FaUsers: () => <svg data-testid="icon-users"></svg>,
  FaPencilAlt: () => <svg data-testid="icon-pencil"></svg>,
  FaUniversity: () => <svg data-testid="icon-university"></svg>,
}));

describe('AboutUsPage', () => {
  beforeEach(() => {
    render(<AboutUsPage />);
  });

  it('renders the main heading and description', () => {
    expect(screen.getByRole('heading', { name: /About CourseMix/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/CourseMix is a modern course planning platform/i)).toBeInTheDocument();
  });

  it('renders the Mission and Story sections', () => {
    const missionParagraph = screen.getByText(/empower students/i);
    expect(missionParagraph).toBeInTheDocument();
    const missionHeading = missionParagraph.previousElementSibling;
    expect(missionHeading).toBeInTheDocument();
    expect(missionHeading).toHaveRole('heading');
    expect(missionHeading).toHaveTextContent(/Our Mission/i);
    
    expect(screen.getByRole('heading', { name: /Our Story/i })).toBeInTheDocument();
    expect(screen.getByText(/began as a class project/i)).toBeInTheDocument();
  });

  it('renders the "Meet The Team" section with all team members', () => {
    expect(screen.getByRole('heading', { name: /Meet The Team/i, level: 2 })).toBeInTheDocument();

    const teamMembersData = [
      { name: 'Avi', role: 'Developer' },
      { name: 'Ashu', role: 'Developer' },
      { name: 'Fatima', role: 'Scrum Master' },
      { name: 'Russell', role: 'Developer' },
      { name: 'Jerome', role: 'Developer' },
      { name: 'Olaoluwa', role: 'Product Owner' },
      { name: 'Oreoluwa', role: 'Content Designer' },
      { name: 'Brendan', role: 'Stake Holder' },
      { name: 'Naser Ezzati-Jivan', role: 'Stake Holder' },
    ];

    teamMembersData.forEach(member => {
      const memberElement = screen.getByTestId(`team-member-${member.name.toLowerCase()}`);
      expect(memberElement).toBeInTheDocument();
      expect(memberElement).toHaveTextContent(member.name);
      expect(memberElement).toHaveTextContent(member.role);
      // Check if the corresponding icon mock is rendered within the member element
      expect(memberElement.querySelector(`[data-testid^="icon-"]`)).toBeInTheDocument();
    });
  });

  it('renders the "Our Values" section with all values listed', () => {
    expect(screen.getByRole('heading', { name: /Our Values/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByText(/Student-Centered Design/i)).toBeInTheDocument();
    expect(screen.getByText(/Data-Driven Insights/i)).toBeInTheDocument();
    expect(screen.getByText(/Continuous Improvement/i)).toBeInTheDocument();
    expect(screen.getByText(/Academic Integrity/i)).toBeInTheDocument();
  });

  it('renders the "Join Us on Our Mission" section', () => {
    expect(screen.getByRole('heading', { name: /Join Us on Our Mission/i })).toBeInTheDocument();
    expect(screen.getByText(/We're always looking for feedback/i)).toBeInTheDocument();
  });
}); 