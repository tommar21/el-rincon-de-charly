'use client';

import { getClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { InsertTables, UpdateTables } from '@/types/supabase.types';

// Use Supabase generated types for database operations
type GameRoomInsert = InsertTables<'game_rooms'>;
type GameRoomUpdate = UpdateTables<'game_rooms'>;

export interface GameRoom {
  id: string;
  game_type: string;
  status: 'waiting' | 'playing' | 'finished';
  player1_id: string | null;
  player2_id: string | null;
  current_turn: string | null;
  board: string[];
  winner_id: string | null;
  is_draw: boolean;
  is_private: boolean;
  rematch_requested_by: string | null;
  rematch_room_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface GameRoomWithPlayers extends GameRoom {
  player1?: { id: string; username: string; avatar_url: string | null };
  player2?: { id: string; username: string; avatar_url: string | null };
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

interface ChannelSubscription {
  channel: RealtimeChannel;
  callbacks: Set<(room: GameRoom) => void>;
  statusCallbacks: Set<(status: ConnectionStatus) => void>;
  reconnectAttempts: number;
  reconnectTimer?: ReturnType<typeof setTimeout>;
}

class GameRoomService {
  // Map de canales compartidos por roomId (optimización: un canal por sala)
  private sharedChannels: Map<string, ChannelSubscription> = new Map();
  // Map de suscripciones individuales para cleanup
  private subscriptionToRoom: Map<string, string> = new Map();

  private get supabase() {
    return getClient();
  }

  // Crear una nueva sala
  async createRoom(playerId: string, gameType: string = 'tic-tac-toe'): Promise<GameRoom | null> {
    if (!playerId) {
      console.error('createRoom: playerId is required');
      return null;
    }

    const insertData = {
      game_type: gameType,
      player1_id: playerId,
      current_turn: playerId,
      status: 'waiting',
    } satisfies GameRoomInsert;

    // Type assertion needed due to Supabase SSR client type inference issue
    const { data, error } = await (this.supabase
      .from('game_rooms') as ReturnType<typeof this.supabase.from>)
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating room:', error);
      return null;
    }

    return data as GameRoom;
  }

  // Crear sala privada (solo accesible via link de invitacion)
  async createPrivateRoom(playerId: string, gameType: string = 'tic-tac-toe'): Promise<GameRoom | null> {
    if (!playerId) {
      console.error('createPrivateRoom: playerId is required');
      return null;
    }

    console.log('[PrivateRoom] Creating private room for player:', playerId);

    const insertData = {
      game_type: gameType,
      player1_id: playerId,
      current_turn: playerId,
      status: 'waiting',
      is_private: true,
    } satisfies GameRoomInsert;

    const { data, error } = await (this.supabase
      .from('game_rooms') as ReturnType<typeof this.supabase.from>)
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating private room:', error);
      return null;
    }

    console.log('[PrivateRoom] Created private room:', data.id);
    return data as GameRoom;
  }

  // Buscar salas disponibles
  async findAvailableRooms(gameType: string = 'tic-tac-toe'): Promise<GameRoomWithPlayers[]> {
    const { data, error } = await this.supabase
      .from('game_rooms')
      .select(`
        *,
        player1:profiles!game_rooms_player1_id_fkey(id, username, avatar_url)
      `)
      .eq('status', 'waiting')
      .eq('game_type', gameType)
      .is('player2_id', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error finding rooms:', error);
      return [];
    }

    return data as GameRoomWithPlayers[];
  }

  // Unirse a una sala
  async joinRoom(roomId: string, playerId: string): Promise<GameRoom | null> {
    if (!playerId) {
      console.error('joinRoom: playerId is required');
      return null;
    }

    if (!roomId) {
      console.error('joinRoom: roomId is required');
      return null;
    }

    const updateData = {
      player2_id: playerId,
      status: 'playing',
      updated_at: new Date().toISOString(),
    } satisfies GameRoomUpdate;

    const { data, error } = await (this.supabase
      .from('game_rooms') as ReturnType<typeof this.supabase.from>)
      .update(updateData)
      .eq('id', roomId)
      .eq('status', 'waiting')
      .is('player2_id', null)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error joining room:', error);
      return null;
    }

    // Si no hay data, la sala ya fue ocupada por otro jugador
    if (!data) {
      console.log('Room already taken or not available');
      return null;
    }

    return data as GameRoom;
  }

  // Obtener sala por ID
  async getRoom(roomId: string): Promise<GameRoomWithPlayers | null> {
    const { data, error } = await this.supabase
      .from('game_rooms')
      .select(`
        *,
        player1:profiles!game_rooms_player1_id_fkey(id, username, avatar_url),
        player2:profiles!game_rooms_player2_id_fkey(id, username, avatar_url)
      `)
      .eq('id', roomId)
      .single();

    if (error) {
      console.error('Error getting room:', error);
      return null;
    }

    return data as GameRoomWithPlayers;
  }

  // Hacer un movimiento con verificación de estado
  async makeMove(
    roomId: string,
    cellIndex: number,
    playerId: string,
    newBoard: string[],
    expectedBoard?: string[]
  ): Promise<{ success: boolean; conflict: boolean; currentRoom?: GameRoom }> {
    // Validar cellIndex
    if (cellIndex < 0 || cellIndex > 8) {
      return { success: false, conflict: false };
    }

    // Obtener sala actual para verificar estado y determinar siguiente turno
    const room = await this.getRoom(roomId);
    if (!room) return { success: false, conflict: false };

    // Verificar que es el turno del jugador
    if (room.current_turn !== playerId) {
      return { success: false, conflict: true, currentRoom: room };
    }

    // Verificar que la celda está vacía en el servidor
    const serverBoard = room.board as string[];
    if (serverBoard[cellIndex] && serverBoard[cellIndex] !== '') {
      return { success: false, conflict: true, currentRoom: room };
    }

    // Si se proporciona expectedBoard, verificar que el tablero no ha cambiado
    if (expectedBoard) {
      const boardsMatch = serverBoard.every((cell, i) => cell === expectedBoard[i]);
      if (!boardsMatch) {
        return { success: false, conflict: true, currentRoom: room };
      }
    }

    const nextTurn = room.player1_id === playerId ? room.player2_id : room.player1_id;

    // Actualizar con verificación adicional de turno (optimistic locking)
    const moveUpdateData = {
      board: newBoard,
      current_turn: nextTurn,
      updated_at: new Date().toISOString(),
    } satisfies GameRoomUpdate;

    const { data, error } = await (this.supabase
      .from('game_rooms') as ReturnType<typeof this.supabase.from>)
      .update(moveUpdateData)
      .eq('id', roomId)
      .eq('current_turn', playerId) // Solo actualiza si sigue siendo mi turno
      .eq('status', 'playing') // Solo si el juego está activo
      .select()
      .single();

    if (error || !data) {
      // El estado cambió concurrentemente, obtener estado actual
      const freshRoom = await this.getRoom(roomId);
      return { success: false, conflict: true, currentRoom: freshRoom || undefined };
    }

    return { success: true, conflict: false };
  }

  // Finalizar partida
  async endGame(roomId: string, winnerId: string | null, isDraw: boolean, finalBoard?: string[]): Promise<boolean> {
    const endGameData = {
      status: 'finished',
      winner_id: winnerId,
      is_draw: isDraw,
      updated_at: new Date().toISOString(),
      ...(finalBoard && { board: finalBoard }),
    } satisfies GameRoomUpdate;

    const { error } = await (this.supabase
      .from('game_rooms') as ReturnType<typeof this.supabase.from>)
      .update(endGameData)
      .eq('id', roomId);

    if (error) {
      console.error('Error ending game:', error);
      return false;
    }

    return true;
  }

  // Abandonar sala
  async leaveRoom(roomId: string, playerId: string): Promise<boolean> {
    const room = await this.getRoom(roomId);
    if (!room) return false;

    // Si la partida está en espera y es el creador, eliminar la sala
    if (room.status === 'waiting' && room.player1_id === playerId) {
      const { error } = await this.supabase
        .from('game_rooms')
        .delete()
        .eq('id', roomId);

      return !error;
    }

    // Si la partida está en curso, el otro jugador gana
    if (room.status === 'playing') {
      const winnerId = room.player1_id === playerId ? room.player2_id : room.player1_id;
      return this.endGame(roomId, winnerId, false);
    }

    return true;
  }

  // Suscribirse a cambios en una sala con reconexión automática y canales compartidos
  subscribeToRoom(
    roomId: string,
    callback: (room: GameRoom) => void,
    onError?: (error: Error) => void,
    onStatusChange?: (status: ConnectionStatus) => void
  ): () => void {
    const subscriptionId = `${roomId}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    this.subscriptionToRoom.set(subscriptionId, roomId);

    // Obtener o crear canal compartido para esta sala
    let subscription = this.sharedChannels.get(roomId);

    if (!subscription) {
      // Crear nuevo canal compartido para la sala
      subscription = {
        channel: null as unknown as RealtimeChannel,
        callbacks: new Set(),
        statusCallbacks: new Set(),
        reconnectAttempts: 0,
      };
      this.sharedChannels.set(roomId, subscription);

      // Función para crear/recrear el canal
      const createChannel = () => {
        const sub = this.sharedChannels.get(roomId);
        if (!sub) return;

        // Notificar estado de conexión
        const notifyStatus = (status: ConnectionStatus) => {
          sub.statusCallbacks.forEach(cb => cb(status));
        };

        notifyStatus(sub.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

        const channel = this.supabase
          .channel(`room:${roomId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'game_rooms',
              filter: `id=eq.${roomId}`,
            },
            (payload) => {
              if (payload.new) {
                // Notificar a todos los callbacks registrados
                sub.callbacks.forEach(cb => cb(payload.new as GameRoom));
              }
            }
          )
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
              console.log('[Realtime] Connected to room:', roomId);
              sub.reconnectAttempts = 0;
              notifyStatus('connected');
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.error('[Realtime] Subscription error:', status, err);
              notifyStatus('disconnected');

              // Intentar reconexión con backoff exponencial
              if (sub.reconnectAttempts < 5) {
                const delay = Math.min(1000 * Math.pow(2, sub.reconnectAttempts), 30000);
                console.log(`[Realtime] Reconnecting in ${delay}ms (attempt ${sub.reconnectAttempts + 1})`);

                sub.reconnectTimer = setTimeout(() => {
                  sub.reconnectAttempts++;
                  // Limpiar canal anterior
                  if (sub.channel) {
                    this.supabase.removeChannel(sub.channel);
                  }
                  createChannel();
                }, delay);
              } else {
                console.error('[Realtime] Max reconnection attempts reached');
                onError?.(new Error('No se pudo conectar al servidor en tiempo real'));
              }
            } else if (status === 'CLOSED') {
              notifyStatus('disconnected');
            }
          });

        sub.channel = channel;
      };

      createChannel();
    }

    // Registrar callbacks
    subscription.callbacks.add(callback);
    if (onStatusChange) {
      subscription.statusCallbacks.add(onStatusChange);
    }

    // Retornar función de cleanup
    return () => {
      const sub = this.sharedChannels.get(roomId);
      if (sub) {
        sub.callbacks.delete(callback);
        if (onStatusChange) {
          sub.statusCallbacks.delete(onStatusChange);
        }

        // Si no quedan callbacks, limpiar el canal compartido
        if (sub.callbacks.size === 0) {
          if (sub.reconnectTimer) {
            clearTimeout(sub.reconnectTimer);
          }
          if (sub.channel) {
            this.supabase.removeChannel(sub.channel);
          }
          this.sharedChannels.delete(roomId);
        }
      }
      this.subscriptionToRoom.delete(subscriptionId);
    };
  }

  // Buscar partida (matchmaking atomico para evitar race conditions)
  async findOrCreateMatch(playerId: string, gameType: string = 'tic-tac-toe'): Promise<GameRoom | null> {
    if (!playerId) {
      console.error('findOrCreateMatch: playerId is required');
      return null;
    }

    console.log('[Matchmaking] Finding or creating match for player:', playerId);

    // Usar funcion RPC atomica para evitar race conditions
    // cuando 2 jugadores buscan partida simultaneamente
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase.rpc as any)('find_or_create_match', {
      p_player_id: playerId,
      p_game_type: gameType
    });

    if (error) {
      console.error('[Matchmaking] RPC error:', error);
      return null;
    }

    if (!data) {
      console.error('[Matchmaking] No data returned from RPC');
      return null;
    }

    const room = data as GameRoom;
    console.log('[Matchmaking] Result:', room.status === 'playing' ? 'Joined existing room' : 'Created new room', room.id);

    return room;
  }

  // Unirse a una sala específica por ID (para links compartidos)
  async joinRoomById(roomId: string, playerId: string): Promise<{ room: GameRoom | null; error: string | null }> {
    if (!playerId) {
      return { room: null, error: 'Usuario no autenticado' };
    }

    if (!roomId) {
      return { room: null, error: 'ID de sala no válido' };
    }

    // Verificar que la sala existe y está disponible
    const room = await this.getRoom(roomId);
    if (!room) {
      return { room: null, error: 'Sala no encontrada' };
    }

    if (room.status !== 'waiting') {
      return { room: null, error: 'Esta sala ya no está disponible' };
    }

    if (room.player2_id !== null) {
      return { room: null, error: 'Esta sala ya está llena' };
    }

    if (room.player1_id === playerId) {
      // Es el creador de la sala, devolver la sala existente
      return { room: room, error: null };
    }

    // Intentar unirse
    const joinedRoom = await this.joinRoom(roomId, playerId);
    if (!joinedRoom) {
      return { room: null, error: 'No se pudo unir a la sala' };
    }

    return { room: joinedRoom, error: null };
  }

  // Solicitar revancha
  async requestRematch(roomId: string, playerId: string): Promise<boolean> {
    if (!roomId || !playerId) {
      console.error('requestRematch: roomId and playerId are required');
      return false;
    }

    const room = await this.getRoom(roomId);
    if (!room || room.status !== 'finished') {
      console.error('requestRematch: room not found or not finished');
      return false;
    }

    // Verificar que el jugador es parte de esta sala
    if (room.player1_id !== playerId && room.player2_id !== playerId) {
      console.error('requestRematch: player is not part of this room');
      return false;
    }

    const updateData = {
      rematch_requested_by: playerId,
      updated_at: new Date().toISOString(),
    } satisfies GameRoomUpdate;

    const { error } = await (this.supabase
      .from('game_rooms') as ReturnType<typeof this.supabase.from>)
      .update(updateData)
      .eq('id', roomId);

    if (error) {
      console.error('Error requesting rematch:', error);
      return false;
    }

    return true;
  }

  // Aceptar revancha - crea nueva sala con roles invertidos
  async acceptRematch(roomId: string, playerId: string): Promise<GameRoom | null> {
    if (!roomId || !playerId) {
      console.error('acceptRematch: roomId and playerId are required');
      return null;
    }

    const room = await this.getRoom(roomId);
    if (!room || room.status !== 'finished') {
      console.error('acceptRematch: room not found or not finished');
      return null;
    }

    // Verificar que hay una solicitud de revancha pendiente
    if (!room.rematch_requested_by) {
      console.error('acceptRematch: no rematch request pending');
      return null;
    }

    // El que acepta debe ser el otro jugador (no el que solicitó)
    if (room.rematch_requested_by === playerId) {
      console.error('acceptRematch: cannot accept your own rematch request');
      return null;
    }

    // Verificar que el jugador es parte de esta sala
    if (room.player1_id !== playerId && room.player2_id !== playerId) {
      console.error('acceptRematch: player is not part of this room');
      return null;
    }

    // Crear nueva sala con roles invertidos
    // El que era player2 ahora es player1 (y empieza)
    const newPlayer1 = room.player2_id;
    const newPlayer2 = room.player1_id;

    const insertData = {
      game_type: room.game_type,
      player1_id: newPlayer1,
      player2_id: newPlayer2,
      current_turn: newPlayer1, // El nuevo player1 empieza
      status: 'playing',
    } satisfies GameRoomInsert;

    const { data, error } = await (this.supabase
      .from('game_rooms') as ReturnType<typeof this.supabase.from>)
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating rematch room:', error);
      return null;
    }

    const newRoom = data as GameRoom;

    // Guardar el ID de la nueva sala en la sala anterior
    // Esto permite que el jugador que solicito la revancha sea notificado
    // y pueda unirse a la nueva sala
    await (this.supabase
      .from('game_rooms') as ReturnType<typeof this.supabase.from>)
      .update({
        rematch_room_id: newRoom.id,
        rematch_requested_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', roomId);

    return newRoom;
  }

  // Rechazar/cancelar revancha
  async declineRematch(roomId: string): Promise<boolean> {
    return this.clearRematchRequest(roomId);
  }

  // Limpiar solicitud de revancha
  private async clearRematchRequest(roomId: string): Promise<boolean> {
    const updateData = {
      rematch_requested_by: null,
      updated_at: new Date().toISOString(),
    } satisfies GameRoomUpdate;

    const { error } = await (this.supabase
      .from('game_rooms') as ReturnType<typeof this.supabase.from>)
      .update(updateData)
      .eq('id', roomId);

    if (error) {
      console.error('Error clearing rematch request:', error);
      return false;
    }

    return true;
  }
}

export const gameRoomService = new GameRoomService();
export default gameRoomService;
