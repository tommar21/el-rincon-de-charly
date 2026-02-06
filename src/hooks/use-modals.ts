'use client';

import { useCallback, useState, useRef } from 'react';

type ModalState<T extends string> = Record<T, boolean>;

interface UseModalsReturn<T extends string> {
  /** Check if a specific modal is open */
  isOpen: (modal: T) => boolean;
  /** Open a specific modal */
  open: (modal: T) => void;
  /** Close a specific modal */
  close: (modal: T) => void;
  /** Toggle a specific modal */
  toggle: (modal: T) => void;
  /** Close all modals */
  closeAll: () => void;
  /** Get the state object (for debugging) */
  state: ModalState<T>;
}

/**
 * Hook for managing multiple modal states
 *
 * @example
 * ```tsx
 * const modals = useModals(['auth', 'stats', 'settings']);
 *
 * // Open a modal
 * modals.open('auth');
 *
 * // Check if open
 * if (modals.isOpen('auth')) { ... }
 *
 * // In JSX
 * <AuthModal isOpen={modals.isOpen('auth')} onClose={() => modals.close('auth')} />
 * ```
 */
export function useModals<T extends string>(modalNames: readonly T[]): UseModalsReturn<T> {
  // Initialize all modals as closed
  const initialState = modalNames.reduce((acc, name) => {
    acc[name] = false;
    return acc;
  }, {} as ModalState<T>);

  const [state, setState] = useState<ModalState<T>>(initialState);

  // Use ref to always have access to latest state without recreating isOpen callback
  const stateRef = useRef(state);
  // eslint-disable-next-line react-hooks/refs -- intentional pattern to keep ref in sync without re-creating callbacks
  stateRef.current = state;

  // isOpen is stable - reads from ref, doesn't depend on state
  const isOpen = useCallback((modal: T): boolean => {
    return stateRef.current[modal] ?? false;
  }, []);

  const open = useCallback((modal: T): void => {
    setState(prev => ({ ...prev, [modal]: true }));
  }, []);

  const close = useCallback((modal: T): void => {
    setState(prev => ({ ...prev, [modal]: false }));
  }, []);

  const toggle = useCallback((modal: T): void => {
    setState(prev => ({ ...prev, [modal]: !prev[modal] }));
  }, []);

  const closeAll = useCallback((): void => {
    // Don't reference initialState to avoid dependency recreation
    setState(prev =>
      Object.keys(prev).reduce((acc, key) => {
        acc[key as T] = false;
        return acc;
      }, {} as ModalState<T>)
    );
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
    closeAll,
    state,
  };
}

export default useModals;
