import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import ComplaintForm from '../components/ComplaintForm/ComplaintForm';
import ComplaintList from '../components/ComplaintList/ComplaintList';
import { useAuthStore } from '../stores/authStore';

export default function HomePage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { t } = useLanguage();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const handleComplaintSubmitted = () => {
    // Increment to force refresh of the Recent Complaints list
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('homeTitle')}</h1>
        <p className="mt-2 text-gray-600">
          {t('homeSubtitle')}
        </p>
      </div>

      {/* Two-column layout: form (left) and recent complaints (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          {isAuthenticated ? (
            <ComplaintForm onSuccess={handleComplaintSubmitted} />
          ) : (
            <div className="p-4 rounded border border-amber-200 bg-amber-50 text-amber-800 text-sm">
              {'Please log in to submit a complaint.'}
            </div>
          )}
        </div>

        <div>
          {/* Pass only refreshTrigger so list refetches when a new complaint is created */}
          <ComplaintList refreshTrigger={refreshTrigger} readOnly={!isAuthenticated} />
        </div>
      </div>
    </div>
  );
}