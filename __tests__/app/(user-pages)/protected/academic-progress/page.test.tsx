import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AcademicProgressPage from '@/app/(user-pages)/protected/academic-progress/page';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { decryptGrade } from '@/utils/grade-utils';
import { getCurrentDateET, formatDate } from '@/utils/date-utils';
import { User } from '@supabase/supabase-js';

// --- Mocks ---
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn().mockImplementation(() => {
    // Define mocks inline for THIS instance
    const mockSingle = jest.fn();
    const mockEq = jest.fn(() => ({ single: mockSingle, order: mockOrder })); // Assumes mockOrder is defined below
    const mockOrder = jest.fn().mockReturnThis();
    const mockUpdateIn = jest.fn().mockResolvedValue({ error: null });
    const mockUpdate = jest.fn(() => ({ in: mockUpdateIn }));
    const mockSelect = jest.fn(() => ({ eq: mockEq, order: mockOrder }));
    const mockFrom = jest.fn((tableName: string) => {
      if (tableName === 'student_grades') {
        return { select: mockSelect, update: mockUpdate };
      }
      return { select: mockSelect };
    });
    const mockGetUser = jest.fn();

    // Return the mock client structure
    return {
      auth: { getUser: mockGetUser },
      from: mockFrom,
      // Expose mocks for configuration *on this instance*
      // Naming convention to avoid clashes with real methods
      _instanceMocks: { mockGetUser, mockSingle, mockEq, mockOrder, mockUpdateIn, mockUpdate, mockSelect, mockFrom }
    };
  })
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  useRouter: jest.fn(() => ({ refresh: jest.fn() })),
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>;
});

jest.mock('@/utils/grade-utils', () => ({
  decryptGrade: jest.fn((encryptedGrade, userId) => {
    // Simple mock: return the part before the first colon if encrypted, else return original
    if (typeof encryptedGrade === 'string' && encryptedGrade.includes(':')) {
      return encryptedGrade.split(':')[0]; // Simulate decryption (e.g., return IV part for testing)
    }
    return encryptedGrade; // Return as is if not mock-encrypted
  }),
  // Other utils used by children won't be needed as children are mocked
}));

jest.mock('@/utils/date-utils', () => ({
  getCurrentDateET: jest.fn(() => new Date('2024-04-08T10:00:00Z')), // Fixed date for consistent tests
  formatDate: jest.fn((date) => date ? new Date(date).toLocaleDateString('en-CA') : 'Invalid Date'),
}));

jest.mock('@/components/academic-progress/GradesList', 
  () => (props: any) => <div data-testid="grades-list-mock">GradesList Mock ({props.grades?.length} grades)</div>
);

jest.mock('@/components/academic-progress/CourseList', 
  () => (props: any) => <div data-testid="course-list-mock">CourseList Mock ({props.courses?.length} courses)</div>
);

jest.mock('sonner', () => ({
  Toaster: () => <div data-testid="toaster-mock">Toaster Mock</div>,
}));

// Mock child components
jest.mock('@/components/UserPages/Protected/AcademicProgress/RequirementsAccordion', () => ({
    __esModule: true,
    default: jest.fn(() => <div data-testid="requirements-accordion-mock">Requirements Accordion</div>),
}));
jest.mock('@/components/UserPages/Protected/AcademicProgress/WorkTermList', () => ({
    __esModule: true,
    default: jest.fn(() => <div data-testid="work-term-list-mock">Work Term List</div>),
}));
jest.mock('@/components/UserPages/Protected/AcademicProgress/OverallProgressCard', () => ({
    __esModule: true,
    default: jest.fn(() => <div data-testid="overall-progress-card-mock">Overall Progress</div>),
}));

// Helper to get the mock instance's functions
const getMocksForInstance = () => {
  const { createClient } = jest.requireActual('@/utils/supabase/server');
  const instance = createClient(); // Gets the object returned by the mockImplementation
  return instance._instanceMocks; 
};

