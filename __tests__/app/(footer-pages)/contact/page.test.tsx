import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContactPage from '@/app/(footer-pages)/contact/page';

// Mock fetch
global.fetch = jest.fn();

describe('ContactPage', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    (global.fetch as jest.Mock).mockClear();
    render(<ContactPage />);
  });

  it('renders the main heading and description', () => {
    expect(screen.getByRole('heading', { name: /Contact Us/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/We'd love to hear from you!/i)).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Message/i })).toBeInTheDocument();
  });

  it('renders contact details (email, social links)', () => {
    expect(screen.getByText('coursemixtroubleshoot@gmail.com')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /coursemixtroubleshoot@gmail.com/i })).toHaveAttribute('href', 'mailto:coursemixtroubleshoot@gmail.com');

    // Get all links and check for specific hrefs
    const allLinks = screen.getAllByRole('link');
    const instagramLink = allLinks.find(link => link.getAttribute('href') === 'https://www.instagram.com/course_mix/');
    const twitterLink = allLinks.find(link => link.getAttribute('href') === 'https://x.com/CourseMix_');

    expect(instagramLink).toBeInTheDocument();
    expect(twitterLink).toBeInTheDocument();

    // Check other info
    expect(screen.getByText(/Monday - Friday: 9:00 AM - 5:00 PM/i)).toBeInTheDocument();
  });

  it('renders FAQs', () => {
    expect(screen.getByRole('heading', { name: /Frequently Asked Questions/i })).toBeInTheDocument();
    expect(screen.getByText(/How do I reset my password\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Is CourseMix affiliated with Brock University\?/i)).toBeInTheDocument();
  });

  it('allows typing into form fields', () => {
    const nameInput = screen.getByLabelText(/Full Name/i);
    const emailInput = screen.getByLabelText(/Email Address/i);
    const subjectInput = screen.getByLabelText(/Subject/i);
    const messageInput = screen.getByLabelText(/Message/i);

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
    fireEvent.change(messageInput, { target: { value: 'Test message content.' } });

    expect(nameInput).toHaveValue('Test User');
    expect(emailInput).toHaveValue('test@example.com');
    expect(subjectInput).toHaveValue('Test Subject');
    expect(messageInput).toHaveValue('Test message content.');
  });

  it('shows success message after successful form submission', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Success' }),
    });

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Subject/i), { target: { value: 'Test Subject' } });
    fireEvent.change(screen.getByLabelText(/Message/i), { target: { value: 'Test message content.' } });

    const submitButton = screen.getByRole('button', { name: /Send Message/i });
    fireEvent.click(submitButton);

    // Wait for the success message to appear
    await waitFor(() => {
      expect(screen.getByText(/Thank you for your message!/i)).toBeInTheDocument();
    });

    // Check if form fields are reset
    expect(screen.getByLabelText(/Full Name/i)).toHaveValue('');
    expect(screen.getByLabelText(/Email Address/i)).toHaveValue('');
    expect(screen.getByLabelText(/Subject/i)).toHaveValue('');
    expect(screen.getByLabelText(/Message/i)).toHaveValue('');
  });

  it('shows error message after failed form submission', async () => {
    const errorMessage = 'Failed to send message.';
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: errorMessage }),
    });

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'fail@example.com' } });
    fireEvent.change(screen.getByLabelText(/Subject/i), { target: { value: 'Failure Test' } });
    fireEvent.change(screen.getByLabelText(/Message/i), { target: { value: 'This should fail.' } });

    const submitButton = screen.getByRole('button', { name: /Send Message/i });
    fireEvent.click(submitButton);

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Ensure form fields are NOT reset
    expect(screen.getByLabelText(/Full Name/i)).toHaveValue('Test User');
    expect(screen.getByLabelText(/Email Address/i)).toHaveValue('fail@example.com');
  });
}); 