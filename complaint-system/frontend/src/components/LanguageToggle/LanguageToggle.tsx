import { useLanguage } from '../../contexts/LanguageContext';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (newLang: 'en' | 'fr') => {
    setLanguage(newLang);
  };

  return (
    <div className="flex items-center space-x-1">
      <button
        type="button"
        onClick={() => handleLanguageChange('fr')}
        className={`px-3 py-1.5 text-sm font-medium rounded-l-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          language === 'fr'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
        aria-pressed={language === 'fr'}
        aria-label="Switch to French"
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => handleLanguageChange('en')}
        className={`px-3 py-1.5 text-sm font-medium rounded-r-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          language === 'en'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
        aria-pressed={language === 'en'}
        aria-label="Switch to English"
      >
        EN
      </button>
    </div>
  );
}