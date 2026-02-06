import type { ReactNode } from 'react';
import type { ActionResponse } from '@/actions/_shared/action-response';

type ActionConfig<T> = {
  action: () => Promise<ActionResponse<T>>;
  defaultValue?: T;
};

type ActionsMap = Record<string, ActionConfig<unknown>>;

type ExtractData<T extends ActionsMap> = {
  [K in keyof T]: T[K] extends ActionConfig<infer U> ? U : never;
};

type ActionError = {
  error: string;
  errorCode?: string;
};

type ActionsMetadata<T extends ActionsMap> = {
  errors: { [K in keyof T]: ActionError | null };
};

interface ServerActionsProps<T extends ActionsMap> {
  /** Optional search params to pass to actions */
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
  /** Map of actions to execute */
  actions: T;
  /** Render function with processed data */
  children: (data: ExtractData<T>, metadata: ActionsMetadata<T>) => ReactNode;
}

/**
 * Server Component that executes multiple server actions in parallel
 * and passes processed results to children
 *
 * @example
 * ```tsx
 * <ServerActions
 *   actions={{
 *     user: { action: getCurrentUser, defaultValue: null },
 *     stats: { action: getStats, defaultValue: { games: 0 } },
 *   }}
 * >
 *   {(data, { errors }) => (
 *     <Dashboard user={data.user} stats={data.stats} />
 *   )}
 * </ServerActions>
 * ```
 */
export async function ServerActions<T extends ActionsMap>({
  searchParams,
  actions,
  children,
}: ServerActionsProps<T>) {
  // Resolve searchParams if provided (for future use in actions)
  const _resolvedSearchParams = searchParams ? await searchParams : undefined;
  void _resolvedSearchParams; // Prepared for future use

  // Execute all actions in parallel
  const entries = Object.entries(actions);
  const results = await Promise.all(
    entries.map(async ([key, config]) => {
      const result = await config.action();
      return { key, result, defaultValue: config.defaultValue };
    })
  );

  // Process results into data and errors
  const data = {} as ExtractData<T>;
  const errors = {} as { [K in keyof T]: ActionError | null };

  for (const { key, result, defaultValue } of results) {
    const typedKey = key as keyof T;

    if (result.success) {
      data[typedKey] = (result.data ?? defaultValue) as ExtractData<T>[keyof T];
      errors[typedKey] = null;
    } else {
      data[typedKey] = defaultValue as ExtractData<T>[keyof T];
      errors[typedKey] = {
        error: result.error,
        errorCode: result.errorCode,
      };
    }
  }

  return children(data, { errors });
}

export default ServerActions;
