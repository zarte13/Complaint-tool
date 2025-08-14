import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useLanguage } from '../contexts/LanguageContext';
import { useCompanies } from '../hooks/useCompanies';
import { useParts } from '../hooks/useParts';
import SimpleDashboardSettings from '../components/DashboardSettings/SimpleDashboardSettings';
import type { DashboardCard } from '../components/DashboardSettings/SimpleDashboardSettings';
import { put } from '../services/api';

type TabKey = 'taxonomy' | 'dashboard' | 'master';

export default function SettingsPage() {
  const isAdmin = useAuthStore.getState().isAdmin();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabKey>('taxonomy');



  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white border border-red-200 rounded-md p-4 text-red-700">
          {t('notAuthorized') || 'You are not authorized to view this page.'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">{t('settings') || 'Settings'}</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button
            className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium ${activeTab === 'taxonomy' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            onClick={() => setActiveTab('taxonomy')}
          >
            {t('settingsTaxonomy') || 'Complaint Taxonomy'}
          </button>
          <button
            className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium ${activeTab === 'dashboard' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            onClick={() => setActiveTab('dashboard')}
          >
            {t('settingsDashboard') || 'Dashboard'}
          </button>
          <button
            className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium ${activeTab === 'master' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            onClick={() => setActiveTab('master')}
          >
            {t('settingsMasterData') || 'Master Data'}
          </button>
        </nav>
      </div>

      {/* Panels */}
      {activeTab === 'taxonomy' && (
        <section className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">{t('settingsTaxonomy') || 'Complaint Taxonomy'}</h2>
          <p className="text-sm text-gray-600 mb-4">{t('settingsTaxonomyIntro') || 'Manage issue categories and sub-types with English/French labels. Changes are global.'}</p>
          <div className="text-sm text-gray-500">
            {t('comingSoon') || 'Coming Soon'}
          </div>
        </section>
      )}

      {activeTab === 'dashboard' && (
        <SimpleDashboardSettings
          onSave={async (cards: DashboardCard[], globalConfig: any) => {
            const payload = {
              dashboard: {
                ...globalConfig,
                cards: {
                  // Keep legacy flags for backward compatibility
                  kpis: cards.some(c => c.type.startsWith('kpi_')),
                  trends: cards.some(c => c.type === 'graph_trends'),
                  failures: cards.some(c => c.type === 'graph_failures'),
                  stacked: cards.some(c => c.type === 'graph_stacked'),
                  rar: cards.some(c => c.type === 'rar_metric'),
                  order: cards,
                },
              },
            };
            await put('/api/settings/app', payload);
          }}
        />
      )}

      {activeTab === 'master' && (
        <section className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">{t('settingsMasterData') || 'Master Data'}</h2>
          <p className="text-sm text-gray-600 mb-4">{t('settingsMasterDataIntro') || 'Admin utilities for Companies and Parts.'}</p>
          <MasterDataSection />
        </section>
      )}
    </div>
  );
}

function MasterDataSection() {
  const { t } = useLanguage();
  const { companies, searchCompanies, createCompany, loading: loadingCompanies } = useCompanies();
  const { parts, searchParts, createPart, loading: loadingParts } = useParts();
  const [companyQuery, setCompanyQuery] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [partQuery, setPartQuery] = useState('');
  const [newPartNumber, setNewPartNumber] = useState('');
  const [newPartDesc, setNewPartDesc] = useState('');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Companies */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('customerCompany') || 'Customer Company'}</h3>
        <div className="flex items-center gap-2 mb-2">
          <input
            value={companyQuery}
            onChange={(e) => { setCompanyQuery(e.target.value); searchCompanies(e.target.value); }}
            placeholder={t('searchComplaints') || 'Search...'}
            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={() => searchCompanies(companyQuery)}
          >
            {t('refresh') || 'Refresh'}
          </button>
        </div>
        <div className="border rounded-md divide-y max-h-64 overflow-auto">
          {(companies || []).map((c) => (
            <div key={c.id} className="px-3 py-2 text-sm text-gray-800">{c.name}</div>
          ))}
          {loadingCompanies && <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            value={newCompanyName}
            onChange={(e) => setNewCompanyName(e.target.value)}
            placeholder={t('customerCompany') || 'Customer Company'}
            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            onClick={async () => { if (newCompanyName.trim()) { await createCompany(newCompanyName.trim()); setNewCompanyName(''); } }}
          >
            {t('add') || 'Add'}
          </button>
        </div>
      </div>

      {/* Parts */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('partNumber') || 'Part Number'}</h3>
        <div className="flex items-center gap-2 mb-2">
          <input
            value={partQuery}
            onChange={(e) => { setPartQuery(e.target.value); searchParts(e.target.value); }}
            placeholder={t('searchComplaints') || 'Search...'}
            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={() => searchParts(partQuery)}
          >
            {t('refresh') || 'Refresh'}
          </button>
        </div>
        <div className="border rounded-md divide-y max-h-64 overflow-auto">
          {(parts || []).map((p) => (
            <div key={p.id} className="px-3 py-2 text-sm text-gray-800">{p.part_number} {p.description ? `— ${p.description}` : ''}</div>
          ))}
          {loadingParts && <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>}
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            value={newPartNumber}
            onChange={(e) => setNewPartNumber(e.target.value)}
            placeholder={t('partNumber') || 'Part Number'}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={newPartDesc}
            onChange={(e) => setNewPartDesc(e.target.value)}
            placeholder={t('details') || 'Description'}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            onClick={async () => { if (newPartNumber.trim()) { await createPart(newPartNumber.trim(), newPartDesc.trim() || undefined); setNewPartNumber(''); setNewPartDesc(''); } }}
          >
            {t('add') || 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}


