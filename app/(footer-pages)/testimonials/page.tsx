import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'Testimonials | CourseMix',
  description: 'What Brock University students are saying about CourseMix',
};

// Testimonial type definition
type Testimonial = {
  id: number;
  name: string;
  role: string;
  quote: string;
  program: string;
  year: string;
};

export default function TestimonialsPage() {
  // Sample testimonials data
  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Jordan Lee",
      role: "Student",
      quote: "CourseMix completely transformed my course registration experience. I used to spend hours trying to create a conflict-free schedule, but now I can generate the perfect timetable in minutes. The course insights helped me choose professors with teaching styles that match how I learn.",
      program: "Computer Science",
      year: "3rd Year"
    },
    {
      id: 2,
      name: "Taylor Smith",
      role: "Student",
      quote: "As a double major, planning my courses was always a nightmare until I found CourseMix. The platform makes it easy to see how different courses fit together and ensures I'm meeting requirements for both programs. It's been a game-changer for my academic planning.",
      program: "Psychology & Business",
      year: "4th Year"
    },
    {
      id: 3,
      name: "Alex Rivera",
      role: "Student",
      quote: "The community feedback feature on CourseMix is incredible. Reading honest reviews from other students helped me avoid courses that wouldn't have been a good fit for me. I've also used their grade calculator consistently throughout the semester to stay on top of my academic goals.",
      program: "Biology",
      year: "2nd Year"
    },
    {
      id: 4,
      name: "Morgan Wilson",
      role: "Student",
      quote: "I transferred to Brock mid-program and was worried about how my credits would transfer. CourseMix helped me visualize my remaining requirements and plan my path to graduation. The interface is intuitive and user-friendly, even for someone new to the university.",
      program: "Media & Communication",
      year: "3rd Year"
    },
    {
      id: 5,
      name: "Jamie Patel",
      role: "Student",
      quote: "The prerequisite tracking alone is worth using CourseMix for. I no longer have to constantly cross-reference the academic calendar - the system alerts me if I'm missing a prerequisite or if I'm taking courses in the wrong order. It's like having a personal academic advisor available 24/7.",
      program: "Accounting",
      year: "4th Year"
    },
    {
      id: 6,
      name: "Casey Johnson",
      role: "Student",
      quote: "As someone who works part-time, finding a course schedule that fits around my work commitments was always challenging. CourseMix lets me input my work hours as constraints and generates schedules that accommodate my work life while keeping me on track academically.",
      program: "Kinesiology",
      year: "2nd Year"
    },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Student Testimonials</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Don't just take our word for it. Here's what Brock University students have to say about their
          experience with CourseMix.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {testimonials.map((testimonial) => (
          <div key={testimonial.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 shadow-sm dark:shadow-gray-900/30 dark:border dark:border-gray-700">
            <div className="flex flex-col h-full">
              <div className="mb-4">
                <svg className="h-8 w-8 text-teal-500 dark:text-teal-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>
              <div className="flex-grow">
                <p className="text-gray-600 dark:text-gray-300 italic mb-6">{testimonial.quote}</p>
              </div>
              <div className="flex items-center mt-4">
                <div className="ml-4">
                  <h3 className="font-medium text-gray-800 dark:text-gray-100">{testimonial.name}</h3>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{testimonial.program}, {testimonial.year}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-8 text-center border border-teal-100 dark:border-teal-800">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Join Our Community</h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
          Experience the benefits of CourseMix that thousands of Brock students are already enjoying.
          Optimize your course planning, make informed academic decisions, and simplify your student life.
        </p>
        <Link href="/sign-up">
          <button className="bg-teal-600 dark:bg-teal-500 text-white px-6 py-3 rounded-md hover:bg-teal-700 dark:hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors">
            Create Your Free Account
          </button>
        </Link>
      </div>

      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Share Your Experience</h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Are you a CourseMix user with a story to share? We'd love to hear about your experience!
          Contact us at <a href="mailto:coursemixtroubleshoot@gmail.com" className="text-teal-600 dark:text-teal-400 hover:underline">coursemixtroubleshoot@gmail.com</a>
        </p>
      </div>
    </div>
  );
} 