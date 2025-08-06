import { FormEvent, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { post, ensureTrailingSlash } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useLanguage } from '../contexts/LanguageContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const { t } = useLanguage();
  const login = useAuthStore((s: ReturnType<typeof useAuthStore.getState>) => s.login);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = location.state?.from?.pathname || '/dashboard';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await post<{ access_token: string; refresh_token: string; token_type: 'bearer'; expires_in: number }>(
        ensureTrailingSlash('/auth/login'),
        { username, password }
      );
      login(data);
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.detail || t('loginFailed');
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white shadow rounded p-6 space-y-4">
        <h1 className="text-xl font-semibold">{t('loginTitle')}</h1>

        {error && (
          <div className="text-red-700 bg-red-100 border border-red-200 rounded px-3 py-2 text-sm" role="alert" aria-live="assertive">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            {t('loginUsername')}
          </label>
          <input
            id="username"
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            inputMode="text"
            aria-required="true"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            {t('loginPassword')}
          </label>
          <input
            id="password"
            type="password"
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            minLength={10}
            aria-describedby="password-help"
            aria-required="true"
          />
          <p id="password-help" className="text-xs text-gray-500 mt-1">{t('loginPasswordHelp')}</p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? t('loginSubmitting') : t('loginSubmit')}
        </button>
      </form>
    </div>
  );
}