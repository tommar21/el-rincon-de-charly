'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { gameRoomService, type GameRoom, type GameRoomWithPlayers, type ConnectionStatus, type NegotiationState, type BetConfig, type GameRoomMetadata } from '../services/game-room-service';
import { useWalletStore } from '@/features/wallet/store/wallet-store';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger({ prefix: 'OnlineGameCore' });

export type OnlineGameStatus = 'idle' | 'searching' | 'waiting' | 'negotiating' | 'playing' | 'finished';

export type { NegotiationState, BetConfig };
export type RematchStatus = 'none' | 'requested' | 'received' | 'accepted';

export interface OnlineGameCoreOptions {
  userId: string;
  gameType?: string;
  onRoomUpdate?: (room: GameRoom) => void;
  onGameFinished?: (room: GameRoom) => void;
  onStatusChange?: (status: OnlineGameStatus) => void;
}

export interface NegotiationInfo {
  state: NegotiationState;
  myProposal: number | null;
  opponentProposal: number | null;
  deadline: string | null;
}

export interface OnlineGameCoreReturn {
  // State
  status: OnlineGameStatus;
  room: GameRoomWithPlayers | null;
  error: string | null;
  connectionStatus: ConnectionStatus;
  rematchStatus: RematchStatus;
  betAmount: number | null;
  potTotal: number;
  isPrivateRoom: boolean;
  negotiation: NegotiationInfo;

  // Actions - Matchmaking
  findMatch: () => Promise<void>;
  createPrivateRoom: () => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  findMatchWithBet: (amount: number) => Promise<boolean>;
  createPrivateRoomWithBet: (amount: number) => Promise<boolean>;

  // Actions - Game
  leaveGame: () => Promise<void>;
  updateRoom: (updates: Partial<GameRoom>) => Promise<boolean>;

  // Actions - Rematch
  requestRematch: () => Promise<void>;
  acceptRematch: () => Promise<void>;
  declineRematch: () => Promise<void>;

  // Actions - Negotiation
  submitBetProposal: (amount: number) => Promise<void>;
  acceptBetProposal: () => Promise<void>;
  skipBetting: () => Promise<void>;

  // Internal - for game-specific hooks to use
  setStatus: (status: OnlineGameStatus) => void;
  setRoom: React.Dispatch<React.SetStateAction<GameRoomWithPlayers | null>>;
  setError: (error: string | null) => void;
  cleanupSubscription: () => void;
  subscribeToRoom: (roomId: string) => void;

  // Refs for callbacks
  statusRef: React.MutableRefObject<OnlineGameStatus>;
  userIdRef: React.MutableRefObject<string>;
}

