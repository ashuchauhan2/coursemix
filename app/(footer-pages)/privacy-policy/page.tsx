import React from 'react';

export const metadata = {
  title: 'Privacy Policy | CourseMix',
  description: 'Privacy policy and data practices for the CourseMix platform',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Privacy Policy</h1>
      <p className="text-gray-600 dark:text-gray-300">Last updated: {new Date("March 20, 2025 05:00:00").toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">1. Introduction</h2>
        <p className="text-gray-600 dark:text-gray-300">
          At CourseMix, to keeping your private data private. Thus, we only collect your personal data as we need it to provide our products and services, and for the fulfillment of our contracts and record-keeping requirements.
          The CourseMix Privacy Policy details the types of information we collect from you, how we collect the data, how we use it, and how you can control your personal data. 
        </p>
      </section>
      
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">2. Information We Collect</h2>
        <p className="text-gray-600 dark:text-gray-300">
        We typically collect private data collected from you when you voluntarily provide it to us, for instance, such as:
        </p>
        <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
          <li>Brock University Personal Identifying Information (Brocku email address, username, student ID, password)</li>
          <li>Academic information (grades (encrypted), calendar events, programs, and deadlines)</li>
          <li>User preferences and settings</li>
          <li>User generated content (Discussions, reviews)</li>
          <li>Typical browser and device information (IP address, device type, operating system, preffered language, DNS)</li>
          <li>Communication data when you contact us</li>
        </ul>
      </section>
      
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">3. How We Use Your Information</h2>
        <p className="text-gray-600 dark:text-gray-300">
          We use the information we collect to:
        </p>
        <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
          <li>Provide, maintain, and improve our services</li>
          <li>Personalize your experience</li>
          <li>Process course registrations and academic planning</li>
          <li>Communicate with you about updates and features</li>
          <li>Monitor and analyze usage patterns and trends</li>
        </ul>
      </section>
      
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">4. Data Sharing and Disclosure</h2>
        <p className="text-gray-600 dark:text-gray-300">
          We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, 
          except as described in this Privacy Policy. We may share information with:
        </p>
        <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
          <li>Service providers who assist us in operating our platform</li>
          <li>Educational institutions for verification purposes</li>
          <li>Legal authorities when required by law</li>
        </ul>
      </section>
      
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">5. Data Security</h2>
        <p className="text-gray-600 dark:text-gray-300">
          We implement appropriate technical and organizational measures to protect your personal information 
          against unauthorized access, alteration, disclosure, or destruction.
        </p>
      </section>
      
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">6. Your Rights</h2>
        <p className="text-gray-600 dark:text-gray-300">
          You have the right to access, correct, or delete your personal information at any time.
          You can manage your preferences through your account settings or by contacting us directly.
        </p>
      </section>
      
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">7. Changes to This Policy</h2>
        <p className="text-gray-600 dark:text-gray-300">
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new 
          Privacy Policy on this page and updating the "Last updated" date.
        </p>
      </section>
      
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">8. Contact Us</h2>
        <p className="text-gray-600 dark:text-gray-300">
          If you have any questions about this Privacy Policy, please contact us at coursemixtroubleshoot@gmail.com.
        </p>
      </section>
    </div>
  );
} 