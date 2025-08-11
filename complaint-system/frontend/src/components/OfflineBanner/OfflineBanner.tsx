import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { isOnline } from '../../utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { apiClient } from '../../services/api';

export default function OfflineBanner() {
  const [online, setOnline] = useState<boolean>(isOnline());
  const [backendReachable, setBackendReachable] = useState<boolean>(true);
  const { t } = useLanguage();

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;
    let intervalId: number | undefined;

    async function probe() {
      try {
        // Use a short timeout so the UI stays responsive when backend is down
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        // Prefer axios baseURL used by the app; health endpoint is not under /api
        const base = (apiClient.defaults.baseURL || '').replace(/\/$/, '');
        const url = `${base}/health`;
        const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        clearTimeout(timeout);
        if (!isCancelled) setBackendReachable(res.ok);
      } catch {
        if (!isCancelled) setBackendReachable(false);
      }
    }

    // Initial probe and then poll every 15s
    probe();
    intervalId = window.setInterval(probe, 15000);

    return () => {
      isCancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, []);

  const show = !online || !backendReachable;
  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full bg-amber-100 border-b border-amber-300 text-amber-900"
      data-testid="offline-banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2">
        <WifiOff className="h-4 w-4" aria-hidden="true" />
        <span className="font-medium">{t('offlineModeTitle') || 'Offline mode'}</span>
        <span className="text-sm">{t('offlineModeMessage') || 'You are currently offline or the server is unreachable. Changes will sync when you are back online.'}</span>
      </div>
    </div>
  );
}


