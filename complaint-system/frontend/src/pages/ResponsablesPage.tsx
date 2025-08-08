import { useEffect, useMemo, useState } from 'react';
import { responsiblesApi } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

type Person = {
  id: number;
  name: string;
  email?: string;
  department?: string;
  is_active: boolean;
  created_at: string;
};

export default function ResponsablesPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Person[]>([]);

  const debouncedSearch = useDebouncedValue(search, 300);

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await responsiblesApi.list({ search: debouncedSearch || undefined, active_only: !showInactive, limit: 100 });
      setItems(data as Person[]);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load responsables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, showInactive]);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('responsablesTitle') || 'Responsables'}</h1>
          <p className="text-gray-600 text-sm">{t('responsablesSubtitle') || 'Manage responsible persons for follow-up actions'}</p>
        </div>
        <AddPersonButton onAdded={fetchList} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchResponsables') || 'Search responsables...'}
          className="w-full md:w-80 px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <label className="inline-flex items-center text-sm text-gray-700">
          <input type="checkbox" className="mr-2" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          {t('showInactive') || 'Show inactive'}
        </label>
      </div>

      <div className="bg-white rounded shadow border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <Th>{t('name') || 'Name'}</Th>
              <Th>{t('email') || 'Email'}</Th>
              <Th>{t('department') || 'Department'}</Th>
              <Th>{t('status') || 'Status'}</Th>
              <Th>{t('actions') || 'Actions'}</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <Td colSpan={5}>{t('loading') || 'Loading...'}</Td>
              </tr>
            ) : error ? (
              <tr>
                <Td colSpan={5} className="text-red-600">{error}</Td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <Td colSpan={5}>{t('noResponsablesFound') || 'No responsables found'}</Td>
              </tr>
            ) : (
              items.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <Td>{p.name}</Td>
                  <Td>{p.email || '-'}</Td>
                  <Td>{p.department || '-'}</Td>
                  <Td>
                    <span className={`px-2 py-1 rounded text-xs ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {p.is_active ? (t('active') || 'Active') : (t('inactive') || 'Inactive')}
                    </span>
                  </Td>
                  <Td>
                    <InlineEdit person={p} onSaved={fetchList} />
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{children}</th>;
}

function Td({ children, colSpan, className }: { children: React.ReactNode; colSpan?: number; className?: string }) {
  return (
    <td colSpan={colSpan} className={`px-4 py-3 text-sm text-gray-900 ${className || ''}`}>
      {children}
    </td>
  );
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

function AddPersonButton({ onAdded }: { onAdded: () => void }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
      >
        {t('addPerson') || 'Add Person'}
      </button>
      {open && <AddPersonModal onClose={() => setOpen(false)} onAdded={onAdded} />}
    </>
  );
}

function AddPersonModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = useMemo(() => name.trim().length >= 2 && /.+@.+\..+/.test(email.trim()), [name, email]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await responsiblesApi.create({ name: name.trim(), email: email.trim(), department: department.trim() || undefined });
      onAdded();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">{t('addPerson') || 'Add Person'}</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">{t('name') || 'Name'} *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">{t('email') || 'Email'} *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">{t('department') || 'Department'}</label>
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className="px-3 py-2 rounded border text-sm">{t('cancel') || 'Cancel'}</button>
          <button
            type="button"
            disabled={!canSave || saving}
            onClick={handleSave}
            className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {saving ? (t('saving') || 'Saving...') : (t('save') || 'Save')}
          </button>
        </div>
      </div>
    </div>
  );
}

function InlineEdit({ person, onSaved }: { person: Person; onSaved: () => void }) {
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(person.name);
  const [email, setEmail] = useState(person.email || '');
  const [department, setDepartment] = useState(person.department || '');
  const [isActive, setIsActive] = useState(person.is_active);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await responsiblesApi.update(person.id, {
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        department: department.trim() || undefined,
        is_active: isActive,
      });
      setEditing(false);
      onSaved();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    setSaving(true);
    setError(null);
    try {
      await responsiblesApi.deactivate(person.id);
      onSaved();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to deactivate');
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <button className="px-2 py-1 text-xs rounded border" onClick={() => setEditing(true)}>{t('edit') || 'Edit'}</button>
        {person.is_active && (
          <button className="px-2 py-1 text-xs rounded border text-red-600" onClick={handleDeactivate}>
            {t('deactivate') || 'Deactivate'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input value={name} onChange={(e) => setName(e.target.value)} className="w-32 px-2 py-1 border rounded" />
      <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-44 px-2 py-1 border rounded" />
      <input value={department} onChange={(e) => setDepartment(e.target.value)} className="w-32 px-2 py-1 border rounded" />
      <label className="inline-flex items-center text-xs">
        <input type="checkbox" className="mr-1" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        {t('active') || 'Active'}
      </label>
      <button className="px-2 py-1 text-xs rounded border" onClick={() => setEditing(false)}>{t('cancel') || 'Cancel'}</button>
      <button className="px-2 py-1 text-xs rounded bg-blue-600 text-white disabled:opacity-50" disabled={saving} onClick={handleSave}>
        {saving ? (t('saving') || 'Saving...') : (t('save') || 'Save')}
      </button>
      {error && <span className="text-xs text-red-600 ml-2">{error}</span>}
    </div>
  );
}


