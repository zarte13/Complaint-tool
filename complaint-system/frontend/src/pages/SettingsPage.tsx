import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useLanguage } from '../contexts/LanguageContext';
import { useCompanies } from '../hooks/useCompanies';
import { useParts } from '../hooks/useParts';

type TabKey = 'taxonomy' | 'dashboard' | 'master';

export default function SettingsPage() {
  const isAdmin = useAuthStore.getState().isAdmin();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabKey>('taxonomy');
  const [weeks, setWeeks] = useState<number>(12);
  const [cardKpis, setCardKpis] = useState<boolean>(true);
  const [cardTrends, setCardTrends] = useState<boolean>(true);
  const [cardFailures, setCardFailures] = useState<boolean>(true);
  const [cardStacked, setCardStacked] = useState<boolean>(false);
  const [cardRAR, setCardRAR] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedFlag, setSavedFlag] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load existing settings from backend on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { get } = await import('../services/api');
        const { data } = await get('/api/settings/app');
        if (!mounted) return;
        const dash = (data as any)?.dashboard;
        if (dash?.timeWindow?.value) {
          setWeeks(Number(dash.timeWindow.value) || 12);
        }
        if (dash?.cards) {
          const c = dash.cards as any;
          if (typeof c.kpis === 'boolean') setCardKpis(c.kpis);
          if (typeof c.trends === 'boolean') setCardTrends(c.trends);
          if (typeof c.failures === 'boolean') setCardFailures(c.failures);
          if (typeof c.stacked === 'boolean') setCardStacked(c.stacked);
          if (typeof c.rar === 'boolean') setCardRAR(c.rar);
        }
      } catch {
        // ignore; defaults remain
      }
    })();
    return () => { mounted = false; };
  }, []);

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
        <section className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">{t('settingsDashboard') || 'Dashboard'}</h2>
          <p className="text-sm text-gray-600 mb-4">{t('settingsDashboardIntro') || 'Customize which cards are shown, their order/size, and the default time window.'}</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('settingsDashboardWeeks') || 'Default weeks window'}</label>
              <input type="number" min={4} max={52} value={weeks} onChange={(e) => setWeeks(parseInt(e.target.value || '12', 10))}
                className="w-32 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={cardKpis} onChange={(e) => setCardKpis(e.target.checked)} />
                {t('settingsCardKpis') || 'Show KPI counters'}
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={cardTrends} onChange={(e) => setCardTrends(e.target.checked)} />
                {t('settingsCardTrends') || 'Show 12-week trend'}
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={cardFailures} onChange={(e) => setCardFailures(e.target.checked)} />
                {t('settingsCardFailures') || 'Show failure modes pie'}
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={cardStacked} onChange={(e) => setCardStacked(e.target.checked)} />
                {t('settingsCardStacked') || 'Show stacked glowing bar'}
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={cardRAR} onChange={(e) => setCardRAR(e.target.checked)} />
                {t('settingsCardRAR') || 'Show RAR metric card'}
              </label>
            </div>

            <div>
              <button
                type="button"
                className={`px-4 py-2 text-white rounded-md ${saving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                disabled={saving}
                onClick={async () => {
                  try {
                    setSaving(true);
                    setSaveError(null);
                    const payload = {
                      dashboard: {
                        timeWindow: { kind: 'weeks', value: weeks },
                        cards: {
                          kpis: cardKpis,
                          trends: cardTrends,
                          failures: cardFailures,
                          stacked: cardStacked,
                          rar: cardRAR,
                        },
                      },
                    } as any;
                    const { put } = await import('../services/api');
                    await put('/api/settings/app', payload as any);
                    setSavedFlag(true);
                    setTimeout(() => setSavedFlag(false), 2500);
                  } catch (e: any) {
                    setSaveError(e?.message || (t('failedToSave') || 'Failed to save'));
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {t('save') || 'Save'}
              </button>
              {savedFlag && (
                <span className="ml-3 text-sm text-green-600">{t('saved') || 'Saved'}</span>
              )}
              {saveError && !savedFlag && (
                <span className="ml-3 text-sm text-red-600">{saveError}</span>
              )}
            </div>
          </div>
        </section>
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


