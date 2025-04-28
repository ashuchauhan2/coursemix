import React from 'react';

export default function FooterPagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-700/20 rounded-lg p-8">
        {children}
      </div>
    </div>
  );
} 