'use client';

import { useState, useCallback, useTransition } from 'react';
import { toast } from 'sonner';
import type { ActionResponse } from '@/actions/_shared/action-response';

interface UseServerActionOptions<TInput, TOutput> {
  /** The server action to execute */
  action: (input: TInput) => Promise<ActionResponse<TOutput>>;
  /** Callback on successful execution */
  onSuccess?: (data: TOutput) => void | Promise<void>;
  /** Callback on error */
  onError?: (error: string, errorCode?: string) => void | Promise<void>;
  /** Callback that runs after action completes (success or error) */
  onFinally?: () => void | Promise<void>;
  /** Success toast message (null to disable) */
  successMessage?: string | null;
  /** Error toast message (null to disable default error toast) */
  errorMessage?: string | null;
}

interface UseServerActionReturn<TInput, TOutput> {
  /** Execute the server action */
  execute: (input: TInput) => Promise<boolean>;
  /** Whether the action is currently loading */
  isLoading: boolean;
  /** Whether a React transition is pending */
  isPending: boolean;
  /** The last successful result data */
  data: TOutput | null;
  /** The last error message */
  error: string | null;
  /** Reset the state */
  reset: () => void;
}

/**
 * Hook for executing server actions with loading states, toasts, and callbacks
 *
 * @example
 * ```tsx
 * const { execute, isLoading } = useServerAction({
 *   action: loginAction,
 *   successMessage: 'Logged in successfully!',
 *   onSuccess: () => router.push('/dashboard'),
 * });
 *
 * const handleSubmit = async (formData: FormData) => {
 *   await execute(formData);
 * };
 * ```
 */
export function useServerAction<TInput, TOutput>({
  action,
  onSuccess,
  onError,
  onFinally,
  successMessage,
  errorMessage,
}: UseServerActionOptions<TInput, TOutput>): UseServerActionReturn<
  TInput,
  TOutput
> {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<TOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (input: TInput): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      let success = false;

      try {
        // Execute action directly - startTransition is for state updates only
        const result = await action(input);

        if (result.success) {
          // Use startTransition for non-urgent UI updates
          startTransition(() => {
            setData(result.data);
          });
          success = true;

          if (successMessage) {
            toast.success(successMessage);
          }

          await onSuccess?.(result.data);
        } else {
          setError(result.error);

          if (errorMessage !== null) {
            toast.error(errorMessage ?? result.error);
          }

          await onError?.(result.error, result.errorCode);
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMsg);

        if (errorMessage !== null) {
          toast.error(errorMessage ?? errorMsg);
        }

        await onError?.(errorMsg);
      } finally {
        setIsLoading(false);
        await onFinally?.();
      }

      return success;
    },
    [action, onSuccess, onError, onFinally, successMessage, errorMessage]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    execute,
    isLoading: isLoading || isPending,
    isPending,
    data,
    error,
    reset,
  };
}

export default useServerAction;
