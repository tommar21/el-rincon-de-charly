'use client';

import { useEffect, type ReactNode } from 'react';
import { toast } from 'sonner';

type ActionError = {
  error: string;
  errorCode?: string;
};

interface ServerActionsResultsProps {
  /** Errors from ServerActions component */
  errors: Record<string, ActionError | null>;
  /** Children to render */
  children: ReactNode;
  /** Whether to show toast notifications for errors */
  showToasts?: boolean;
}

/**
 * Client component that shows toast notifications for failed server actions
 * Wrap your ServerActions children with this to get automatic error toasts
 *
 * @example
 * ```tsx
 * <ServerActions actions={...}>
 *   {(data, { errors }) => (
 *     <ServerActionsResults errors={errors}>
 *       <YourComponent data={data} />
 *     </ServerActionsResults>
 *   )}
 * </ServerActions>
 * ```
 */
export function ServerActionsResults({
  errors,
  children,
  showToasts = true,
}: ServerActionsResultsProps) {
  useEffect(() => {
    if (!showToasts) return;

    for (const [key, error] of Object.entries(errors)) {
      if (error) {
        toast.error(`Error loading ${key}: ${error.error}`);
      }
    }
  }, [errors, showToasts]);

  return <>{children}</>;
}

export default ServerActionsResults;
