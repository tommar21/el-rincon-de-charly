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
  created_at: string;
  updated_at: string;
}

export interface GameRoomWithPlayers extends GameRoom {
  player1?: { id: string; username: string; avatar_url: string | null };
  player2?: { id: string; username: string; avatar_url: string | null };
}

class GameRoomService {
  private channel: RealtimeChannel | null = null;

  private get supabase() {
    return getClient();
  }

  // Crear una nueva sala
  async createRoom(playerId: string, gameType: string = 'tic-tac-toe'): Promise<GameRoom | null> {
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
  async endGame(roomId: string, winnerId: string | null, isDraw: boolean): Promise<boolean> {
    const endGameData = {
      status: 'finished',
      winner_id: winnerId,
      is_draw: isDraw,
      updated_at: new Date().toISOString(),
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

  // Suscribirse a cambios en una sala
  subscribeToRoom(roomId: string, callback: (room: GameRoom) => void): () => void {
    this.channel = this.supabase
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
            callback(payload.new as GameRoom);
          }
        }
      )
      .subscribe();

    return () => {
      if (this.channel) {
        this.supabase.removeChannel(this.channel);
        this.channel = null;
      }
    };
  }

  // Buscar partida (matchmaking simple)
  async findOrCreateMatch(playerId: string, gameType: string = 'tic-tac-toe'): Promise<GameRoom | null> {
    // Buscar sala disponible
    const rooms = await this.findAvailableRooms(gameType);
    const availableRoom = rooms.find(r => r.player1_id !== playerId);

    if (availableRoom) {
      // Unirse a sala existente
      return this.joinRoom(availableRoom.id, playerId);
    }

    // Crear nueva sala
    return this.createRoom(playerId, gameType);
  }
}

export const gameRoomService = new GameRoomService();
export default gameRoomService;
