import React from 'react';

export default function SecondPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Second Page</h1>
        <p className="mt-2 text-gray-600">
          This is a placeholder page for future features.
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-gray-400 text-2xl">📋</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h2>
          <p className="text-gray-600">
            This page is reserved for additional features and functionality.
          </p>
        </div>
      </div>
    </div>
  );
}