import React from 'react';
import { IconType } from 'react-icons';

interface TeamMemberProps {
  name: string;
  role: string;
  Icon: IconType;
}

/**
 * TeamMember component for the About Us page
 * Displays a team member with their name, role, and a representative icon
 */
export const TeamMember = ({ name, role, Icon }: TeamMemberProps) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center hover:shadow-md transition-shadow dark:hover:shadow-gray-700/20">
      <div className="h-16 w-16 mx-auto rounded-full bg-teal-100 dark:bg-teal-800/50 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-teal-600 dark:text-teal-400" />
      </div>
      <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-lg mb-1">{name}</h3>
      <p className="text-gray-600 dark:text-gray-300">{role}</p>
    </div>
  );
}; 