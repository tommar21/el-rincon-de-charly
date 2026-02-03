'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  useOnlineGameCore,
  type OnlineGameStatus,
  type RematchStatus,
  type NegotiationInfo,
} from '../../common/hooks/use-online-game-core';
import { gameRoomService, type GameRoom, type GameRoomWithPlayers, type ConnectionStatus } from '../../common/services/game-room-service';
import { checkWinner, checkDraw, createInitialBoard } from '../engine/game-logic';
import { dbBoardToBoardState, boardStateToDbBoard } from '../../common/utils';
import { createLogger } from '@/lib/utils/logger';
import type { BoardState, WinResult } from '../types';

const log = createLogger({ prefix: 'TicTacToeOnline' });

export type { OnlineGameStatus, RematchStatus };

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
  isPrivateRoom: boolean;
  findMatch: () => Promise<void>;
  createPrivateRoom: () => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  makeMove: (cellIndex: number) => Promise<boolean>;
  leaveGame: () => Promise<void>;
  error: string | null;
  connectionStatus: ConnectionStatus;
  rematchStatus: RematchStatus;
  requestRematch: () => Promise<void>;
  acceptRematch: () => Promise<void>;
  declineRematch: () => Promise<void>;
  betAmount: number | null;
  potTotal: number;
  findMatchWithBet: (amount: number) => Promise<boolean>;
  createPrivateRoomWithBet: (amount: number) => Promise<boolean>;
  // Negotiation
  negotiation: NegotiationInfo;
  submitBetProposal: (amount: number) => Promise<void>;
  acceptBetProposal: () => Promise<void>;
  skipBetting: () => Promise<void>;
}

