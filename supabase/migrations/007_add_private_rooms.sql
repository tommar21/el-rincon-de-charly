-- Agregar columna is_private para distinguir salas publicas de privadas
-- Las salas privadas solo son accesibles via link de invitacion

ALTER TABLE game_rooms
ADD COLUMN is_private BOOLEAN NOT NULL DEFAULT false;

-- Crear indice parcial para queries de matchmaking (solo salas publicas en waiting)
CREATE INDEX idx_game_rooms_public_matchmaking
ON game_rooms (game_type, status, created_at)
WHERE status = 'waiting' AND is_private = false AND player2_id IS NULL;

-- Modificar funcion de matchmaking para excluir salas privadas
CREATE OR REPLACE FUNCTION find_or_create_match(
  p_player_id UUID,
  p_game_type TEXT DEFAULT 'tic-tac-toe'
)
RETURNS game_rooms
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room game_rooms;
  v_new_room game_rooms;
BEGIN
  -- Buscar sala PUBLICA en espera donde el jugador NO sea el creador
  -- Usar FOR UPDATE SKIP LOCKED para evitar que 2 jugadores se unan a la misma sala
  SELECT * INTO v_room
  FROM game_rooms
  WHERE game_type = p_game_type
    AND status = 'waiting'
    AND is_private = false  -- Solo salas publicas
    AND player1_id != p_player_id
    AND player2_id IS NULL
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_room IS NOT NULL THEN
    -- Unirse a la sala existente
    UPDATE game_rooms
    SET
      player2_id = p_player_id,
      status = 'playing',
      updated_at = NOW()
    WHERE id = v_room.id
    RETURNING * INTO v_room;

    RETURN v_room;
  ELSE
    -- No hay salas publicas disponibles, crear una nueva sala PUBLICA
    INSERT INTO game_rooms (
      game_type,
      player1_id,
      current_turn,
      status,
      board,
      is_private
    )
    VALUES (
      p_game_type,
      p_player_id,
      p_player_id,
      'waiting',
      '["", "", "", "", "", "", "", "", ""]'::jsonb,
      false  -- Sala publica
    )
    RETURNING * INTO v_new_room;

    RETURN v_new_room;
  END IF;
END;
$$;

-- Dar permisos a usuarios autenticados
GRANT EXECUTE ON FUNCTION find_or_create_match(UUID, TEXT) TO authenticated;
