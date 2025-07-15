import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { useCompanies } from '../../hooks/useCompanies';
import { Company } from '../../types';

interface CompanySearchProps {
  value: Company | null;
  onChange: (company: Company) => void;
  error?: string;
}

export default function CompanySearch({ value, onChange, error }: CompanySearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { companies, loading, searchCompanies, createCompany } = useCompanies();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchCompanies(query);
    setIsOpen(true);
  };

  const handleSelect = (company: Company) => {
    onChange(company);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleCreate = async () => {
    if (searchQuery.trim()) {
      const newCompany = await createCompany(searchQuery.trim());
      if (newCompany) {
        handleSelect(newCompany);
        setShowCreate(false);
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
      </label>
      
      {value ? (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
          <span className="text-gray-900">{value.name}</span>
          <button
            type="button"
            onClick={() => onChange(null as any)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Change
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setIsOpen(true)}
              placeholder="Search or create company..."
              className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-300' : 'border-gray-300'
              }`}
            />
          </div>

          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {loading && (
                <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>
              )}
              
              {!loading && companies.length > 0 && (
                <>
                  {companies.map((company) => (
                    <button
                      key={company.id}
                      type="button"
                      onClick={() => handleSelect(company)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                    >
                      {company.name}
                    </button>
                  ))}
                </>
              )}
              
              {!loading && searchQuery && companies.length === 0 && (
                <div className="px-3 py-2">
                  <button
                    type="button"
                    onClick={handleCreate}
                    className="w-full flex items-center justify-center px-3 py-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create "{searchQuery}"
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
      
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}