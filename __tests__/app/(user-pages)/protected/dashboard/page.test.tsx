import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardPage from '@/app/(user-pages)/protected/dashboard/page';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getCurrentTerm, getCurrentDateET, toEasternTime } from '@/utils/date-utils';
import { decryptGrade } from '@/utils/grade-utils';
import { User } from '@supabase/supabase-js';

// --- Mocks ---
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn().mockImplementation(() => {
    // Define mocks inline for THIS instance
    const mockSingle = jest.fn();
    const mockEq = jest.fn(() => ({ single: mockSingle }));
    const mockSelect = jest.fn(() => ({ eq: mockEq }));
    const mockFrom = jest.fn(() => ({ select: mockSelect }));
    const mockGetUser = jest.fn();

    // Return the mock client structure
    return {
      auth: { getUser: mockGetUser },
      from: mockFrom,
      // Expose mocks for configuration *on this instance*
      _instanceMocks: { mockGetUser, mockSingle, mockEq, mockSelect, mockFrom }
    };
  })
}));

jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('@/components/UserPages/Protected/Dashboard/Greeting', () => () => <div data-testid="greeting-mock">Greeting Mock</div>);
jest.mock('@/components/UserPages/Protected/Dashboard/Notifications', () => () => <div data-testid="notifications-mock">Notifications Mock</div>);
jest.mock('@/components/UserPages/Protected/Dashboard/QuickLinks', () => () => <div data-testid="quicklinks-mock">QuickLinks Mock</div>);

// Helper to get the mock instance's functions
const getMocksForInstance = () => {
  // Use jest.requireMock to avoid type errors if original doesn't export _instanceMocks
  const { createClient } = jest.requireMock('@/utils/supabase/server');
  const instance = createClient();
  // Type assertion is okay here as we know our mock structure
  return instance._instanceMocks as {
    mockGetUser: jest.Mock;
    mockSingle: jest.Mock;
    mockEq: jest.Mock;
    mockSelect: jest.Mock;
    mockFrom: jest.Mock;
  };
};

// --- Test Data ---
// Fix: Provide required User properties
const mockUser: User = {
  id: 'test-user-id',
  app_metadata: { provider: 'email' },
  user_metadata: { name: 'Test User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};
// Keep existing profile data structure
const mockUserProfile = {
  user_id: 'test-user-id',
  first_name: 'Test',
  last_name: 'User',
  email: 'test@example.com',
  // Add other necessary profile fields based on component usage
};
// --- End Test Data ---

// --- Test Suite ---
describe('DashboardPage', () => {
  // Get redirect mock reference correctly
  const { redirect } = jest.requireMock('next/navigation');

  beforeEach(() => {
    jest.clearAllMocks();
    // Use the helper to get mocks for this test run
    const mocks = getMocksForInstance();
    // Default: Authenticated user with profile
    mocks.mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    // Mock the chain for fetching user profile
    mocks.mockFrom.mockReturnValue({ select: mocks.mockSelect }); // Simulates from('user_profiles')
    mocks.mockSelect.mockReturnValue({ eq: mocks.mockEq });       // Simulates .select('*')
    mocks.mockEq.mockReturnValue({ single: mocks.mockSingle });    // Simulates .eq('user_id', ...)
    mocks.mockSingle.mockResolvedValue({ data: mockUserProfile, error: null }); // Simulates .single() result
  });

  const renderPage = async () => {
    // Re-render requires awaiting the Server Component
    const Page = await DashboardPage();
    render(Page);
  };

  it('redirects to /sign-in if user is not authenticated', async () => {
    // Arrange: Override default mock for this specific test
    const mocks = getMocksForInstance();
    mocks.mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    // Act
    await renderPage();

    // Assert
    // Use await waitFor because redirect happens asynchronously after component render
    await waitFor(() => {
      expect(redirect).toHaveBeenCalledWith('/sign-in');
    });
  });

  it('redirects to /protected/profile-setup if user has no profile', async () => {
    // Arrange: Override default mock for profile fetch
    const mocks = getMocksForInstance();
    mocks.mockSingle.mockResolvedValueOnce({ data: null, error: null }); // Simulate profile not found

    // Act
    await renderPage();

    // Assert
    await waitFor(() => {
      expect(redirect).toHaveBeenCalledWith('/protected/profile-setup');
    });
     // Ensure profile fetch was attempted
     expect(mocks.mockFrom).toHaveBeenCalledWith('user_profiles');
     expect(mocks.mockSelect).toHaveBeenCalledWith('*');
     expect(mocks.mockEq).toHaveBeenCalledWith('user_id', mockUser.id);
     expect(mocks.mockSingle).toHaveBeenCalledTimes(1);
  });

  it('renders dashboard components when authenticated and profile exists', async () => {
    // Arrange: Default beforeEach setup is sufficient

    // Act
    await renderPage();

    // Assert: Check if child components are rendered
    expect(screen.getByTestId('greeting-mock')).toBeInTheDocument();
    expect(screen.getByTestId('notifications-mock')).toBeInTheDocument();
    expect(screen.getByTestId('quicklinks-mock')).toBeInTheDocument();

    // Assert: Verify profile data fetch occurred as expected
    const mocks = getMocksForInstance();
    expect(mocks.mockGetUser).toHaveBeenCalledTimes(1); // Called once by the page
    expect(mocks.mockFrom).toHaveBeenCalledWith('user_profiles');
    expect(mocks.mockSelect).toHaveBeenCalledWith('*');
    expect(mocks.mockEq).toHaveBeenCalledWith('user_id', mockUser.id);
    expect(mocks.mockSingle).toHaveBeenCalledTimes(1); // Called once to fetch profile
  });

  // Add more tests as needed for specific dashboard interactions or data scenarios
}); 