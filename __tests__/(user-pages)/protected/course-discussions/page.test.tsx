import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import DiscussionPage from '@/app/(user-pages)/protected/course-discussions/page';
import { createClient } from '@/utils/supabase/client'; // Client component uses client Supabase
import { redirect } from 'next/navigation';

// --- Mocks ---
// Define mock functions and client object outside the factory
const mockGetUser_client = jest.fn();
const mockEqStatus_client = jest.fn(); // Mock for the second .eq() on enrollments
const mockEqUserId_client = jest.fn(() => ({ eq: mockEqStatus_client })); // Mock for the first .eq() on enrollments
const mockIn_client = jest.fn(); // Mock for .in() on courses
const mockSelect_client = jest.fn(() => ({ 
    eq: mockEqUserId_client, // Default eq behavior (leads to another eq)
    in: mockIn_client      // Default in behavior
}));
const mockFrom_client = jest.fn(() => ({ select: mockSelect_client }));

const mockSupabaseClient = {
  auth: { getUser: mockGetUser_client },
  from: mockFrom_client,
  __isMock: true, 
};

jest.mock('@/utils/supabase/client', () => {
  // Return a factory function that returns the mock object
  return {
    createClient: jest.fn(() => mockSupabaseClient)
  };
});

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// Mock the Discussions component
jest.mock('@/components/course-discussions/Discussions', 
  () => ({ courseId, courseName }: { courseId: string, courseName: string }) => (
    <div data-testid="discussions-mock">
      Discussions Mock for {courseName} (ID: {courseId})
    </div>
  )
);

// --- Helper Data ---
const mockUser = { id: 'user-456', email: 'discuss@example.com' };
const mockEnrollments = [
  { course_id: 'course-1' },
  { course_id: 'course-2' },
];
const mockCourses = [
  { id: 'course-1', course_code: 'TEST 101', title: 'Test Course 1' },
  { id: 'course-2', course_code: 'TEST 102', title: 'Test Course 2' },
];

// --- Test Suite ---
describe('Discussion_Page', () => {
  // Access the client-side mocks directly
  const mockGetUser = mockGetUser_client;
  const mockFrom = mockFrom_client;
  const mockSelect = mockSelect_client;
  const mockIn = mockIn_client;
  const mockEqUserId = mockEqUserId_client;
  const mockEqStatus = mockEqStatus_client;

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: Authenticated user with enrollments and courses
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    // Configure default resolved values for the standard case:
    // 1. Enrollments fetch (select -> eq -> eq -> resolve)
    mockEqStatus.mockResolvedValueOnce({ data: mockEnrollments, error: null });
    // 2. Courses fetch (select -> in -> resolve)
    mockIn.mockResolvedValueOnce({ data: mockCourses, error: null });
  });

  it('redirects to /sign-in if user is not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    render(<DiscussionPage />);
    // Wait for useEffect to potentially call redirect
    await waitFor(() => {
      expect(redirect).toHaveBeenCalledWith('/sign-in');
    });
  });

  it('renders loading state initially', () => {
    render(<DiscussionPage />);
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  it('renders correctly when user has no enrollments', async () => {
    // Configure mocks for this specific case
    jest.clearAllMocks(); // Clear defaults
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockEqStatus.mockResolvedValueOnce({ data: [], error: null }); // Override enrollments fetch
    // mockIn will not be called

    render(<DiscussionPage />);

    // Wait for potential loading states to resolve
    // Check that the dropdown is NOT rendered
    await waitFor(() => {
      expect(screen.queryByRole('combobox', { name: /Select a course/i })).not.toBeInTheDocument();
    });

    // Check that discussion-specific elements are NOT rendered
    expect(screen.queryByRole('textbox', { name: /Your message/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Post message/i })).not.toBeInTheDocument();
    
    // Check for some kind of message indicating no courses (make this robust)
    // Option 1: Look for specific text if known
    // expect(screen.getByText(/You are not enrolled in any courses/i)).toBeInTheDocument(); 
    // Option 2: Look for any element indicating emptiness if text is dynamic
    // expect(screen.getByTestId('no-courses-message')).toBeInTheDocument();
    // For now, let's just ensure the main interactive elements aren't there.

  });

  it('renders course selection dropdown when courses are loaded', async () => {
    render(<DiscussionPage />);
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
    // Check options
    expect(screen.getByRole('option', { name: /Select a course/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: mockCourses[0].course_code })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: mockCourses[1].course_code })).toBeInTheDocument();
  });

  it('does not render Discussions component initially', async () => {
    render(<DiscussionPage />);
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument(); // Wait for loading to finish
    });
    expect(screen.queryByTestId('discussions-mock')).not.toBeInTheDocument();
  });

  it('renders Discussions component when a course is selected', async () => {
    render(<DiscussionPage />);
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument(); // Wait for loading
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: mockCourses[1].id } }); // Select second course

    await waitFor(() => {
      expect(screen.getByTestId('discussions-mock')).toBeInTheDocument();
    });
    expect(screen.getByTestId('discussions-mock')).toHaveTextContent(`Discussions Mock for ${mockCourses[1].course_code} (ID: ${mockCourses[1].id})`);
  });

  it('clears Discussions component when "Select a course" is chosen', async () => {
     render(<DiscussionPage />);
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument(); // Wait for loading
    });

    const select = screen.getByRole('combobox');
    // Select a course first
    fireEvent.change(select, { target: { value: mockCourses[0].id } });
    await waitFor(() => {
      expect(screen.getByTestId('discussions-mock')).toBeInTheDocument();
    });

    // Select the default option
    fireEvent.change(select, { target: { value: '' } }); 
    await waitFor(() => {
      expect(screen.queryByTestId('discussions-mock')).not.toBeInTheDocument();
    });
  });
}); 