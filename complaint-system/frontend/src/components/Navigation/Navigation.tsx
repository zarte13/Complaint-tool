import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, BarChart3, Users, LogOut } from 'lucide-react';
import LanguageToggle from '../LanguageToggle/LanguageToggle';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuthStore } from '../../stores/authStore';

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const isActive = (path: string) => location.pathname === path;

  const isAuthenticated = useAuthStore((s: ReturnType<typeof useAuthStore.getState>) => s.isAuthenticated);
  const logout = useAuthStore((s: ReturnType<typeof useAuthStore.getState>) => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-xl font-bold text-gray-900">{t('systemTitle')}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Home className="h-4 w-4 mr-2" />
              {t('navHome')}
            </Link>
            
            <Link
              to="/dashboard"
              className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/dashboard')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {t('navDashboard')}
            </Link>
            <Link
              to="/complaints"
              className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/complaints')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <FileText className="h-4 w-4 mr-2" />
              {t('navComplaints')}
            </Link>

            <Link
              to="/responsables"
              className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/responsables')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Users className="h-4 w-4 mr-2" />
              {t('navResponsables') || 'Responsables'}
            </Link>
            
            <div className="ml-4">
              <LanguageToggle />
            </div>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
                aria-label={t('logoutButton')}
                title={t('logoutButton')}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('logoutButton')}
              </button>
            ) : (
              <Link
                to="/login"
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/login')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                aria-label={t('loginLink')}
                title={t('loginLink')}
              >
                {t('loginLink')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}