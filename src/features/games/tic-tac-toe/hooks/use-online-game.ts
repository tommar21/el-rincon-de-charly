'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { gameRoomService, type GameRoom, type GameRoomWithPlayers, type ConnectionStatus } from '../../common/services/game-room-service';
import { checkWinner, checkDraw, createInitialBoard } from '../engine/game-logic';
import { dbBoardToBoardState, boardStateToDbBoard } from '../../common/utils';
import type { BoardState, WinResult } from '../types';

export type OnlineGameStatus = 'idle' | 'searching' | 'waiting' | 'playing' | 'finished';

interface UseOnlineGameOptions {
  userId: string;
  onGameEnd?: (winnerId: string | null, isDraw: boolean, mySymbol: 'X' | 'O') => void;
}

export type RematchStatus = 'none' | 'requested' | 'received' | 'accepted';

interface UseOnlineGameReturn {
  status: OnlineGameStatus;
  room: GameRoomWithPlayers | null;
  board: BoardState;
  mySymbol: 'X' | 'O' | null;
  isMyTurn: boolean;
  winner: WinResult | null;
  isDraw: boolean;
  opponentName: string | null;
  findMatch: () => Promise<void>;
  createPrivateRoom: () => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  makeMove: (cellIndex: number) => Promise<boolean>;
  leaveGame: () => Promise<void>;
  error: string | null;
  // Connection status
  connectionStatus: ConnectionStatus;
  // Rematch functionality
  rematchStatus: RematchStatus;
  requestRematch: () => Promise<void>;
  acceptRematch: () => Promise<void>;
  declineRematch: () => Promise<void>;
}

