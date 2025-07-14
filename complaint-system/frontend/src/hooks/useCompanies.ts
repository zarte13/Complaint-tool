import { useState, useEffect, useCallback } from 'react';
import { companiesApi } from '../services/api';
import { Company } from '../types';
import { debounce } from '../utils';

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchCompanies = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setCompanies([]);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const results = await companiesApi.search(query, 10);
        setCompanies(results);
      } catch (err) {
        setError('Failed to search companies');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  const createCompany = async (name: string): Promise<Company | null> => {
    try {
      const company = await companiesApi.create(name);
      setCompanies(prev => [...prev, company]);
      return company;
    } catch (err) {
      setError('Failed to create company');
      console.error(err);
      return null;
    }
  };

  return {
    companies,
    loading,
    error,
    searchCompanies,
    createCompany,
  };
}