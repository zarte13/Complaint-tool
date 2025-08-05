import { useState, useCallback } from 'react';
import { partsApi } from '../services/api';
import { Part } from '../types';
import { debounce } from '../utils';

export function useParts() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchParts = useCallback(
    debounce(async (query: string): Promise<Part[]> => {
      if (!query.trim()) {
        setParts([]);
        return [];
      }

      setLoading(true);
      setError(null);
      
      try {
        const results = (await partsApi.search(query, 10)) as unknown as Part[];
        setParts(results);
        return results;
      } catch (err) {
        setError('Failed to search parts');
        console.error(err);
        return [];
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  const createPart = async (part_number: string, description?: string): Promise<Part | null> => {
    try {
      const part = (await partsApi.create(part_number, description)) as unknown as Part;
      setParts((prev) => [...prev, part]);
      return part;
    } catch (err) {
      setError('Failed to create part');
      console.error(err);
      return null;
    }
  };

  return {
    parts,
    loading,
    error,
    searchParts,
    createPart,
  };
}