export function useOnlineGame({ userId, onGameEnd }: UseOnlineGameOptions): UseOnlineGameReturn {
  const [status, setStatus] = useState<OnlineGameStatus>('idle');
  const [room, setRoom] = useState<GameRoomWithPlayers | null>(null);
  const [board, setBoard] = useState<BoardState>(createInitialBoard);
  const [winner, setWinner] = useState<WinResult | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rematchStatus, setRematchStatus] = useState<RematchStatus>('none');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

  const unsubscribeRef = useRef<(() => void) | null>(null);
  // Use refs to access latest values in callbacks without causing re-subscriptions
  const onGameEndRef = useRef(onGameEnd);
  onGameEndRef.current = onGameEnd;
  const statusRef = useRef(status);
  statusRef.current = status;
  const userIdRef = useRef(userId);
  userIdRef.current = userId;
  const rematchStatusRef = useRef(rematchStatus);
  rematchStatusRef.current = rematchStatus;

  // Determinar mi símbolo (X para player1, O para player2)
  const mySymbol = room
    ? room.player1_id === userId
      ? 'X'
      : 'O'
    : null;

  // Determinar si es mi turno
  const isMyTurn = room?.status === 'playing' && room?.current_turn === userId;

  // Nombre del oponente
  const opponentName = room
    ? room.player1_id === userId
      ? room.player2?.username || null
      : room.player1?.username || null
    : null;

  // Cleanup helper - ensures any existing subscription is properly closed
  const cleanupSubscription = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setConnectionStatus('disconnected');
  }, []);

  // Handler para cambios de estado de conexión
  const handleConnectionStatus = useCallback((newStatus: ConnectionStatus) => {
    console.log('[OnlineGame] Connection status:', newStatus);
    setConnectionStatus(newStatus);
  }, []);

  // Handler para errores de suscripción
  const handleSubscriptionError = useCallback((err: Error) => {
    console.error('[OnlineGame] Subscription error:', err);
    setError('Error de conexión. Reconectando...');
  }, []);

  // Manejar actualizaciones de la sala - uses refs to avoid dependency changes
  const handleRoomUpdate = useCallback((updatedRoom: GameRoom) => {
    console.log('[OnlineGame] handleRoomUpdate called:', updatedRoom.status, 'current status:', statusRef.current);

    // Validate timestamp to prevent stale updates from overwriting newer ones
    setRoom(prev => {
      if (prev && updatedRoom.updated_at) {
        const prevTime = new Date(prev.updated_at).getTime();
        const newTime = new Date(updatedRoom.updated_at).getTime();
        if (newTime < prevTime) {
          console.log('[OnlineGame] Ignoring stale update:', newTime, '<', prevTime);
          return prev; // Ignore stale updates
        }
      }
      return prev ? { ...prev, ...updatedRoom } : null;
    });

    const newBoard = dbBoardToBoardState(updatedRoom.board as string[]);
    setBoard(newBoard);

    // Use ref to check current status without causing callback recreation
    if (updatedRoom.status === 'playing' && statusRef.current === 'waiting') {
      setStatus('playing');
    }

    if (updatedRoom.status === 'finished') {
      // Determine mySymbol for callback (X for player1, O for player2)
      // Use updatedRoom.player1_id since room from closure might be stale
      const symbol: 'X' | 'O' = updatedRoom.player1_id === userIdRef.current ? 'X' : 'O';

      // First update board and winner to show the last move
      if (updatedRoom.is_draw) {
        setIsDraw(true);
      } else if (updatedRoom.winner_id) {
        // Encontrar línea ganadora - siempre calcular y setear
        const winResult = checkWinner(newBoard);
        // Siempre setear winner para mostrar correctamente quién ganó
        // winResult contiene { winner: 'X'|'O', line: number[] }
        setWinner(winResult);
      }

      // Delay status change to 'finished' to allow:
      // - Cell entry animation (~400ms spring)
      // - Winning line animation (~600ms)
      // This prevents the game-over UI from appearing before animations complete
      setTimeout(() => {
        setStatus('finished');
        if (updatedRoom.is_draw) {
          onGameEndRef.current?.(null, true, symbol);
        } else if (updatedRoom.winner_id) {
          onGameEndRef.current?.(updatedRoom.winner_id, false, symbol);
        }
      }, 1200);

      // IMPORTANTE: Detectar rematch_room_id ANTES de resetear el estado de rematch
      // Cuando se acepta la revancha, rematch_requested_by se pone en null y rematch_room_id se setea
      // Si reseteamos primero, perdemos la referencia de que estabamos en estado 'requested'
      const wasRequested = rematchStatusRef.current === 'requested';

      // Detectar si el otro jugador acepto la revancha
      if (updatedRoom.rematch_room_id && wasRequested) {
        console.log('[OnlineGame] Rematch accepted! Joining new room:', updatedRoom.rematch_room_id);
        // Navegar a la nueva sala de revancha
        (async () => {
          const newRoom = await gameRoomService.getRoom(updatedRoom.rematch_room_id!);
          if (newRoom) {
            // Limpiar suscripcion actual
            if (unsubscribeRef.current) {
              unsubscribeRef.current();
              unsubscribeRef.current = null;
            }

            // Actualizar estado para la nueva sala
            setRoom(newRoom);
            setBoard(dbBoardToBoardState(newRoom.board as string[]));
            setWinner(null);
            setIsDraw(false);
            setStatus('playing');
            setError(null);
            setRematchStatus('none');

            // Suscribirse a la nueva sala
            unsubscribeRef.current = gameRoomService.subscribeToRoom(
              newRoom.id,
              handleRoomUpdate,
              handleSubscriptionError,
              handleConnectionStatus
            );
          }
        })();
        return; // No continuar procesando este update
      }

      // Manejar estado de rematch
      if (updatedRoom.rematch_requested_by) {
        if (updatedRoom.rematch_requested_by === userIdRef.current) {
          setRematchStatus('requested');
        } else {
          setRematchStatus('received');
        }
      } else {
        setRematchStatus('none');
      }
    }
  }, []); // No dependencies - uses refs for latest values

  // Buscar partida (matchmaking público)
  const findMatch = useCallback(async () => {
    // Validar que hay un usuario autenticado
    if (!userId) {
      console.error('[OnlineGame] findMatch called without userId');
      setError('Usuario no autenticado');
      setStatus('idle');
      return;
    }

    setError(null);
    setStatus('searching');

    // Cleanup any existing subscription before creating new one
    cleanupSubscription();

    try {
      console.log('[OnlineGame] Finding match for user:', userId);
      const newRoom = await gameRoomService.findOrCreateMatch(userId);

      if (!newRoom) {
        console.error('[OnlineGame] findOrCreateMatch returned null');
        setError('Error al buscar partida');
        setStatus('idle');
        return;
      }

      console.log('[OnlineGame] Got room:', newRoom.id, 'status:', newRoom.status);

      // Obtener sala con datos de jugadores
      const roomWithPlayers = await gameRoomService.getRoom(newRoom.id);

      // Si getRoom falla, usar newRoom directamente (sin datos de jugadores)
      if (roomWithPlayers) {
        setRoom(roomWithPlayers);
      } else {
        // Fallback: crear objeto compatible usando newRoom
        setRoom({
          ...newRoom,
          player1: undefined,
          player2: undefined,
        } as GameRoomWithPlayers);
      }

      setBoard(dbBoardToBoardState(newRoom.board as string[]));

      if (newRoom.status === 'waiting') {
        setStatus('waiting');
      } else {
        setStatus('playing');
      }

      // Suscribirse a cambios
      unsubscribeRef.current = gameRoomService.subscribeToRoom(
        newRoom.id,
        handleRoomUpdate,
        handleSubscriptionError,
        handleConnectionStatus
      );
    } catch (err) {
      console.error('[OnlineGame] Error finding match:', err);
      setError('Error al buscar partida');
      setStatus('idle');
    }
  }, [userId, handleRoomUpdate, cleanupSubscription, handleSubscriptionError, handleConnectionStatus]);

  // Crear sala privada (solo accesible via link de invitación)
  const createPrivateRoom = useCallback(async () => {
    if (!userId) {
      console.error('[OnlineGame] createPrivateRoom called without userId');
      setError('Usuario no autenticado');
      setStatus('idle');
      return;
    }

    setError(null);
    setStatus('searching');

    // Cleanup any existing subscription before creating new one
    cleanupSubscription();

    try {
      console.log('[OnlineGame] Creating private room for user:', userId);
      const newRoom = await gameRoomService.createPrivateRoom(userId);

      if (!newRoom) {
        console.error('[OnlineGame] createPrivateRoom returned null');
        setError('Error al crear sala privada');
        setStatus('idle');
        return;
      }

      console.log('[OnlineGame] Created private room:', newRoom.id);

      // Obtener sala con datos de jugadores
      const roomWithPlayers = await gameRoomService.getRoom(newRoom.id);

      if (roomWithPlayers) {
        setRoom(roomWithPlayers);
      } else {
        setRoom({
          ...newRoom,
          player1: undefined,
          player2: undefined,
        } as GameRoomWithPlayers);
      }

      setBoard(dbBoardToBoardState(newRoom.board as string[]));
      setStatus('waiting');

      // Suscribirse a cambios
      unsubscribeRef.current = gameRoomService.subscribeToRoom(
        newRoom.id,
        handleRoomUpdate,
        handleSubscriptionError,
        handleConnectionStatus
      );
    } catch (err) {
      console.error('[OnlineGame] Error creating private room:', err);
      setError('Error al crear sala privada');
      setStatus('idle');
    }
  }, [userId, handleRoomUpdate, cleanupSubscription, handleSubscriptionError, handleConnectionStatus]);

  // Unirse a una sala específica por ID (para links compartidos)
  const joinRoom = useCallback(async (roomId: string) => {
    if (!userId) {
      console.error('[OnlineGame] joinRoom called without userId');
      setError('Usuario no autenticado');
      setStatus('idle');
      return;
    }

    setError(null);
    setStatus('searching');

    // Cleanup any existing subscription before creating new one
    cleanupSubscription();

    try {
      console.log('[OnlineGame] Joining room:', roomId, 'for user:', userId);
      const { room: newRoom, error: joinError } = await gameRoomService.joinRoomById(roomId, userId);

      if (joinError || !newRoom) {
        console.error('[OnlineGame] joinRoomById error:', joinError);
        setError(joinError || 'Error al unirse a la sala');
        setStatus('idle');
        return;
      }

      console.log('[OnlineGame] Joined room:', newRoom.id, 'status:', newRoom.status);

      // Obtener sala con datos de jugadores
      const roomWithPlayers = await gameRoomService.getRoom(newRoom.id);

      // Si getRoom falla, usar newRoom directamente (sin datos de jugadores)
      if (roomWithPlayers) {
        setRoom(roomWithPlayers);
      } else {
        // Fallback: crear objeto compatible usando newRoom
        setRoom({
          ...newRoom,
          player1: undefined,
          player2: undefined,
        } as GameRoomWithPlayers);
      }

      setBoard(dbBoardToBoardState(newRoom.board as string[]));

      if (newRoom.status === 'waiting') {
        setStatus('waiting');
      } else {
        setStatus('playing');
      }

      // Suscribirse a cambios
      unsubscribeRef.current = gameRoomService.subscribeToRoom(
        newRoom.id,
        handleRoomUpdate,
        handleSubscriptionError,
        handleConnectionStatus
      );
    } catch (err) {
      console.error('[OnlineGame] Error joining room:', err);
      setError('Error al unirse a la sala');
      setStatus('idle');
    }
  }, [userId, handleRoomUpdate, cleanupSubscription, handleSubscriptionError, handleConnectionStatus]);

  // Sincronizar estado con el servidor
  const syncWithServer = useCallback(async () => {
    if (!room) return;
    const freshRoom = await gameRoomService.getRoom(room.id);
    if (freshRoom) {
      setRoom(freshRoom);
      setBoard(dbBoardToBoardState(freshRoom.board as string[]));
    }
  }, [room]);

  // Hacer un movimiento con protección contra race conditions
  const makeMove = useCallback(async (cellIndex: number): Promise<boolean> => {
    // Validación básica local
    if (!room || !mySymbol) {
      return false;
    }

    // Validación de celda vacía (local)
    if (board[cellIndex] !== null) {
      return false;
    }

    // Guardar estado actual para posible rollback
    const previousBoard = [...board] as BoardState;
    const expectedDbBoard = boardStateToDbBoard(previousBoard);

    // Crear nuevo tablero
    const newBoard = [...board] as BoardState;
    newBoard[cellIndex] = mySymbol;

    // Actualizar localmente primero para respuesta visual inmediata
    setBoard(newBoard);

    // Verificar victoria o empate
    const winResult = checkWinner(newBoard);
    const isDrawResult = !winResult && checkDraw(newBoard);

    if (winResult || isDrawResult) {
      // Finalizar partida - incluir el board final para que el oponente vea la última jugada
      const finalBoard = boardStateToDbBoard(newBoard);
      const endSuccess = await gameRoomService.endGame(room.id, winResult ? userId : null, isDrawResult, finalBoard);

      if (!endSuccess) {
        // Revertir y sincronizar
        setBoard(previousBoard);
        await syncWithServer();
        return false;
      }

      if (winResult) {
        setWinner(winResult);
      }
      setIsDraw(isDrawResult);
      setStatus('finished');
      if (mySymbol) {
        onGameEndRef.current?.(winResult ? userId : null, isDrawResult, mySymbol);
      }
    } else {
      // Enviar movimiento con verificación de estado esperado
      const dbBoard = boardStateToDbBoard(newBoard);
      const result = await gameRoomService.makeMove(
        room.id,
        cellIndex,
        userId,
        dbBoard,
        expectedDbBoard // Pasar estado esperado para detección de conflictos
      );

      if (!result.success) {
        // Revertir UI
        setBoard(previousBoard);

        if (result.conflict && result.currentRoom) {
          // Sincronizar con estado del servidor
          setRoom(prev => prev ? { ...prev, ...result.currentRoom } : null);
          setBoard(dbBoardToBoardState(result.currentRoom.board as string[]));

          // Si el juego terminó mientras tanto
          if (result.currentRoom.status === 'finished') {
            setStatus('finished');
            if (result.currentRoom.is_draw) {
              setIsDraw(true);
            } else if (result.currentRoom.winner_id) {
              const serverBoard = dbBoardToBoardState(result.currentRoom.board as string[]);
              const serverWinResult = checkWinner(serverBoard);
              if (serverWinResult) setWinner(serverWinResult);
            }
          }
        }
        return false;
      }
    }

    return true;
  }, [room, board, mySymbol, userId, syncWithServer]);

  // Abandonar partida
  const leaveGame = useCallback(async () => {
    cleanupSubscription();

    if (room) {
      await gameRoomService.leaveRoom(room.id, userId);
    }

    setRoom(null);
    setBoard(createInitialBoard());
    setWinner(null);
    setIsDraw(false);
    setStatus('idle');
    setError(null);
    setRematchStatus('none');
  }, [room, userId, cleanupSubscription]);

  // Helper para iniciar nueva partida de rematch
  const startRematchGame = useCallback(async (newRoom: GameRoom) => {
    cleanupSubscription();

    // Obtener sala con datos de jugadores
    const roomWithPlayers = await gameRoomService.getRoom(newRoom.id);

    if (roomWithPlayers) {
      setRoom(roomWithPlayers);
    } else {
      setRoom({
        ...newRoom,
        player1: undefined,
        player2: undefined,
      } as GameRoomWithPlayers);
    }

    setBoard(dbBoardToBoardState(newRoom.board as string[]));
    setWinner(null);
    setIsDraw(false);
    setStatus('playing');
    setError(null);
    setRematchStatus('none');

    // Suscribirse a la nueva sala
    unsubscribeRef.current = gameRoomService.subscribeToRoom(
      newRoom.id,
      handleRoomUpdate,
      handleSubscriptionError,
      handleConnectionStatus
    );
  }, [cleanupSubscription, handleRoomUpdate, handleSubscriptionError, handleConnectionStatus]);

  // Solicitar revancha
  const requestRematch = useCallback(async () => {
    if (!room || status !== 'finished') {
      console.error('[OnlineGame] requestRematch: invalid state');
      return;
    }

    console.log('[OnlineGame] Requesting rematch for room:', room.id);
    const success = await gameRoomService.requestRematch(room.id, userId);

    if (success) {
      setRematchStatus('requested');
    } else {
      setError('Error al solicitar revancha');
    }
  }, [room, status, userId]);

  // Aceptar revancha
  const acceptRematch = useCallback(async () => {
    if (!room || status !== 'finished' || rematchStatus !== 'received') {
      console.error('[OnlineGame] acceptRematch: invalid state');
      return;
    }

    console.log('[OnlineGame] Accepting rematch for room:', room.id);
    const newRoom = await gameRoomService.acceptRematch(room.id, userId);

    if (newRoom) {
      setRematchStatus('accepted');
      await startRematchGame(newRoom);
    } else {
      setError('Error al aceptar revancha');
    }
  }, [room, status, rematchStatus, userId, startRematchGame]);

  // Rechazar revancha
  const declineRematch = useCallback(async () => {
    if (!room || status !== 'finished') {
      console.error('[OnlineGame] declineRematch: invalid state');
      return;
    }

    console.log('[OnlineGame] Declining rematch for room:', room.id);
    await gameRoomService.declineRematch(room.id);
    setRematchStatus('none');
  }, [room, status]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      cleanupSubscription();
    };
  }, [cleanupSubscription]);

  // Polling fallback: verificar estado de la sala cada 3 segundos mientras esperamos
  // Esto es un fallback en caso de que Supabase Realtime no funcione correctamente
  useEffect(() => {
    // Solo hacer polling si estamos esperando oponente
    if (status !== 'waiting' || !room) return;

    console.log('[OnlineGame] Starting polling for room:', room.id);

    const pollInterval = setInterval(async () => {
      try {
        const updatedRoom = await gameRoomService.getRoom(room.id);
        console.log('[OnlineGame] Poll result:', updatedRoom?.status);

        if (updatedRoom && updatedRoom.status === 'playing') {
          console.log('[OnlineGame] Opponent joined! Updating status via polling.');
          setRoom(updatedRoom);
          setBoard(dbBoardToBoardState(updatedRoom.board as string[]));
          setStatus('playing');
        }
      } catch (err) {
        console.error('[OnlineGame] Polling error:', err);
      }
    }, 3000); // Cada 3 segundos

    return () => {
      console.log('[OnlineGame] Stopping polling');
      clearInterval(pollInterval);
    };
  }, [status, room?.id]);

  // Polling fallback durante 'playing': safety net si Realtime falla
  // Intervalo más largo (15s) porque es solo un fallback, no el mecanismo principal
  useEffect(() => {
    if (status !== 'playing' || !room) return;

    console.log('[OnlineGame] Starting playing-state polling fallback for room:', room.id);

    const pollInterval = setInterval(async () => {
      try {
        const updatedRoom = await gameRoomService.getRoom(room.id);

        if (updatedRoom) {
          // Solo actualizar si hay cambios reales (comparar updated_at)
          const currentTime = room.updated_at ? new Date(room.updated_at).getTime() : 0;
          const newTime = updatedRoom.updated_at ? new Date(updatedRoom.updated_at).getTime() : 0;

          if (newTime > currentTime) {
            console.log('[OnlineGame] Polling detected change during playing state');
            setRoom(prev => prev ? { ...prev, ...updatedRoom } : null);
            setBoard(dbBoardToBoardState(updatedRoom.board as string[]));

            // Manejar fin de juego detectado por polling
            if (updatedRoom.status === 'finished') {
              const newBoard = dbBoardToBoardState(updatedRoom.board as string[]);
              if (updatedRoom.is_draw) {
                setIsDraw(true);
              } else if (updatedRoom.winner_id) {
                const winResult = checkWinner(newBoard);
                if (winResult) setWinner(winResult);
              }
              setStatus('finished');
            }
          }
        }
      } catch (err) {
        console.error('[OnlineGame] Playing-state polling error:', err);
      }
    }, 15000); // Cada 15 segundos - solo como fallback

    return () => {
      console.log('[OnlineGame] Stopping playing-state polling');
      clearInterval(pollInterval);
    };
  }, [status, room?.id, room?.updated_at]);

  // Track previous status to detect transitions
  const prevStatusRef = useRef<OnlineGameStatus>('idle');

  // Actualizar datos de sala cuando el status cambie a 'playing' (solo en la transición)
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = status;

    // Only fetch on transition TO 'playing', not on every render while playing
    if (status === 'playing' && prevStatus !== 'playing' && room) {
      gameRoomService.getRoom(room.id).then(updatedRoom => {
        if (updatedRoom) {
          setRoom(updatedRoom);
        }
      });
    }
  }, [status, room?.id]); // room?.id is stable once set

  return {
    status,
    room,
    board,
    mySymbol,
    isMyTurn,
    winner,
    isDraw,
    opponentName,
    findMatch,
    createPrivateRoom,
    joinRoom,
    makeMove,
    leaveGame,
    error,
    // Connection status
    connectionStatus,
    // Rematch
    rematchStatus,
    requestRematch,
    acceptRematch,
    declineRematch,
  };
}

export default useOnlineGame;
