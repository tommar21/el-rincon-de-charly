/**
 * Standardized server action response type
 * Used across all server actions for consistent error handling
 */
export type ActionResponse<T = void> =
  | { success: true; data: T; error?: never; errorCode?: never }
  | { success: false; data?: never; error: string; errorCode?: string };

/**
 * Create a successful response
 */
export function successResponse<T>(data: T): ActionResponse<T> {
  return { success: true, data };
}

/**
 * Create an error response
 */
export function errorResponse(
  message: string,
  errorCode?: string
): ActionResponse<never> {
  return { success: false, error: message, errorCode };
}

/**
 * Helper to extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

/**
 * Wrap an async function with error handling
 */
export async function safeAction<T>(
  fn: () => Promise<T>
): Promise<ActionResponse<T>> {
  try {
    const data = await fn();
    return successResponse(data);
  } catch (error) {
    console.error('Action error:', error);
    return errorResponse(getErrorMessage(error));
  }
}
