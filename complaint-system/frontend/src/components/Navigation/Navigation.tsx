import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText } from 'lucide-react';
import LanguageToggle from '../LanguageToggle/LanguageToggle';
import { useLanguage } from '../../contexts/LanguageContext';

export default function Navigation() {
  const location = useLocation();
  const { t } = useLanguage();

  const isActive = (path: string) => location.pathname === path;

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
              to="/second"
              className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/second')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <FileText className="h-4 w-4 mr-2" />
              {t('navSecond')}
            </Link>
            
            <div className="ml-4">
              <LanguageToggle />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}