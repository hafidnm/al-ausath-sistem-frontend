import { useCallback, useState } from 'react';

type AsyncOptions = {
  fallbackError: string;
  logLabel?: string;
  rethrow?: boolean;
};

const toErrorMessage = (error: unknown, fallbackError: string): string => {
  return error instanceof Error ? error.message : fallbackError;
};

export function useAsyncMutation<TArgs extends unknown[], TResult>(
  mutationFn: (...args: TArgs) => Promise<TResult>,
  fallbackError: string,
  logLabel?: string,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const mutate = useCallback(
    async (...args: TArgs) => {
      setLoading(true);
      setError(null);
      setSuccess(false);

      try {
        const response = await mutationFn(...args);
        setSuccess(true);
        return response;
      } catch (err) {
        setError(toErrorMessage(err, fallbackError));
        if (logLabel) {
          console.error(logLabel, err);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fallbackError, logLabel, mutationFn],
  );

  return { loading, error, success, mutate };
}

export function useAsyncQuery<TData, TArgs extends unknown[]>(
  queryFn: (...args: TArgs) => Promise<TData>,
  initialData: TData,
  options: AsyncOptions,
) {
  const [data, setData] = useState<TData>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (...args: TArgs) => {
      setLoading(true);
      setError(null);

      try {
        const response = await queryFn(...args);
        setData(response);
        return response;
      } catch (err) {
        setError(toErrorMessage(err, options.fallbackError));
        if (options.logLabel) {
          console.error(options.logLabel, err);
        }
        if (options.rethrow) {
          throw err;
        }
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [options.fallbackError, options.logLabel, options.rethrow, queryFn],
  );

  return { data, setData, loading, error, setError, run };
}