export function useOnlineGame({ userId, onGameEnd }: UseOnlineGameOptions): UseOnlineGameReturn {
  // Tic-tac-toe specific state
  const [board, setBoard] = useState<BoardState>(createInitialBoard);
  const [winner, setWinner] = useState<WinResult | null>(null);
  const [isDraw, setIsDraw] = useState(false);

  const onGameEndRef = useRef(onGameEnd);
  onGameEndRef.current = onGameEnd;
  const finishTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle room updates - tic-tac-toe specific logic
  const handleRoomUpdate = useCallback((updatedRoom: GameRoom) => {
    const newBoard = dbBoardToBoardState(updatedRoom.board as string[]);
    setBoard(newBoard);
  }, []);

  // Handle game finished - tic-tac-toe specific logic
  const handleGameFinished = useCallback((updatedRoom: GameRoom) => {
    const newBoard = dbBoardToBoardState(updatedRoom.board as string[]);
    const symbol: 'X' | 'O' = updatedRoom.player1_id === userId ? 'X' : 'O';

    // Update board and winner to show the last move
    if (updatedRoom.is_draw) {
      setIsDraw(true);
    } else if (updatedRoom.winner_id) {
      const winResult = checkWinner(newBoard);
      setWinner(winResult);
    }

    // Delay status change to allow animations
    finishTimeoutRef.current = setTimeout(() => {
      core.setStatus('finished');
      if (updatedRoom.is_draw) {
        onGameEndRef.current?.(null, true, symbol);
      } else if (updatedRoom.winner_id) {
        onGameEndRef.current?.(updatedRoom.winner_id, false, symbol);
      }
    }, 1200);
  }, [userId]);

  // Use the core hook
  const core = useOnlineGameCore({
    userId,
    gameType: 'tic-tac-toe',
    onRoomUpdate: handleRoomUpdate,
    onGameFinished: handleGameFinished,
  });

  // Derived state
  const mySymbol = core.room
    ? core.room.player1_id === userId
      ? 'X'
      : 'O'
    : null;

  const isMyTurn = core.room?.status === 'playing' && core.room?.current_turn === userId;

  const opponentName = core.room
    ? core.room.player1_id === userId
      ? core.room.player2?.username || null
      : core.room.player1?.username || null
    : null;

  // Sync with server
  const syncWithServer = useCallback(async () => {
    if (!core.room) return;
    const freshRoom = await gameRoomService.getRoom(core.room.id);
    if (freshRoom) {
      core.setRoom(freshRoom);
      setBoard(dbBoardToBoardState(freshRoom.board as string[]));
    }
  }, [core.room]);

  // Make a move - tic-tac-toe specific
  const makeMove = useCallback(async (cellIndex: number): Promise<boolean> => {
    if (!core.room || !mySymbol) return false;
    if (board[cellIndex] !== null) return false;

    // Save state for potential rollback
    const previousBoard = [...board] as BoardState;
    const expectedDbBoard = boardStateToDbBoard(previousBoard);

    // Create new board with move
    const newBoard = [...board] as BoardState;
    newBoard[cellIndex] = mySymbol;

    // Optimistic update
    setBoard(newBoard);

    // Check for win/draw
    const winResult = checkWinner(newBoard);
    const isDrawResult = !winResult && checkDraw(newBoard);

    if (winResult || isDrawResult) {
      // End game
      const finalBoard = boardStateToDbBoard(newBoard);
      const endSuccess = await gameRoomService.endGame(
        core.room.id,
        winResult ? userId : null,
        isDrawResult,
        finalBoard
      );

      if (!endSuccess) {
        setBoard(previousBoard);
        await syncWithServer();
        return false;
      }

      if (winResult) setWinner(winResult);
      setIsDraw(isDrawResult);
      core.setStatus('finished');
      if (mySymbol) {
        onGameEndRef.current?.(winResult ? userId : null, isDrawResult, mySymbol);
      }
    } else {
      // Send move to server
      const dbBoard = boardStateToDbBoard(newBoard);
      const result = await gameRoomService.makeMove(
        core.room.id,
        cellIndex,
        userId,
        dbBoard,
        expectedDbBoard
      );

      if (!result.success) {
        setBoard(previousBoard);

        if (result.conflict && result.currentRoom) {
          core.setRoom(prev => prev ? { ...prev, ...result.currentRoom } : null);
          setBoard(dbBoardToBoardState(result.currentRoom.board as string[]));

          if (result.currentRoom.status === 'finished') {
            core.setStatus('finished');
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
  }, [core.room, board, mySymbol, userId, syncWithServer]);

  // Extended leave game to reset tic-tac-toe state
  const leaveGame = useCallback(async () => {
    await core.leaveGame();
    setBoard(createInitialBoard());
    setWinner(null);
    setIsDraw(false);
  }, [core.leaveGame]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (finishTimeoutRef.current) {
        clearTimeout(finishTimeoutRef.current);
      }
    };
  }, []);

  // Polling fallback during playing state when realtime not connected
  useEffect(() => {
    if (core.status !== 'playing' || !core.room || core.connectionStatus === 'connected') return;

    log.log('Starting playing-state polling fallback');

    const pollInterval = setInterval(async () => {
      try {
        const updatedRoom = await gameRoomService.getRoom(core.room!.id);

        if (updatedRoom) {
          const currentTime = core.room!.updated_at ? new Date(core.room!.updated_at).getTime() : 0;
          const newTime = updatedRoom.updated_at ? new Date(updatedRoom.updated_at).getTime() : 0;

          if (newTime > currentTime) {
            log.log('Polling detected change during playing state');
            core.setRoom(prev => prev ? { ...prev, ...updatedRoom } : null);
            setBoard(dbBoardToBoardState(updatedRoom.board as string[]));

            if (updatedRoom.status === 'finished') {
              const newBoard = dbBoardToBoardState(updatedRoom.board as string[]);
              if (updatedRoom.is_draw) {
                setIsDraw(true);
              } else if (updatedRoom.winner_id) {
                const winResult = checkWinner(newBoard);
                if (winResult) setWinner(winResult);
              }
              core.setStatus('finished');
            }
          }
        }
      } catch (err) {
        log.error('Playing-state polling error:', err);
      }
    }, 5000);

    return () => {
      log.log('Stopping playing-state polling');
      clearInterval(pollInterval);
    };
  }, [core.status, core.room?.id, core.room?.updated_at, core.connectionStatus]);

  // Update room data on status transition to playing
  const prevStatusRef = useRef<OnlineGameStatus>('idle');
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = core.status;

    if (core.status === 'playing' && prevStatus !== 'playing' && core.room) {
      gameRoomService.getRoom(core.room.id).then(updatedRoom => {
        if (updatedRoom) {
          core.setRoom(updatedRoom);
          setBoard(dbBoardToBoardState(updatedRoom.board as string[]));
        }
      });
    }
  }, [core.status, core.room?.id]);

  return {
    status: core.status,
    room: core.room,
    board,
    mySymbol,
    isMyTurn,
    winner,
    isDraw,
    opponentName,
    isPrivateRoom: core.isPrivateRoom,
    findMatch: core.findMatch,
    createPrivateRoom: core.createPrivateRoom,
    joinRoom: core.joinRoom,
    makeMove,
    leaveGame,
    error: core.error,
    connectionStatus: core.connectionStatus,
    rematchStatus: core.rematchStatus,
    requestRematch: core.requestRematch,
    acceptRematch: core.acceptRematch,
    declineRematch: core.declineRematch,
    betAmount: core.betAmount,
    potTotal: core.potTotal,
    findMatchWithBet: core.findMatchWithBet,
    createPrivateRoomWithBet: core.createPrivateRoomWithBet,
    // Negotiation
    negotiation: core.negotiation,
    submitBetProposal: core.submitBetProposal,
    acceptBetProposal: core.acceptBetProposal,
    skipBetting: core.skipBetting,
  };
}

export default useOnlineGame;
