# Test Documentation for CourseMix

This directory contains tests for the CourseMix application. The tests are organized by feature/component and are designed to ensure that the application functions correctly and meets accessibility standards.

## Setup

Tests are built using:

- Jest: Main testing framework
- React Testing Library: For testing React components
- jest-axe: For accessibility testing

To run the tests:

```bash
# Run all tests
npm test

# Run tests in watch mode (recommended during development)
npm run test:watch

# Run specific test file
npm test -- path/to/test-file.test.tsx
```

## Auth Pages Tests

### Sign-Up Tests

Located in `__tests__/app/auth-pages/sign-up/`:

#### `page.test.tsx`

Component tests for the sign-up page that verify:

- Proper rendering of form elements
- Validation of email input (empty, non-Brock University emails)
- Form submission behavior with valid Brock University email
- Error handling for API responses
- Loading state during form submission
- Navigation to sign-in page

#### `api.test.ts`

API integration tests that verify:

- Successful verification email sending for valid Brock University emails
- Rejection of non-Brock University emails
- Handling of already registered emails
- Server error handling
- Network error handling

#### `accessibility.test.tsx`

Accessibility tests that verify:

- No accessibility violations using jest-axe
- Properly labeled form controls
- Appropriate heading structure
- Proper ARIA roles
- Use of semantic HTML elements

## Test Coverage

The tests cover the following aspects of the sign-up functionality:

| Feature         | Type            | Coverage    |
| --------------- | --------------- | ----------- |
| UI Rendering    | Component       | ✅ Complete |
| Form Validation | Component       | ✅ Complete |
| API Integration | Integration     | ✅ Complete |
| Error Handling  | Component & API | ✅ Complete |
| Accessibility   | Accessibility   | ✅ Complete |

## Test Data

The tests use the following test data:

### Valid Inputs

- Brock University email: `student@brocku.ca`, `student123@brocku.ca`

### Invalid Inputs

- Non-Brock email: `test@example.com`, `student@gmail.com`
- Empty email: `""`
- Already registered email: `existing.user@brocku.ca`

## API Mocking

The tests mock API responses to simulate different scenarios. The API endpoints tested include:

- `POST /api/auth/send-verification`: For sending verification emails

## Notes for Future Testing

When adding new features to the sign-up flow, consider the following:

- Add tests for new validation rules
- Update API tests if endpoints change
- Ensure accessibility is maintained for any UI changes
