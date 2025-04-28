import React from 'react';

export const metadata = {
  title: 'Terms of Service | CourseMix',
  description: 'Terms and conditions for using the CourseMix platform',
};

export default function TermsOfServicePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Terms of Service</h1>
      <p className="text-gray-600 dark:text-gray-300">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">1. Acceptance of Terms</h2>
        <p className="text-gray-600 dark:text-gray-300">
          By accessing or using CourseMix, you agree to be bound by these Terms of Service and all applicable laws and regulations. 
          If you do not agree with any of these terms, you are prohibited from using this service.
        </p>
      </section>
      
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">2. Use of Service</h2>
        <p className="text-gray-600 dark:text-gray-300">
          CourseMix provides a platform for Brock University students to plan their courses and academic journey. 
          You agree to use this service only for lawful purposes and in accordance with these Terms.
        </p>
      </section>
      
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">3. User Accounts</h2>
        <p className="text-gray-600 dark:text-gray-300">
          When you create an account with us, you must provide accurate and complete information. 
          You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
        </p>
      </section>
      
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">4. User Content</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Users may post reviews, comments, and other content as long as it is not illegal, obscene, threatening, defamatory, 
          invasive of privacy, infringing on intellectual property rights, or otherwise injurious to third parties.
        </p>
      </section>
      
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">5. Limitation of Liability</h2>
        <p className="text-gray-600 dark:text-gray-300">
          CourseMix and its team shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from 
          your use of or inability to use the service.
        </p>
      </section>
      
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">6. Modifications to Service</h2>
        <p className="text-gray-600 dark:text-gray-300">
          CourseMix reserves the right to modify or discontinue, temporarily or permanently, the service with or without notice.
        </p>
      </section>
      
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">7. Governing Law</h2>
        <p className="text-gray-600 dark:text-gray-300">
          These Terms shall be governed by and construed in accordance with the laws of Canada, without regard to its conflict of law provisions.
        </p>
      </section>
    </div>
  );
} 