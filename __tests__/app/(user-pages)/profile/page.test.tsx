import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfilePage from '@/app/(user-pages)/protected/profile/page';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { formatDate } from '@/utils/date-utils'; // Import formatDate
import { User } from '@supabase/supabase-js';

// --- Mocks ---
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn().mockImplementation(() => {
    const mockSingle = jest.fn();
    const mockEq = jest.fn(() => ({ single: mockSingle }));
    const mockSelect = jest.fn(() => ({ eq: mockEq }));
    const mockFrom = jest.fn(() => ({ select: mockSelect }));
    const mockGetUser = jest.fn();

    return {
      auth: { getUser: mockGetUser },
      from: mockFrom,
      _instanceMocks: { mockGetUser, mockSingle, mockEq, mockSelect, mockFrom }
    };
  })
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock date-utils specifically for formatDate
jest.mock('@/utils/date-utils', () => ({
  formatDate: jest.fn((date: Date | string) => {
    if (!date) return "Not set";
    // Provide a consistent mock format
    const d = typeof date === 'string' ? new Date(date) : date;
    return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}, ${d.getFullYear()}`;
  }),
}));

// Mock child components
jest.mock('@/components/UserPages/Protected/Profile/UserProfileHeader', () => ({
    __esModule: true,
    default: jest.fn(() => <div data-testid="user-profile-header-mock">Header Mock</div>),
}));
jest.mock('@/components/UserPages/Protected/Profile/UserProfileDetails', () => ({
    __esModule: true,
    default: jest.fn(() => <div data-testid="user-profile-details-mock">Details Mock</div>),
}));

// Helper to get the mock instance's functions
const getMocksForInstance = () => {
  const { createClient } = jest.requireActual('@/utils/supabase/server');
  const instance = createClient();
  // Add type assertion if needed, but inference might work here
  return instance._instanceMocks as { 
    mockGetUser: jest.Mock;
    mockSingle: jest.Mock;
    mockEq: jest.Mock;
    mockSelect: jest.Mock;
    mockFrom: jest.Mock;
  }; 
};

// --- Helper Types/Data ---
type MockSupabase = ReturnType<typeof createClient>;
const mockUser = { id: 'user-123', email: 'test@example.com' };
const mockUserProfile = {
  user_id: 'user-123',
  first_name: 'Test',
  last_name: 'User',
  student_number: '1234567',
  program_id: 'prog-abc',
  target_average: 85,
  university_start_date: '2023-09-01',
  created_at: new Date('2023-01-15T10:00:00Z'),
};
const mockProgram = {
  id: 'prog-abc',
  program_name: 'Computer Science',
};

// --- Test Suite ---
describe('ProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mocks = getMocksForInstance();
    // Configure default behavior
    mocks.mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mocks.mockFrom.mockReturnValue({ select: mocks.mockSelect });
    mocks.mockSelect.mockReturnValue({ eq: mocks.mockEq });
    mocks.mockEq.mockReturnValue({ single: mocks.mockSingle });

    // Default resolved values (profile then program)
    mocks.mockSingle
      .mockResolvedValueOnce({ data: mockUserProfile, error: null }) 
      .mockResolvedValueOnce({ data: mockProgram, error: null });    
  });

  const renderPage = async (searchParams = {}) => {
    const Page = await ProfilePage({ searchParams });
    render(Page);
  };

  it('redirects to /sign-in if user is not authenticated', async () => {
    const mocks = getMocksForInstance();
    mocks.mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    await renderPage();
    await waitFor(() => expect(redirect).toHaveBeenCalledWith('/sign-in'));
  });

  it('redirects to /protected/profile-setup if user has no profile', async () => {
    const mocks = getMocksForInstance();
    mocks.mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mocks.mockSingle.mockResolvedValueOnce({ data: null, error: null }); 
    await renderPage();
    await waitFor(() => expect(redirect).toHaveBeenCalledWith('/protected/profile-setup'));
  });

  it('renders profile header and details when data is available', async () => {
    await renderPage(); // Uses beforeEach mocks
    expect(screen.getByTestId('user-profile-header-mock')).toBeInTheDocument();
    expect(screen.getByTestId('user-profile-details-mock')).toBeInTheDocument();
  });

  it('displays success message from searchParams', async () => {
    const successMsg = "Profile updated successfully!";
    await renderPage({ message: successMsg });
    expect(screen.getByText(successMsg)).toBeInTheDocument();
    expect(screen.getByText(successMsg)).toHaveClass('bg-green-100'); 
  });

  it('handles missing program information gracefully', async () => {
     const partialProfile = { ...mockUserProfile, target_average: null, university_start_date: null };
     const noProgram = null; 
     const mocks = getMocksForInstance();
     // Override mocks
     mocks.mockSingle
       .mockResolvedValueOnce({ data: partialProfile, error: null }) 
       .mockResolvedValueOnce({ data: noProgram, error: null });    

     await renderPage();
     expect(screen.getByTestId('user-profile-header-mock')).toBeInTheDocument();
     expect(screen.getByTestId('user-profile-details-mock')).toBeInTheDocument();
  });
}); 