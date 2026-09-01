"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ApiError } from "@/lib/api/client";

interface UseAdminApiState<T> {
  data: T | null;
  error: ApiError | null;
  isLoading: boolean;
}

interface UseAdminApiReturn<T> extends UseAdminApiState<T> {
  refetch: () => void;
  mutate: (data: T | null) => void;
}

/**
 * Lightweight data-fetching hook for admin API calls.
 * Provides loading, error, data states + refetch + optimistic mutate.
 * Automatically cancels in-flight requests on unmount or refetch.
 */
export function useAdminApi<T>(
  fetcher: (() => Promise<T>) | null,
  deps: unknown[] = []
): UseAdminApiReturn<T> {
  const [state, setState] = useState<UseAdminApiState<T>>({
    data: null,
    error: null,
    isLoading: !!fetcher,
  });
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const execute = useCallback(() => {
    const currentFetcher = fetcherRef.current;
    if (!currentFetcher) {
      setState({ data: null, error: null, isLoading: false });
      return;
    }

    // Cancel previous in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    currentFetcher()
      .then((data) => {
        if (mountedRef.current) {
          setState({ data, error: null, isLoading: false });
        }
      })
      .catch((err) => {
        if (mountedRef.current && err?.name !== "AbortError") {
          const apiError =
            err instanceof ApiError
              ? err
              : new ApiError(err?.message || "Unknown error", 0);
          setState((prev) => ({ ...prev, error: apiError, isLoading: false }));
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    execute();
    return () => {
      mountedRef.current = false;
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [execute]);

  const refetch = useCallback(() => {
    execute();
  }, [execute]);

  const mutate = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  return { ...state, refetch, mutate };
}

/**
 * Hook for triggering mutations (POST/PATCH/DELETE).
 * Returns { execute, isLoading, error, data }.
 */
export function useAdminMutation<T, A extends unknown[] = unknown[]>(
  mutationFn: (...args: A) => Promise<T>
) {
  const [state, setState] = useState<{
    data: T | null;
    error: ApiError | null;
    isLoading: boolean;
  }>({
    data: null,
    error: null,
    isLoading: false,
  });

  const execute = useCallback(
    async (...args: A): Promise<T> => {
      setState({ data: null, error: null, isLoading: true });
      try {
        const result = await mutationFn(...args);
        setState({ data: result, error: null, isLoading: false });
        return result;
      } catch (err) {
        const apiError =
          err instanceof ApiError
            ? err
            : new ApiError(
                err instanceof Error ? err.message : "Unknown error",
                0
              );
        setState({ data: null, error: apiError, isLoading: false });
        throw apiError;
      }
    },
    [mutationFn]
  );

  return { ...state, execute };
}
