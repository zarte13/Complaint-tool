import { useState } from 'react';
import { Download } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface ExportButtonProps {
  onExport: (format: 'csv' | 'xlsx') => void;
}

export default function ExportButton({ onExport }: ExportButtonProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = (format: 'csv' | 'xlsx') => {
    onExport(format);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Download className="h-4 w-4 mr-2" />
        {t('export')}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1">
            <button
              onClick={() => handleExport('csv')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {t('exportCSV')}
            </button>
            <button
              onClick={() => handleExport('xlsx')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {t('exportExcel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}