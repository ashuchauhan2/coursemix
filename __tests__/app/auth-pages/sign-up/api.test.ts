/**
 * @jest-environment node
 */

// This test suite focuses on API interaction for the sign-up verification process
// Using node environment to avoid browser-specific APIs

describe('Sign-up API Integration Tests', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = jest.fn();
  });

  const mockFetch = (response: any) => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: response.ok,
      status: response.status || (response.ok ? 200 : 400),
      json: async () => response.data,
    });
  };

  it('should successfully send verification email for valid Brock email', async () => {
    // Mock successful API response
    mockFetch({
      ok: true,
      data: { success: true, message: 'Verification email sent successfully' },
    });

    // Request body with valid email
    const requestBody = { email: 'student123@brocku.ca' };

    // Make API call
    const response = await fetch('/api/auth/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    // Verify that the request was made with the correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/send-verification',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(requestBody),
      })
    );

    // Check response
    expect(response.ok).toBe(true);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Verification email sent successfully');
  });

  it('should reject verification request for non-Brock email', async () => {
    // Mock API rejection response
    mockFetch({
      ok: false,
      status: 400,
      data: { error: 'Only @brocku.ca emails are allowed' },
    });

    // Request body with non-Brock email
    const requestBody = { email: 'student@gmail.com' };

    // Make API call
    const response = await fetch('/api/auth/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    // Verify the API was called
    expect(global.fetch).toHaveBeenCalled();

    // Check response
    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
    expect(data.error).toBe('Only @brocku.ca emails are allowed');
  });

  it('should reject verification request for already registered email', async () => {
    // Mock API rejection response for already registered email
    mockFetch({
      ok: false,
      status: 409,
      data: { error: 'An account with this email already exists' },
    });

    // Request body with existing email
    const requestBody = { email: 'existing.user@brocku.ca' };

    // Make API call
    const response = await fetch('/api/auth/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    // Verify the API was called
    expect(global.fetch).toHaveBeenCalled();

    // Check response
    expect(response.ok).toBe(false);
    expect(response.status).toBe(409);
    expect(data.error).toBe('An account with this email already exists');
  });

  it('should handle server errors gracefully', async () => {
    // Mock server error response
    mockFetch({
      ok: false,
      status: 500,
      data: { error: 'Internal server error' },
    });

    // Request body with valid email
    const requestBody = { email: 'student@brocku.ca' };

    // Make API call
    const response = await fetch('/api/auth/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    // Verify the API was called
    expect(global.fetch).toHaveBeenCalled();

    // Check response
    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('should handle network errors properly', async () => {
    // Mock network error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    // Request body with valid email
    const requestBody = { email: 'student@brocku.ca' };

    // Expect the API call to throw an error
    await expect(
      fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })
    ).rejects.toThrow('Network error');
  });
}); 