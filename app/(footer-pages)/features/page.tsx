import React from 'react';

export const metadata = {
  title: 'Features | CourseMix',
  description: 'Explore the powerful features of CourseMix for Brock University students',
};

export default function FeaturesPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">CourseMix Features</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          CourseMix provides Brock University students with a comprehensive suite of tools to simplify course planning,
          registration, and academic management. Explore our key features below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 shadow-sm dark:shadow-gray-900/30 dark:border dark:border-gray-700">
          <div className="text-3xl mb-4">📅</div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Personalized Course Planning</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Create optimized course schedules tailored to your unique preferences and requirements. 
            Our intelligent algorithm considers your degree requirements, prerequisites, and personal preferences
            to generate conflict-free schedules.
          </p>
          <ul className="mt-4 space-y-2 text-gray-600 dark:text-gray-300">
            <li className="flex items-start">
              <svg className="h-5 w-5 text-teal-500 dark:text-teal-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Automated conflict detection and resolution
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-teal-500 dark:text-teal-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Prerequisite tracking and enforcement
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-teal-500 dark:text-teal-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Suggested course combinations
            </li>
          </ul>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 shadow-sm dark:shadow-gray-900/30 dark:border dark:border-gray-700">
          <div className="text-3xl mb-4">🔧</div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Dynamic Course Adjustment</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Adapt your academic plans as needed while staying on track for graduation. Easily make changes
            to your course selections and immediately see how they impact your degree progress and future options.
          </p>
          <ul className="mt-4 space-y-2 text-gray-600 dark:text-gray-300">
            <li className="flex items-start">
              <svg className="h-5 w-5 text-teal-500 dark:text-teal-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Real-time impact analysis
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-teal-500 dark:text-teal-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Alternative course suggestions
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-teal-500 dark:text-teal-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Graduation requirement tracking
            </li>
          </ul>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 shadow-sm dark:shadow-gray-900/30 dark:border dark:border-gray-700">
          <div className="text-3xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Course Insights</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Access comprehensive course data including schedules, failure rates, and peer reviews. Make informed
            decisions based on historical data and student experiences.
          </p>
          <ul className="mt-4 space-y-2 text-gray-600 dark:text-gray-300">
          <li className="flex items-start">
              <svg className="h-5 w-5 text-teal-500 dark:text-teal-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Course discussion groups
            </li>
            
            <li className="flex items-start">
              <svg className="h-5 w-5 text-teal-500 dark:text-teal-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Course ratings
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-teal-500 dark:text-teal-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Course difficulty assessment
            </li>
          </ul>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 shadow-sm dark:shadow-gray-900/30 dark:border dark:border-gray-700">
          <div className="text-3xl mb-4">💬</div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Community Feedback</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Discuss and rate courses with peers to discover efficient course combinations. Leverage the collective
            wisdom of the Brock student community to enhance your academic decisions.
          </p>
          <ul className="mt-4 space-y-2 text-gray-600 dark:text-gray-300">
            <li className="flex items-start">
              <svg className="h-5 w-5 text-teal-500 dark:text-teal-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Anonymous course reviews
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-teal-500 dark:text-teal-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Course combination recommendations
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-teal-500 dark:text-teal-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Study group formation
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 shadow-sm dark:shadow-gray-900/30 dark:border dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Additional Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-teal-500 dark:text-teal-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <h3 className="font-medium text-gray-800 dark:text-gray-100">Degree Progress Tracking</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Monitor your academic progress toward graduation in real-time.</p>
            </div>
          </div>
          <div className="flex items-start">
            <svg className="h-5 w-5 text-teal-500 dark:text-teal-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <h3 className="font-medium text-gray-800 dark:text-gray-100">Grades Calculator</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">See your real time overall average and individual course grades.</p>
            </div>
          </div>
          <div className="flex items-start">
            <svg className="h-5 w-5 text-teal-500 dark:text-teal-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <h3 className="font-medium text-gray-800 dark:text-gray-100">Term Progress Bar</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Easily see how far you are into the term and how many days are left.</p>
            </div>
          </div>
          <div className="flex items-start">
            <svg className="h-5 w-5 text-teal-500 dark:text-teal-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <h3 className="font-medium text-gray-800 dark:text-gray-100">Mobile Compatibility</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Access CourseMix on any device with our responsive design.</p>
            </div>
          </div>
          <div className="flex items-start">
            <svg className="h-5 w-5 text-teal-500 dark:text-teal-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <h3 className="font-medium text-gray-800 dark:text-gray-100">Reading Week Tracker</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">See how far away you are from the next reading week in your dashboard.</p>
            </div>
          </div>
          <div className="flex items-start">
            <svg className="h-5 w-5 text-teal-500 dark:text-teal-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <h3 className="font-medium text-gray-800 dark:text-gray-100">Data Security</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Your academic information is protected with enterprise-grade security.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Ready to Optimize Your Academic Journey?</h2>
        <p className="text-gray-600 dark:text-gray-300">Join thousands of Brock University students who are already using CourseMix.</p>
        <button className="bg-teal-600 text-white px-6 py-3 rounded-md hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors">
          Get Started Today
        </button>
      </div>
    </div>
  );
} 