export function useOnlineGameCore({
  userId,
  gameType = 'tic-tac-toe',
  onRoomUpdate,
  onGameFinished,
  onStatusChange,
}: OnlineGameCoreOptions): OnlineGameCoreReturn {
  const [status, setStatusInternal] = useState<OnlineGameStatus>('idle');
  const [room, setRoom] = useState<GameRoomWithPlayers | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rematchStatus, setRematchStatus] = useState<RematchStatus>('none');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [betAmount, setBetAmount] = useState<number | null>(null);
  const [negotiation, setNegotiation] = useState<NegotiationInfo>({
    state: 'none',
    myProposal: null,
    opponentProposal: null,
    deadline: null,
  });

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const statusRef = useRef(status);
  statusRef.current = status;
  const userIdRef = useRef(userId);
  userIdRef.current = userId;
  const rematchStatusRef = useRef(rematchStatus);
  rematchStatusRef.current = rematchStatus;
  const betAmountRef = useRef(betAmount);
  betAmountRef.current = betAmount;
  const betDeductedForRoomRef = useRef<string | null>(null); // Track which room we've deducted bet for
  const onRoomUpdateRef = useRef(onRoomUpdate);
  onRoomUpdateRef.current = onRoomUpdate;
  const onGameFinishedRef = useRef(onGameFinished);
  onGameFinishedRef.current = onGameFinished;

  // Wrapper to track status changes
  const setStatus = useCallback((newStatus: OnlineGameStatus) => {
    setStatusInternal(newStatus);
    onStatusChange?.(newStatus);
  }, [onStatusChange]);

  // Cleanup helper
  const cleanupSubscription = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setConnectionStatus('disconnected');
  }, []);

  // Connection status handler
  const handleConnectionStatus = useCallback((newStatus: ConnectionStatus) => {
    log.log('Connection status:', newStatus);
    setConnectionStatus(newStatus);
  }, []);

  // Subscription error handler
  const handleSubscriptionError = useCallback((err: Error) => {
    log.error('Subscription error:', err);
    setError('Error de conexion. Reconectando...');
  }, []);

  // Room update handler
  const handleRoomUpdate = useCallback((updatedRoom: GameRoom) => {
    log.log('Room update:', updatedRoom.status, 'current status:', statusRef.current);

    // Validate timestamp to prevent stale updates
    setRoom(prev => {
      if (prev && updatedRoom.updated_at) {
        const prevTime = new Date(prev.updated_at).getTime();
        const newTime = new Date(updatedRoom.updated_at).getTime();
        if (newTime < prevTime) {
          log.log('Ignoring stale update:', newTime, '<', prevTime);
          return prev;
        }
      }
      return prev ? { ...prev, ...updatedRoom } : null;
    });

    // Extract negotiation info from metadata
    const metadata = updatedRoom.metadata as GameRoomMetadata | null;
    if (metadata) {
      const isPlayer1 = updatedRoom.player1_id === userIdRef.current;
      const negotiationState = metadata.negotiation_state || 'none';

      setNegotiation({
        state: negotiationState,
        myProposal: isPlayer1 ? metadata.player1_bet_proposal ?? null : metadata.player2_bet_proposal ?? null,
        opponentProposal: isPlayer1 ? metadata.player2_bet_proposal ?? null : metadata.player1_bet_proposal ?? null,
        deadline: metadata.negotiation_deadline ?? null,
      });

      // Handle bet deduction when agreement is reached
      if (negotiationState === 'agreed' && metadata.bet_amount && metadata.bet_amount > 0) {
        const roomId = updatedRoom.id;
        // Only deduct if we haven't already deducted for this room
        if (betDeductedForRoomRef.current !== roomId) {
          const walletStore = useWalletStore.getState();
          const balance = walletStore.wallet?.balance ?? 0;

          if (metadata.bet_amount <= balance) {
            log.log('Agreement detected - deducting bet:', metadata.bet_amount);
            walletStore.placeBet(metadata.bet_amount, gameType, 'Apuesta acordada').then(success => {
              if (success) {
                betDeductedForRoomRef.current = roomId;
                setBetAmount(metadata.bet_amount!);
              } else {
                log.error('Failed to deduct bet after agreement');
              }
            });
          } else {
            log.error('Insufficient balance for agreed bet');
          }
        } else {
          // Already deducted, just update the display amount
          setBetAmount(metadata.bet_amount);
        }
      }

      // Handle negotiation status
      if (negotiationState === 'pending' && statusRef.current !== 'negotiating') {
        log.log('Entering negotiation state');
        setStatus('negotiating');
      } else if ((negotiationState === 'agreed' || negotiationState === 'no_bet') && statusRef.current === 'negotiating') {
        log.log('Negotiation resolved:', negotiationState);
        setStatus('playing');
      }
    }

    // Notify game-specific handler
    onRoomUpdateRef.current?.(updatedRoom);

    // Handle status transitions (only if not in negotiation)
    const negotiationState = (updatedRoom.metadata as GameRoomMetadata | null)?.negotiation_state;
    if (updatedRoom.status === 'playing' && statusRef.current === 'waiting' && negotiationState !== 'pending') {
      setStatus('playing');
    }

    if (updatedRoom.status === 'finished') {
      // Process bet results
      const roomBetAmount = (updatedRoom.metadata as { bet_amount?: number } | null)?.bet_amount;
      if (roomBetAmount && roomBetAmount > 0) {
        const walletStore = useWalletStore.getState();
        const myId = userIdRef.current;

        (async () => {
          try {
            if (updatedRoom.is_draw) {
              log.log('Draw with bet - refunding:', roomBetAmount);
              await walletStore.recordWin(roomBetAmount, gameType, 'Reembolso por empate');
            } else if (updatedRoom.winner_id === myId) {
              const winnings = roomBetAmount * 2;
              log.log('Won with bet - receiving:', winnings);
              await walletStore.recordWin(winnings, gameType, 'Victoria en partida con apuesta');
            }
          } catch (err) {
            log.error('Error processing bet result:', err);
          }
        })();
      }

      // Handle rematch detection
      const wasRequested = rematchStatusRef.current === 'requested';
      if (updatedRoom.rematch_room_id && wasRequested) {
        log.log('Rematch accepted! Joining new room:', updatedRoom.rematch_room_id);
        handleRematchAccepted(updatedRoom.rematch_room_id);
        return;
      }

      // Update rematch status
      if (updatedRoom.rematch_requested_by) {
        setRematchStatus(updatedRoom.rematch_requested_by === userIdRef.current ? 'requested' : 'received');
      } else {
        setRematchStatus('none');
      }

      // Notify game finished
      onGameFinishedRef.current?.(updatedRoom);
    }
  }, [gameType, setStatus]);

  // Handle rematch room transition
  const handleRematchAccepted = useCallback(async (newRoomId: string) => {
    const newRoom = await gameRoomService.getRoom(newRoomId);
    if (newRoom) {
      cleanupSubscription();
      setRoom(newRoom);
      setStatus('playing');
      setError(null);
      setRematchStatus('none');
      subscribeToRoom(newRoomId);
    }
  }, [cleanupSubscription, setStatus]);

  // Subscribe to room updates
  const subscribeToRoom = useCallback((roomId: string) => {
    unsubscribeRef.current = gameRoomService.subscribeToRoom(
      roomId,
      handleRoomUpdate,
      handleSubscriptionError,
      handleConnectionStatus
    );
  }, [handleRoomUpdate, handleSubscriptionError, handleConnectionStatus]);

  // Initialize game room helper
  const initializeGameRoom = useCallback(async (
    newRoom: GameRoom,
    initialStatus?: OnlineGameStatus
  ) => {
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

    const roomStatus = initialStatus ?? (newRoom.status === 'waiting' ? 'waiting' : 'playing');
    setStatus(roomStatus);
    subscribeToRoom(newRoom.id);
  }, [setStatus, subscribeToRoom]);

  // Find public match
  const findMatch = useCallback(async () => {
    if (!userId) {
      log.error('findMatch called without userId');
      setError('Usuario no autenticado');
      setStatus('idle');
      return;
    }

    setError(null);
    setStatus('searching');
    cleanupSubscription();

    try {
      log.log('Finding match for user:', userId);
      const newRoom = await gameRoomService.findOrCreateMatch(userId, gameType);

      if (!newRoom) {
        log.error('findOrCreateMatch returned null');
        setError('Error al buscar partida');
        setStatus('idle');
        return;
      }

      log.log('Got room:', newRoom.id, 'status:', newRoom.status);
      await initializeGameRoom(newRoom);
    } catch (err) {
      log.error('Error finding match:', err);
      setError('No se pudo conectar al servidor de matchmaking');
      setStatus('idle');
    }
  }, [userId, gameType, initializeGameRoom, cleanupSubscription, setStatus]);

  // Create private room
  const createPrivateRoom = useCallback(async () => {
    if (!userId) {
      log.error('createPrivateRoom called without userId');
      setError('Usuario no autenticado');
      setStatus('idle');
      return;
    }

    setError(null);
    setStatus('waiting');
    cleanupSubscription();

    try {
      log.log('Creating private room for user:', userId);
      const newRoom = await gameRoomService.createPrivateRoom(userId, gameType);

      if (!newRoom) {
        log.error('createPrivateRoom returned null');
        setError('Error al crear sala privada');
        setStatus('idle');
        return;
      }

      log.log('Created private room:', newRoom.id);
      await initializeGameRoom(newRoom, 'waiting');
    } catch (err) {
      log.error('Error creating private room:', err);
      setError('No se pudo crear la sala. Intenta de nuevo.');
      setStatus('idle');
    }
  }, [userId, gameType, initializeGameRoom, cleanupSubscription, setStatus]);

  // Find match with bet (new negotiation system)
  // Bet is NOT deducted until negotiation completes
  const findMatchWithBet = useCallback(async (amount: number): Promise<boolean> => {
    if (!userId) {
      log.error('findMatchWithBet called without userId');
      setError('Usuario no autenticado');
      setStatus('idle');
      return false;
    }

    if (amount <= 0) {
      setError('Monto de apuesta invalido');
      return false;
    }

    // Verify balance without deducting
    const walletStore = useWalletStore.getState();
    const balance = walletStore.wallet?.balance ?? 0;
    if (amount > balance) {
      setError('Balance insuficiente para esta apuesta');
      return false;
    }

    setError(null);
    setStatus('searching');
    cleanupSubscription();

    try {
      log.log('Finding match with negotiation for user:', userId, 'amount:', amount);
      // Use new v2 matchmaking with negotiation
      const newRoom = await gameRoomService.findOrCreateMatchWithNegotiation(userId, gameType, { wantsToBet: true, betAmount: amount });

      if (!newRoom) {
        log.error('findOrCreateMatchWithNegotiation returned null');
        setError('Error al buscar partida');
        setStatus('idle');
        return false;
      }

      log.log('Got room:', newRoom.id, 'status:', newRoom.status, 'metadata:', newRoom.metadata);

      // Check negotiation state from room metadata
      const metadata = newRoom.metadata as GameRoomMetadata | null;
      const negotiationState = metadata?.negotiation_state;

      if (negotiationState === 'agreed' && metadata?.bet_amount) {
        // Both players agreed on same amount - deduct bet now
        const betSuccess = await walletStore.placeBet(metadata.bet_amount, gameType, 'Apuesta acordada');
        if (!betSuccess) {
          // Can't afford - skip betting
          await gameRoomService.skipBetting(newRoom.id, userId);
        } else {
          setBetAmount(metadata.bet_amount);
        }
      } else if (negotiationState === 'pending') {
        // Need to negotiate - don't deduct yet
        log.log('Entering negotiation phase');
      }
      // For 'none' or 'no_bet', no bet to deduct

      await initializeGameRoom(newRoom);
      return true;
    } catch (err) {
      log.error('Error finding match:', err);
      setError('No se pudo conectar al servidor de matchmaking');
      setStatus('idle');
      return false;
    }
  }, [userId, gameType, initializeGameRoom, cleanupSubscription, setStatus]);

  // Create private room with bet (new negotiation system)
  // Bet is NOT deducted until negotiation completes with the joiner
  const createPrivateRoomWithBet = useCallback(async (amount: number): Promise<boolean> => {
    if (!userId) {
      log.error('createPrivateRoomWithBet called without userId');
      setError('Usuario no autenticado');
      setStatus('idle');
      return false;
    }

    if (amount <= 0) {
      setError('Monto de apuesta invalido');
      return false;
    }

    // Verify balance without deducting
    const walletStore = useWalletStore.getState();
    const balance = walletStore.wallet?.balance ?? 0;
    if (amount > balance) {
      setError('Balance insuficiente para esta apuesta');
      return false;
    }

    setError(null);
    setStatus('waiting');
    cleanupSubscription();

    try {
      log.log('Creating private room with negotiation for user:', userId, 'amount:', amount);
      // Use new negotiation system - bet stored as proposal, not deducted
      const newRoom = await gameRoomService.createPrivateRoomWithNegotiation(userId, gameType, { wantsToBet: true, betAmount: amount });

      if (!newRoom) {
        log.error('createPrivateRoomWithNegotiation returned null');
        setError('Error al crear sala privada');
        setStatus('idle');
        return false;
      }

      log.log('Created private room with negotiation:', newRoom.id);
      await initializeGameRoom(newRoom, 'waiting');
      return true;
    } catch (err) {
      log.error('Error creating private room:', err);
      setError('No se pudo crear la sala. Intenta de nuevo.');
      setStatus('idle');
      return false;
    }
  }, [userId, gameType, initializeGameRoom, cleanupSubscription, setStatus]);

  // Join room by ID
  const joinRoom = useCallback(async (roomId: string) => {
    if (!userId) {
      log.error('joinRoom called without userId');
      setError('Usuario no autenticado');
      setStatus('idle');
      return;
    }

    setError(null);
    setStatus('searching');
    cleanupSubscription();

    try {
      log.log('Joining room:', roomId, 'for user:', userId);
      const { room: newRoom, error: joinError } = await gameRoomService.joinRoomById(roomId, userId);

      if (joinError || !newRoom) {
        log.error('joinRoomById error:', joinError);
        setError(joinError || 'Error al unirse a la sala');
        setStatus('idle');
        return;
      }

      log.log('Joined room:', newRoom.id, 'status:', newRoom.status);
      await initializeGameRoom(newRoom);
    } catch (err) {
      log.error('Error joining room:', err);
      setError('No se pudo unir a la sala. Verifica el enlace.');
      setStatus('idle');
    }
  }, [userId, initializeGameRoom, cleanupSubscription, setStatus]);

  // Leave game
  const leaveGame = useCallback(async () => {
    const currentBetAmount = betAmountRef.current;
    const currentStatus = statusRef.current;

    // Refund bet if leaving before game started
    if (currentBetAmount && currentBetAmount > 0 && (currentStatus === 'searching' || currentStatus === 'waiting')) {
      log.log('Refunding bet on leave:', currentBetAmount);
      const walletStore = useWalletStore.getState();
      try {
        await walletStore.recordWin(currentBetAmount, gameType, 'Reembolso por cancelar busqueda');
      } catch (err) {
        log.error('Error refunding bet:', err);
      }
    }

    cleanupSubscription();

    if (room) {
      await gameRoomService.leaveRoom(room.id, userId);
    }

    setRoom(null);
    setStatus('idle');
    setError(null);
    setRematchStatus('none');
    setBetAmount(null);
    betDeductedForRoomRef.current = null; // Reset bet tracking
  }, [room, userId, gameType, cleanupSubscription, setStatus]);

  // Update room (for game-specific updates)
  const updateRoom = useCallback(async (updates: Partial<GameRoom>): Promise<boolean> => {
    if (!room) return false;

    // This would be implemented based on specific needs
    // For now, it's a placeholder for game-specific updates
    log.log('updateRoom called with:', updates);
    return true;
  }, [room]);

  // Request rematch
  const requestRematch = useCallback(async () => {
    if (!room || status !== 'finished') {
      log.error('requestRematch: invalid state');
      return;
    }

    log.log('Requesting rematch for room:', room.id);
    const success = await gameRoomService.requestRematch(room.id, userId);

    if (success) {
      setRematchStatus('requested');
    } else {
      setError('Error al solicitar revancha');
    }
  }, [room, status, userId]);

  // Accept rematch
  const acceptRematch = useCallback(async () => {
    if (!room || status !== 'finished' || rematchStatus !== 'received') {
      log.error('acceptRematch: invalid state');
      return;
    }

    log.log('Accepting rematch for room:', room.id);
    const newRoom = await gameRoomService.acceptRematch(room.id, userId);

    if (newRoom) {
      setRematchStatus('accepted');
      cleanupSubscription();

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

      setStatus('playing');
      setError(null);
      setRematchStatus('none');
      subscribeToRoom(newRoom.id);
    } else {
      setError('Error al aceptar revancha');
    }
  }, [room, status, rematchStatus, userId, cleanupSubscription, setStatus, subscribeToRoom]);

  // Decline rematch
  const declineRematch = useCallback(async () => {
    if (!room || status !== 'finished') {
      log.error('declineRematch: invalid state');
      return;
    }

    log.log('Declining rematch for room:', room.id);
    await gameRoomService.declineRematch(room.id);
    setRematchStatus('none');
  }, [room, status]);

  // Submit bet proposal during negotiation
  const submitBetProposal = useCallback(async (amount: number) => {
    if (!room || status !== 'negotiating') {
      log.error('submitBetProposal: invalid state, status:', status);
      return;
    }

    const walletStore = useWalletStore.getState();
    const balance = walletStore.wallet?.balance ?? 0;

    if (amount > balance) {
      setError('Balance insuficiente para esta propuesta');
      return;
    }

    try {
      log.log('Submitting bet proposal:', amount);
      const updatedRoom = await gameRoomService.submitBetProposal(room.id, userId, amount);

      if (updatedRoom) {
        const metadata = updatedRoom.metadata as GameRoomMetadata | null;
        if (metadata?.negotiation_state === 'agreed') {
          // Deduct bet now that agreement is reached
          const betSuccess = await walletStore.placeBet(amount, gameType, 'Apuesta acordada');
          if (betSuccess) {
            betDeductedForRoomRef.current = room.id; // Mark as deducted
            setBetAmount(amount);
            setStatus('playing');
          } else {
            // If bet fails, skip betting
            await gameRoomService.skipBetting(room.id, userId);
            setStatus('playing');
          }
        }
      }
    } catch (err) {
      log.error('Error submitting bet proposal:', err);
      setError('Error al enviar propuesta');
    }
  }, [room, status, userId, gameType, setStatus]);

  // Accept opponent's bet proposal
  const acceptBetProposal = useCallback(async () => {
    if (!room || status !== 'negotiating' || !negotiation.opponentProposal) {
      log.error('acceptBetProposal: invalid state');
      return;
    }

    const walletStore = useWalletStore.getState();
    const balance = walletStore.wallet?.balance ?? 0;
    const amount = negotiation.opponentProposal;

    if (amount > balance) {
      setError('Balance insuficiente para aceptar esta apuesta');
      return;
    }

    try {
      log.log('Accepting bet proposal:', amount);
      const updatedRoom = await gameRoomService.acceptBetProposal(room.id, userId);

      if (updatedRoom) {
        // Deduct bet
        const betSuccess = await walletStore.placeBet(amount, gameType, 'Apuesta aceptada');
        if (betSuccess) {
          betDeductedForRoomRef.current = room.id; // Mark as deducted
          setBetAmount(amount);
          setStatus('playing');
        } else {
          // If bet fails, skip betting
          await gameRoomService.skipBetting(room.id, userId);
          setStatus('playing');
        }
      }
    } catch (err) {
      log.error('Error accepting bet proposal:', err);
      setError('Error al aceptar propuesta');
    }
  }, [room, status, userId, gameType, negotiation.opponentProposal, setStatus]);

  // Skip betting and start game without bet
  const skipBetting = useCallback(async () => {
    if (!room || status !== 'negotiating') {
      log.error('skipBetting: invalid state');
      return;
    }

    try {
      log.log('Skipping betting for room:', room.id);
      await gameRoomService.skipBetting(room.id, userId);
      setBetAmount(null);
      setStatus('playing');
    } catch (err) {
      log.error('Error skipping betting:', err);
      setError('Error al saltar apuesta');
    }
  }, [room, status, userId, setStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupSubscription();
    };
  }, [cleanupSubscription]);

  // Polling fallback when waiting and realtime not connected
  useEffect(() => {
    if (status !== 'waiting' || !room || connectionStatus === 'connected') return;

    log.log('Starting polling fallback for room:', room.id);

    const pollInterval = setInterval(async () => {
      try {
        const updatedRoom = await gameRoomService.getRoom(room.id);
        log.log('Poll result:', updatedRoom?.status);

        if (updatedRoom && updatedRoom.status === 'playing') {
          log.log('Opponent joined via polling');
          setRoom(updatedRoom);
          setStatus('playing');
        }
      } catch (err) {
        log.error('Polling error:', err);
      }
    }, 3000);

    return () => {
      log.log('Stopping polling');
      clearInterval(pollInterval);
    };
  }, [status, room?.id, connectionStatus, setStatus]);

  // Calculate pot total
  const potTotal = betAmount ? betAmount * 2 : 0;
  const isPrivateRoom = room?.is_private ?? false;

  return {
    // State
    status,
    room,
    error,
    connectionStatus,
    rematchStatus,
    betAmount,
    potTotal,
    isPrivateRoom,
    negotiation,

    // Actions - Matchmaking
    findMatch,
    createPrivateRoom,
    joinRoom,
    findMatchWithBet,
    createPrivateRoomWithBet,

    // Actions - Game
    leaveGame,
    updateRoom,

    // Actions - Rematch
    requestRematch,
    acceptRematch,
    declineRematch,

    // Actions - Negotiation
    submitBetProposal,
    acceptBetProposal,
    skipBetting,

    // Internal
    setStatus,
    setRoom,
    setError,
    cleanupSubscription,
    subscribeToRoom,
    statusRef,
    userIdRef,
  };
}

export default useOnlineGameCore;
