'use client';

import React, { useState } from 'react';
import { FaLinkedin } from "react-icons/fa";


// Metadata should be in a separate file for client components
// This is just for reference; the actual metadata is defined in a separate file or the layout file
// export const metadata = {
//   title: 'Contact Us | CourseMix',
//   description: 'Get in touch with the CourseMix team',
// };

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState({
    submitting: false,
    submitted: false,
    success: false,
    error: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ submitting: true, submitted: false, success: false, error: '' });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      // Reset form on success
      setFormData({ name: '', email: '', subject: '', message: '' });
      setStatus({
        submitting: false,
        submitted: true,
        success: true,
        error: '',
      });
    } catch (error) {
      setStatus({
        submitting: false,
        submitted: true,
        success: false,
        error: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Contact Us</h1>
        <p className="text-gray-600 dark:text-gray-300">
          We'd love to hear from you! Whether you have a question, feedback, or just want to say hello,
          feel free to reach out using the form below or through our other contact channels.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {status.submitted && status.success && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md text-green-700 dark:text-green-300 mb-4">
              Thank you for your message! We'll get back to you soon.
            </div>
          )}
          
          {status.submitted && !status.success && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300 mb-4">
              {status.error}
            </div>
          )}
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-teal-500 focus:border-teal-500 dark:focus:ring-teal-400 dark:focus:border-teal-400"
                placeholder="Your name"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-teal-500 focus:border-teal-500 dark:focus:ring-teal-400 dark:focus:border-teal-400"
                placeholder="you@example.com"
              />
            </div>
            
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-teal-500 focus:border-teal-500 dark:focus:ring-teal-400 dark:focus:border-teal-400"
                placeholder="What is this regarding?"
              />
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                value={formData.message}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-teal-500 focus:border-teal-500 dark:focus:ring-teal-400 dark:focus:border-teal-400"
                placeholder="Your message here..."
              ></textarea>
            </div>
            
            <button
              type="submit"
              disabled={status.submitting}
              className={`w-full bg-teal-600 dark:bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-700 dark:hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors ${
                status.submitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {status.submitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
          
          <p className="text-sm text-gray-500 dark:text-gray-400">
            We'll never share your email with anyone else.
          </p>
        </div>
        
        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Other Ways to Reach Us</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-200">Email</h4>
                <a href="mailto:coursemixtroubleshoot@gmail.com" className="text-teal-600 dark:text-teal-400 hover:underline">
                  coursemixtroubleshoot@gmail.com
                </a>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-200">Social Media</h4>
                <div className="flex space-x-4 mt-2">
                  
                  <a href="https://www.instagram.com/course_mix/" className="text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                  <a href="https://x.com/CourseMix_" className="text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"
                      />
                    </svg>
                  </a>
                  <a href="https://www.linkedin.com/in/course-mix-8049a1357/" className="text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400">
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <FaLinkedin />
                    </svg>
                  </a>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-200">Office Hours</h4>
                <p className="text-gray-600 dark:text-gray-300">Monday - Friday: 9:00 AM - 5:00 PM</p>
                <p className="text-gray-600 dark:text-gray-300">Saturday - Sunday: Closed</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-200">How do I reset my password?</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  You can reset your password by clicking "Forgot Password" on the login page.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-200">Is CourseMix affiliated with Brock University?</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  CourseMix is an independent platform created by Brock students to help their peers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 