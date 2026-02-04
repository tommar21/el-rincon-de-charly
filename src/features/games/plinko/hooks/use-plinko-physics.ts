'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import type { RowCount, BallDirection, BallSpeed } from '../types';
import { PlinkoEngine, type PlinkoEngineCallbacks } from '../engine';

interface UsePlinkoPhysicsOptions {
  rows: RowCount;
  speed?: BallSpeed;
  onPinHit?: (ballId: string, pinIndex: number) => void;
  onBallLanded?: (ballId: string, slotIndex: number, multiplier: number) => void;
  onAllBallsLanded?: () => void;
}

interface UsePlinkoPhysicsReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  dropBall: (ballId: string, path?: BallDirection[]) => { path: BallDirection[]; finalSlot: number } | null;
  setRows: (rows: RowCount) => void;
  setSpeed: (speed: BallSpeed) => void;
  isReady: boolean;
  hasActiveBalls: boolean;
}

export function usePlinkoPhysics(options: UsePlinkoPhysicsOptions): UsePlinkoPhysicsReturn {
  const { rows, speed = 'normal', onPinHit, onBallLanded, onAllBallsLanded } = options;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<PlinkoEngine | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasActiveBalls, setHasActiveBalls] = useState(false);

  // Store callbacks in refs to avoid recreating engine on callback changes
  const callbacksRef = useRef<PlinkoEngineCallbacks>({});

  useEffect(() => {
    callbacksRef.current = {
      onPinHit,
      onBallLanded: (ballId, slotIndex, multiplier) => {
        onBallLanded?.(ballId, slotIndex, multiplier);
        // Check if there are still active balls
        if (engineRef.current) {
          setHasActiveBalls(engineRef.current.hasActiveBalls());
        }
      },
      onAllBallsLanded: () => {
        setHasActiveBalls(false);
        onAllBallsLanded?.();
      },
    };
  }, [onPinHit, onBallLanded, onAllBallsLanded]);

  // Initialize engine when canvas is available
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;
    if (!container) return;

    let mounted = true;
    let initialized = false;
    let lastWidth = 0;
    let lastHeight = 0;

    const initializeEngine = async (width: number, height: number) => {
      if (!mounted || initialized) return;
      initialized = true;
      lastWidth = Math.round(width);
      lastHeight = Math.round(height);

      // Create engine with proxy callbacks
      const engine = new PlinkoEngine(rows, {
        onPinHit: (ballId, pinIndex) => callbacksRef.current.onPinHit?.(ballId, pinIndex),
        onBallLanded: (ballId, slotIndex, multiplier) =>
          callbacksRef.current.onBallLanded?.(ballId, slotIndex, multiplier),
        onAllBallsLanded: () => callbacksRef.current.onAllBallsLanded?.(),
      });

      // Set CSS dimensions
      canvas.width = lastWidth;
      canvas.height = lastHeight;

      // Pixi.js init is async
      await engine.init(canvas);

      // Check if still mounted after async init
      if (!mounted) {
        engine.destroy();
        return;
      }

      engineRef.current = engine;
      setIsReady(true);
    };

    // Use ResizeObserver for both initialization AND continuous resize detection
    const observer = new ResizeObserver((entries) => {
      if (!mounted) return;
      const { width, height } = entries[0].contentRect;
      const currentWidth = Math.round(width);
      const currentHeight = Math.round(height);

      if (!initialized) {
        // First time - initialize if dimensions are valid
        if (currentWidth >= 100 && currentHeight >= 100) {
          initializeEngine(currentWidth, currentHeight);
        }
      } else if (engineRef.current) {
        // Already initialized - handle resize if dimensions changed
        // Pixi.js handles canvas dimensions internally via renderer.resize()
        if (currentWidth !== lastWidth || currentHeight !== lastHeight) {
          if (currentWidth > 0 && currentHeight > 0) {
            lastWidth = currentWidth;
            lastHeight = currentHeight;
            engineRef.current.resize(currentWidth, currentHeight);
          }
        }
      }
    });

    // Start observing the container
    observer.observe(container);

    // Try immediate initialization if dimensions are already available
    const { clientWidth, clientHeight } = container;
    if (clientWidth >= 100 && clientHeight >= 100 && !initialized) {
      initializeEngine(clientWidth, clientHeight);
    }

    // Fallback timeout for slow layouts
    const timeoutId = setTimeout(() => {
      if (!mounted || initialized) return;
      const fallbackWidth = container.clientWidth || 400;
      const fallbackHeight = container.clientHeight || 400;
      if (fallbackWidth >= 100 && fallbackHeight >= 100) {
        initializeEngine(fallbackWidth, fallbackHeight);
      }
    }, 500);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      observer.disconnect();
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
      setIsReady(false);
    };
  }, []); // Only run once on mount

  // Update rows when they change
  useEffect(() => {
    if (engineRef.current && isReady) {
      engineRef.current.setRows(rows);
    }
  }, [rows, isReady]);

  // Update speed when it changes
  useEffect(() => {
    if (engineRef.current && isReady) {
      engineRef.current.setSpeed(speed);
    }
  }, [speed, isReady]);

  const dropBall = useCallback((ballId: string, path?: BallDirection[]) => {
    if (!engineRef.current || !isReady) return null;

    setHasActiveBalls(true);
    return engineRef.current.dropBall(ballId, path);
  }, [isReady]);

  const setRows = useCallback((newRows: RowCount) => {
    if (engineRef.current) {
      engineRef.current.setRows(newRows);
    }
  }, []);

  const setSpeed = useCallback((newSpeed: BallSpeed) => {
    if (engineRef.current) {
      engineRef.current.setSpeed(newSpeed);
    }
  }, []);

  return {
    canvasRef,
    dropBall,
    setRows,
    setSpeed,
    isReady,
    hasActiveBalls,
  };
}
