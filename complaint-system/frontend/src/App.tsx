import React, { useState } from 'react';
import ComplaintForm from './components/ComplaintForm/ComplaintForm';
import ComplaintList from './components/ComplaintList/ComplaintList';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleComplaintSubmitted = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Part Order Complaint System</h1>
          <p className="mt-2 text-gray-600">
            Submit and track complaints for part order issues
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <ComplaintForm onSuccess={handleComplaintSubmitted} />
          </div>
          
          <div>
            <ComplaintList refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;