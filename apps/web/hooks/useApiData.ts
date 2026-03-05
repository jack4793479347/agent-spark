'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseApiDataOptions<T> {
  fetchFn: () => Promise<T>;
  deps?: unknown[];
  enabled?: boolean;
}

interface UseApiDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApiData<T>({ fetchFn, deps = [], enabled = true }: UseApiDataOptions<T>): UseApiDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      if (mounted.current) {
        setData(result);
        setLoading(false);
      }
    } catch (err) {
      if (mounted.current) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => { mounted.current = false; };
  }, [load]);

  return { data, loading, error, refetch: load };
}
