import { useState, useEffect, useCallback, useRef } from 'react';
import { gameRoomService, type GameRoom, type GameRoomWithPlayers } from '../../common/services/gameRoomService';
import { checkWinner, checkDraw, createInitialBoard } from '../logic/gameLogic';
import type { BoardState, WinResult } from '../types';

export type OnlineGameStatus = 'idle' | 'searching' | 'waiting' | 'playing' | 'finished';

interface UseOnlineGameOptions {
  userId: string;
  onGameEnd?: (winnerId: string | null, isDraw: boolean) => void;
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

// Convert string array from DB to BoardState
const dbBoardToBoardState = (dbBoard: string[]): BoardState => {
  return dbBoard.map(cell => {
    if (cell === 'X') return 'X';
    if (cell === 'O') return 'O';
    return null;
  }) as BoardState;
};

// Convert BoardState to string array for DB
const boardStateToDbBoard = (board: BoardState): string[] => {
  return board.map(cell => cell || '');
};

export function useOnlineGame({ userId, onGameEnd }: UseOnlineGameOptions): UseOnlineGameReturn {
  const [status, setStatus] = useState<OnlineGameStatus>('idle');
  const [room, setRoom] = useState<GameRoomWithPlayers | null>(null);
  const [board, setBoard] = useState<BoardState>(createInitialBoard);
  const [winner, setWinner] = useState<WinResult | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unsubscribeRef = useRef<(() => void) | null>(null);

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

  // Manejar actualizaciones de la sala
  const handleRoomUpdate = useCallback((updatedRoom: GameRoom) => {
    setRoom(prev => prev ? { ...prev, ...updatedRoom } : null);
    const newBoard = dbBoardToBoardState(updatedRoom.board as string[]);
    setBoard(newBoard);

    if (updatedRoom.status === 'playing' && status === 'waiting') {
      setStatus('playing');
    }

    if (updatedRoom.status === 'finished') {
      setStatus('finished');

      if (updatedRoom.is_draw) {
        setIsDraw(true);
        onGameEnd?.(null, true);
      } else if (updatedRoom.winner_id) {
        // Encontrar línea ganadora
        const winResult = checkWinner(newBoard);
        if (winResult) {
          setWinner(winResult);
        }
        onGameEnd?.(updatedRoom.winner_id, false);
      }
    }
  }, [status, onGameEnd]);

  // Buscar partida
  const findMatch = useCallback(async () => {
    setError(null);
    setStatus('searching');

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
  }, [userId, handleRoomUpdate]);

  // Hacer un movimiento
  const makeMove = useCallback(async (cellIndex: number): Promise<boolean> => {
    if (!room || !isMyTurn || board[cellIndex] !== null) {
      return false;
    }

    const newBoard = [...board] as BoardState;
    newBoard[cellIndex] = mySymbol!;

    // Actualizar localmente primero para respuesta inmediata
    setBoard(newBoard);

    // Verificar victoria o empate
    const winResult = checkWinner(newBoard);
    const isDrawResult = !winResult && checkDraw(newBoard);

    if (winResult || isDrawResult) {
      // Finalizar partida
      await gameRoomService.endGame(room.id, winResult ? userId : null, isDrawResult);

      if (winResult) {
        setWinner(winResult);
      }
      setIsDraw(isDrawResult);
      setStatus('finished');
      onGameEnd?.(winResult ? userId : null, isDrawResult);
    } else {
      // Enviar movimiento - convertir a formato DB
      const dbBoard = boardStateToDbBoard(newBoard);
      const success = await gameRoomService.makeMove(room.id, cellIndex, userId, dbBoard);
      if (!success) {
        // Revertir si falla
        setBoard(board);
        return false;
      }
    }

    return true;
  }, [room, isMyTurn, board, mySymbol, userId, onGameEnd]);

  // Abandonar partida
  const leaveGame = useCallback(async () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (room) {
      await gameRoomService.leaveRoom(room.id, userId);
    }

    setRoom(null);
    setBoard(createInitialBoard());
    setWinner(null);
    setIsDraw(false);
    setStatus('idle');
    setError(null);
  }, [room, userId]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Actualizar datos de sala cuando cambie el status a playing
  useEffect(() => {
    if (room && status === 'playing') {
      gameRoomService.getRoom(room.id).then(updatedRoom => {
        if (updatedRoom) {
          setRoom(updatedRoom);
        }
      });
    }
  }, [room?.id, status]);

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
