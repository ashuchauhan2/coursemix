import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MdEmail, MdLocationOn, MdFeedback } from 'react-icons/md';
import { FaBug } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-900 dark:bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and Company Description */}
          <div className="flex flex-col items-center md:items-start">
            <Image 
              src="/CourseMixLogo.png" 
              alt="Course Mix Logo"
              width={150}
              height={50}
              className="mx-auto md:mx-0"
            />
            <p className="text-sm mt-3 text-center md:text-left">
              Empowering education through innovative course management solutions.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-center md:text-left">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about-us" className="hover:text-white dark:hover:text-gray-100 transition-colors duration-300 flex items-center justify-center md:justify-start">
                  <span className="hover:translate-x-1 transition-transform duration-300">About Us</span>
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-white dark:hover:text-gray-100 transition-colors duration-300 flex items-center justify-center md:justify-start">
                  <span className="hover:translate-x-1 transition-transform duration-300">Features</span>
                </Link>
              </li>
              <li>
                <Link href="/testimonials" className="hover:text-white dark:hover:text-gray-100 transition-colors duration-300 flex items-center justify-center md:justify-start">
                  <span className="hover:translate-x-1 transition-transform duration-300">Testimonials</span>
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white dark:hover:text-gray-100 transition-colors duration-300 flex items-center justify-center md:justify-start">
                  <span className="hover:translate-x-1 transition-transform duration-300">Contact</span>
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-white dark:hover:text-gray-100 transition-colors duration-300 flex items-center justify-center md:justify-start">
                  <span className="hover:translate-x-1 transition-transform duration-300">Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="hover:text-white dark:hover:text-gray-100 transition-colors duration-300 flex items-center justify-center md:justify-start">
                  <span className="hover:translate-x-1 transition-transform duration-300">Terms of Service</span>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact Information */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-center md:text-left">Contact Us</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-center md:justify-start gap-2">
                <MdEmail className="text-gray-400" />
                <a href="mailto:coursemixtroubleshoot@gmail.com" className="hover:text-white dark:hover:text-gray-100 transition-colors duration-300">coursemixtroubleshoot@gmail.com</a>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-2">
                <FaBug className="text-gray-400" />
                <Link href="/contact" className="hover:text-white dark:hover:text-gray-100 transition-colors duration-300">
                  <span className="hover:translate-x-1 transition-transform duration-300">Report a Bug</span>
                </Link>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-2">
                <MdFeedback className="text-gray-400" />
                <Link href="/contact" className="hover:text-white dark:hover:text-gray-100 transition-colors duration-300">
                  <span className="hover:translate-x-1 transition-transform duration-300">Send Feedback</span>
                </Link>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-2">
                <MdLocationOn className="text-gray-400" />
                <span>Brock University, St. Catharines, ON, Canada</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Copyright Bar */}
        <div className="border-t border-gray-800 dark:border-gray-800 mt-8 pt-6 text-sm text-center">
          <p>&copy; {new Date().getFullYear()} The Mixers. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 