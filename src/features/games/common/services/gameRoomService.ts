import { supabase } from '../../../../services/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

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

  // Crear una nueva sala
  async createRoom(playerId: string, gameType: string = 'tic-tac-toe'): Promise<GameRoom | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('game_rooms')
      .insert({
        game_type: gameType,
        player1_id: playerId,
        current_turn: playerId,
        status: 'waiting',
      } as never)
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
    if (!supabase) return [];

    const { data, error } = await supabase
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
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('game_rooms')
      .update({
        player2_id: playerId,
        status: 'playing',
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', roomId)
      .eq('status', 'waiting')
      .is('player2_id', null)
      .select()
      .single();

    if (error) {
      console.error('Error joining room:', error);
      return null;
    }

    return data as GameRoom;
  }

  // Obtener sala por ID
  async getRoom(roomId: string): Promise<GameRoomWithPlayers | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
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

  // Hacer un movimiento
  async makeMove(roomId: string, _cellIndex: number, playerId: string, newBoard: string[]): Promise<boolean> {
    if (!supabase) return false;

    // Obtener sala actual para determinar el siguiente turno
    const room = await this.getRoom(roomId);
    if (!room) return false;

    const nextTurn = room.player1_id === playerId ? room.player2_id : room.player1_id;

    const { error } = await supabase
      .from('game_rooms')
      .update({
        board: newBoard,
        current_turn: nextTurn,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', roomId)
      .eq('current_turn', playerId);

    if (error) {
      console.error('Error making move:', error);
      return false;
    }

    return true;
  }

  // Finalizar partida
  async endGame(roomId: string, winnerId: string | null, isDraw: boolean): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
      .from('game_rooms')
      .update({
        status: 'finished',
        winner_id: winnerId,
        is_draw: isDraw,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', roomId);

    if (error) {
      console.error('Error ending game:', error);
      return false;
    }

    return true;
  }

  // Abandonar sala
  async leaveRoom(roomId: string, playerId: string): Promise<boolean> {
    if (!supabase) return false;

    const room = await this.getRoom(roomId);
    if (!room) return false;

    // Si la partida está en espera y es el creador, eliminar la sala
    if (room.status === 'waiting' && room.player1_id === playerId) {
      const { error } = await supabase
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
    if (!supabase) return () => {};

    this.channel = supabase
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
        supabase?.removeChannel(this.channel);
        this.channel = null;
      }
    };
  }

  // Buscar partida (matchmaking simple)
  async findOrCreateMatch(playerId: string, gameType: string = 'tic-tac-toe'): Promise<GameRoom | null> {
    if (!supabase) return null;

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