// --- Helper Data ---
const mockUser = { id: 'user-123', email: 'test@example.com' };
const mockUserProfile = { user_id: 'user-123', program_id: 'prog-cs' };
const mockUserProfileNoProgram = { user_id: 'user-123', program_id: null };
const mockProgramInfo = { id: 'prog-cs', program_name: 'Comp Sci', coop_program: false, total_credits: 40 };
const mockProgramRequirements = [
  { id: 'req-1', course_code: 'COSC 1P01', program_id: 'prog-cs', year: 1 }, 
  { id: 'req-2', course_code: 'COSC 1P02', program_id: 'prog-cs', year: 1 }
];
const mockGrades = [
  { id: 'g1', user_id: 'user-123', course_code: 'COSC 1P01', grade: 'encrypted:data1', term: 'FALL', year: 2023, status: 'completed' },
  { id: 'g2', user_id: 'user-123', course_code: 'COSC 1P02', grade: 'encrypted:data2', term: 'FALL', year: 2023, status: 'in-progress' },
  { id: 'g3', user_id: 'user-123', course_code: 'MATH 1P01', grade: '75', term: 'FALL', year: 2023, status: 'completed' }, // Unencrypted grade
];

// --- Test Suite ---
describe('AcademicProgressPage', () => {
  // Use imported mock references
  const mockDecryptGrade = decryptGrade as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks(); // Clears calls/instances, but mock Implementation remains
    // Get the *current* mock functions for configuration
    const mocks = getMocksForInstance(); 
    
    // Default: Authenticated user
    mocks.mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    // Configure mock chain behavior
    mocks.mockEq.mockReturnValue({ single: mocks.mockSingle, order: mocks.mockOrder }); 
    mocks.mockOrder.mockReturnThis(); 

    // Configure default resolved values based on expected calls
    mocks.mockSingle
      .mockResolvedValueOnce({ data: mockUserProfile, error: null }) // profile
      .mockResolvedValueOnce({ data: mockProgramInfo, error: null }); // program
    mocks.mockOrder // grades fetch
      .mockResolvedValueOnce({ data: mockGrades, error: null });
    mocks.mockEq // requirements fetch
      .mockResolvedValueOnce({ data: mockProgramRequirements, error: null });
    mocks.mockOrder // work_terms fetch
      .mockResolvedValueOnce({ data: [], error: null }); 
    
    // Reset decrypt grade mock
    (decryptGrade as jest.Mock).mockImplementation((encryptedGrade, userId) => {
        if (typeof encryptedGrade === 'string' && encryptedGrade.includes(':')) {
          return encryptedGrade.split(':')[0]; 
        }
        return encryptedGrade;
    });
  });

  const renderPage = async () => {
    // Re-configure necessary mocks JUST before render if state needs resetting
    // For many tests, the beforeEach setup might be sufficient.
    const Page = await AcademicProgressPage();
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
    // Configure only profile check chain
    mocks.mockEq.mockReturnValueOnce({ single: mocks.mockSingle });
    mocks.mockSingle.mockResolvedValueOnce({ data: null, error: null }); // No profile

    await renderPage();
    await waitFor(() => expect(redirect).toHaveBeenCalledWith('/protected/profile-setup'));
  });

  it('renders all child components when data is available', async () => {
    await renderPage(); // Uses mocks from beforeEach
    expect(screen.getByTestId('overall-progress-card-mock')).toBeInTheDocument();
    expect(screen.getByTestId('requirements-accordion-mock')).toBeInTheDocument();
    expect(screen.getByTestId('work-term-list-mock')).toBeInTheDocument();
  });

  it('shows "No Program Selected" message if profile has no program_id', async () => {
    const mocks = getMocksForInstance(); 
    mocks.mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    // Configure chain for profile -> grades
    mocks.mockEq.mockReturnValueOnce({ single: mocks.mockSingle }); // For profile
    mocks.mockSingle.mockResolvedValueOnce({ data: mockUserProfileNoProgram, error: null }); 
    mocks.mockEq.mockReturnValueOnce({ order: mocks.mockOrder }); // For grades
    mocks.mockOrder.mockResolvedValueOnce({ data: mockGrades, error: null }); 

    await renderPage();
    expect(screen.getByRole('heading', { name: /No Program Selected/i })).toBeInTheDocument();
    expect(screen.getByText(/Please select your program in your profile/i)).toBeInTheDocument();
    // Ensure main content sections are not rendered
    expect(screen.queryByTestId('overall-progress-card-mock')).not.toBeInTheDocument();
    expect(screen.queryByTestId('requirements-accordion-mock')).not.toBeInTheDocument();
    expect(screen.queryByTestId('work-term-list-mock')).not.toBeInTheDocument();
  });

  it('shows "Program Selected, No Requirements" message if requirements fetch returns empty/null', async () => {
    const mocks = getMocksForInstance(); 
    mocks.mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    // Reconfigure chain endings
    mocks.mockEq.mockReturnValue({ single: mocks.mockSingle, order: mocks.mockOrder }); 
    mocks.mockOrder.mockReturnThis(); 
    mocks.mockSingle
      .mockResolvedValueOnce({ data: mockUserProfile, error: null }) // profile
      .mockResolvedValueOnce({ data: mockProgramInfo, error: null }); // program
    mocks.mockOrder.mockResolvedValueOnce({ data: mockGrades, error: null }); // grades fetch
    mocks.mockEq.mockResolvedValueOnce({ data: [], error: null }); // NO requirements
    mocks.mockOrder.mockResolvedValueOnce({ data: [], error: null }); // work_terms fetch

    await renderPage();
    expect(screen.getByRole('heading', { name: /Program Selected/i })).toBeInTheDocument();
    expect(screen.getByText(/No program requirements found/i)).toBeInTheDocument();
    // Overall progress and work terms might still render, but requirements accordion should not
    expect(screen.getByTestId('overall-progress-card-mock')).toBeInTheDocument();
    expect(screen.queryByTestId('requirements-accordion-mock')).not.toBeInTheDocument();
    expect(screen.getByTestId('work-term-list-mock')).toBeInTheDocument();
  });

  it('calls Supabase update when auto-updating grade status from in-progress to completed', async () => {
    const gradeToUpdate = {
       id: 'g-update', user_id: 'user-123', course_code: 'COSC 2P01', 
       grade: '88', // Decrypt mock will return '88'
       term: 'WINTER', year: 2024, status: 'in-progress' // Status mismatch
    };
    const initialGrades = [...mockGrades, gradeToUpdate];
    const mocks = getMocksForInstance(); 
    mocks.mockGetUser.mockResolvedValue({ data: { user: mockUser } });

    // Configure chain endings
    mocks.mockEq.mockReturnValue({ single: mocks.mockSingle, order: mocks.mockOrder }); 
    mocks.mockOrder.mockReturnThis(); 
    mocks.mockSingle
      .mockResolvedValueOnce({ data: mockUserProfile, error: null }) // profile
      .mockResolvedValueOnce({ data: mockProgramInfo, error: null }); // program
    mocks.mockOrder.mockResolvedValueOnce({ data: initialGrades, error: null }); // grades fetch
    mocks.mockEq.mockResolvedValueOnce({ data: mockProgramRequirements, error: null }); // requirements fetch
    mocks.mockOrder.mockResolvedValueOnce({ data: [], error: null }); // work_terms fetch

    // Configure update chain
    mocks.mockUpdate.mockReturnValue({ in: mocks.mockUpdateIn }); 

    (decryptGrade as jest.Mock).mockImplementation((encryptedGrade, userId) => {
       if (encryptedGrade === '88') return '88'; 
       if (typeof encryptedGrade === 'string' && encryptedGrade.includes(':')) return encryptedGrade.split(':')[0];
       return encryptedGrade;
    });

    await renderPage();

    expect(mocks.mockFrom).toHaveBeenCalledWith('student_grades');
    expect(mocks.mockUpdate).toHaveBeenCalledTimes(1);
    expect(mocks.mockUpdateIn).toHaveBeenCalledWith('id', [gradeToUpdate.id]); 
  });
}); 