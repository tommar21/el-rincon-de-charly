'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { gameRoomService, type GameRoom, type GameRoomWithPlayers } from '../../common/services/game-room-service';
import { checkWinner, checkDraw, createInitialBoard } from '../engine/game-logic';
import { dbBoardToBoardState, boardStateToDbBoard } from '../../common/utils';
import type { BoardState, WinResult } from '../types';

export type OnlineGameStatus = 'idle' | 'searching' | 'waiting' | 'playing' | 'finished';

interface UseOnlineGameOptions {
  userId: string;
  onGameEnd?: (winnerId: string | null, isDraw: boolean, mySymbol: 'X' | 'O') => void;
}

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
  makeMove: (cellIndex: number) => Promise<boolean>;
  leaveGame: () => Promise<void>;
  error: string | null;
}

export function useOnlineGame({ userId, onGameEnd }: UseOnlineGameOptions): UseOnlineGameReturn {
  const [status, setStatus] = useState<OnlineGameStatus>('idle');
  const [room, setRoom] = useState<GameRoomWithPlayers | null>(null);
  const [board, setBoard] = useState<BoardState>(createInitialBoard);
  const [winner, setWinner] = useState<WinResult | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  // Use refs to access latest values in callbacks without causing re-subscriptions
  const onGameEndRef = useRef(onGameEnd);
  onGameEndRef.current = onGameEnd;
  const statusRef = useRef(status);
  statusRef.current = status;
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

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
  }, []);

  // Manejar actualizaciones de la sala - uses refs to avoid dependency changes
  const handleRoomUpdate = useCallback((updatedRoom: GameRoom) => {
    setRoom(prev => prev ? { ...prev, ...updatedRoom } : null);
    const newBoard = dbBoardToBoardState(updatedRoom.board as string[]);
    setBoard(newBoard);

    // Use ref to check current status without causing callback recreation
    if (updatedRoom.status === 'playing' && statusRef.current === 'waiting') {
      setStatus('playing');
    }

    if (updatedRoom.status === 'finished') {
      setStatus('finished');
      // Determine mySymbol for callback (X for player1, O for player2)
      // Use updatedRoom.player1_id since room from closure might be stale
      const symbol: 'X' | 'O' = updatedRoom.player1_id === userIdRef.current ? 'X' : 'O';

      if (updatedRoom.is_draw) {
        setIsDraw(true);
        onGameEndRef.current?.(null, true, symbol);
      } else if (updatedRoom.winner_id) {
        // Encontrar línea ganadora
        const winResult = checkWinner(newBoard);
        if (winResult) {
          setWinner(winResult);
        }
        onGameEndRef.current?.(updatedRoom.winner_id, false, symbol);
      }
    }
  }, []); // No dependencies - uses refs for latest values

  // Buscar partida
  const findMatch = useCallback(async () => {
    setError(null);
    setStatus('searching');

    // Cleanup any existing subscription before creating new one
    cleanupSubscription();

    try {
      const newRoom = await gameRoomService.findOrCreateMatch(userId);

      if (!newRoom) {
        setError('Error al buscar partida');
        setStatus('idle');
        return;
      }

      // Obtener sala con datos de jugadores
      const roomWithPlayers = await gameRoomService.getRoom(newRoom.id);
      setRoom(roomWithPlayers);
      setBoard(dbBoardToBoardState(newRoom.board as string[]));

      if (newRoom.status === 'waiting') {
        setStatus('waiting');
      } else {
        setStatus('playing');
      }

      // Suscribirse a cambios
      unsubscribeRef.current = gameRoomService.subscribeToRoom(
        newRoom.id,
        handleRoomUpdate
      );
    } catch (err) {
      console.error('Error finding match:', err);
      setError('Error al buscar partida');
      setStatus('idle');
    }
  }, [userId, handleRoomUpdate, cleanupSubscription]);

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
      // Finalizar partida
      const endSuccess = await gameRoomService.endGame(room.id, winResult ? userId : null, isDrawResult);

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
  }, [room, userId, cleanupSubscription]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      cleanupSubscription();
    };
  }, [cleanupSubscription]);

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
    makeMove,
    leaveGame,
    error,
  };
}

export default useOnlineGame;
