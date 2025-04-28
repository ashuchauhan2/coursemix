import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfileSetupPage from '@/app/(user-pages)/protected/profile-setup/page';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { User } from '@supabase/supabase-js';

// --- Mocks ---
// Define variables to hold mock function references
let mockGetUser: jest.Mock;
let mockSingle: jest.Mock;
let mockEq: jest.Mock;
let mockOrder: jest.Mock;
let mockSelect: jest.Mock;
let mockFrom: jest.Mock;

jest.mock('@/utils/supabase/server', () => {
  // Define ALL mock functions INSIDE the factory
  mockGetUser = jest.fn();
  mockSingle = jest.fn();
  mockEq = jest.fn(() => ({ single: mockSingle }));
  mockOrder = jest.fn().mockReturnThis(); 
  mockSelect = jest.fn(() => ({ eq: mockEq, order: mockOrder }));
  mockFrom = jest.fn(() => ({ select: mockSelect }));

  const internalMockClient = {
    auth: { getUser: mockGetUser }, 
    from: mockFrom,
  };

  // Return the mocked createClient AND the references to the inner mocks
  return {
    createClient: jest.fn().mockReturnValue(internalMockClient),
    // Expose the functions directly for configuration in tests
    _mocks: { mockGetUser, mockSingle, mockEq, mockOrder, mockSelect, mockFrom },
  };
});

jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({ push: jest.fn() }),
  redirect: jest.fn(),
}));

// Mock the ProfileSetupForm component
jest.mock('@/components/UserPages/Protected/ProfileSetup/ProfileSetupForm', () => {
  return {
    __esModule: true,
    default: jest.fn(({ programs }) => (
      <div data-testid="profile-setup-form-mock">
        ProfileSetupForm Mock (Programs: {programs?.length ?? 0})
      </div>
    )),
  };
});

// Define the expected type structure for the exported mocks
interface SupabaseServerMockRefs {
  mockGetUser: jest.Mock;
  mockSingle: jest.Mock;
  mockEq: jest.Mock;
  mockOrder: jest.Mock;
  mockSelect: jest.Mock;
  mockFrom: jest.Mock;
}

// Get the mock references ONCE using requireActual and apply the type
const supabaseServerMocks = jest.requireActual<{ _mocks: SupabaseServerMockRefs }>('@/utils/supabase/server')._mocks;

// Define the type for the local `mocks` object and initialize it
const mocks: SupabaseServerMockRefs = {
    mockGetUser: supabaseServerMocks.mockGetUser,
    mockSingle: supabaseServerMocks.mockSingle,
    mockEq: supabaseServerMocks.mockEq,
    mockOrder: supabaseServerMocks.mockOrder,
    mockSelect: supabaseServerMocks.mockSelect,
    mockFrom: supabaseServerMocks.mockFrom,
};

// --- Helper Data ---
const mockUser = { id: 'user-setup-1', email: 'setup@example.com' };
const mockUserProfileExistingComplete = { user_id: 'user-setup-1', is_profile_setup: true };
const mockUserProfileExistingIncomplete = { user_id: 'user-setup-1', is_profile_setup: false };
const mockPrograms = [
  { id: 1, program_name: 'Astrophysics' },
  { id: 2, program_name: 'Basket Weaving' },
];

// --- Test Suite ---
describe('ProfileSetupPage', () => {
  // Use the imported mock references directly

  beforeEach(() => {
    jest.clearAllMocks();
    // Configure default behavior using the direct mock references
    mocks.mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mocks.mockFrom.mockReturnValue({ select: mocks.mockSelect });
    mocks.mockSelect.mockReturnValue({ eq: mocks.mockEq, order: mocks.mockOrder });
    mocks.mockEq.mockReturnValue({ single: mocks.mockSingle });

    // Default resolved values (profile null, programs fetched)
    mocks.mockSingle.mockResolvedValueOnce({ data: null, error: null });
    mocks.mockOrder.mockResolvedValueOnce({ data: mockPrograms, error: null });
  });

  const renderPage = async (searchParams = {}) => {
    // No need to get client or configure mocks here anymore
    const Page = await ProfileSetupPage({ searchParams });
    render(Page);
  };

  it('redirects to /sign-in if user is not authenticated', async () => {
    // Override before render
    mocks.mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    await renderPage();
    await waitFor(() => expect(redirect).toHaveBeenCalledWith('/sign-in'));
  });

  it('redirects to /protected/dashboard if profile setup is already complete', async () => {
    // Override before render
    mocks.mockSingle.mockResolvedValueOnce({ data: mockUserProfileExistingComplete, error: null }); 
    mocks.mockOrder.mockResolvedValueOnce({ data: mockPrograms, error: null }); // Ensure programs still mocked

    await renderPage();
    await waitFor(() => expect(redirect).toHaveBeenCalledWith('/protected/dashboard'));
  });

  it('renders the profile setup form if setup is not complete', async () => {
    // Override before render
    mocks.mockSingle.mockResolvedValueOnce({ data: mockUserProfileExistingIncomplete, error: null }); 
    mocks.mockOrder.mockResolvedValueOnce({ data: mockPrograms, error: null }); 

    await renderPage();
    expect(screen.getByRole('heading', { name: /Complete Your Profile/i })).toBeInTheDocument();
    // Check that the mocked form is rendered
    expect(screen.getByTestId('profile-setup-form-mock')).toBeInTheDocument();
    expect(screen.getByTestId('profile-setup-form-mock')).toHaveTextContent(`Programs: ${mockPrograms.length}`);
  });

  it('populates the program dropdown correctly', async () => {
    await renderPage();
    expect(screen.getByRole('option', { name: /Select a program/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: mockPrograms[0].program_name })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: mockPrograms[1].program_name })).toBeInTheDocument();
  });

  it('displays error message from searchParams', async () => {
    const errorMessage = "Something went wrong!";
    await renderPage({ message: errorMessage });
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    // Check for specific error styling if needed
    expect(screen.getByText(errorMessage)).toHaveClass('bg-red-100'); 
  });

  // Note: Testing the server action 'createProfile' itself is complex here.
  // We've tested the page component correctly renders and fetches initial data.
  // To test the action, you might mock the action import or use integration tests.
}); 