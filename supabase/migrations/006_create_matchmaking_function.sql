-- Funcion atomica para matchmaking que evita race conditions
-- cuando 2 jugadores buscan partida simultaneamente

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
  -- Buscar una sala en espera donde el jugador NO sea el creador
  -- Usar FOR UPDATE SKIP LOCKED para evitar que 2 jugadores se unan a la misma sala
  SELECT * INTO v_room
  FROM game_rooms
  WHERE game_type = p_game_type
    AND status = 'waiting'
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
    -- No hay salas disponibles, crear una nueva
    INSERT INTO game_rooms (
      game_type,
      player1_id,
      current_turn,
      status,
      board
    )
    VALUES (
      p_game_type,
      p_player_id,
      p_player_id,
      'waiting',
      '["", "", "", "", "", "", "", "", ""]'::jsonb
    )
    RETURNING * INTO v_new_room;

    RETURN v_new_room;
  END IF;
END;
$$;

-- Dar permisos a usuarios autenticados
GRANT EXECUTE ON FUNCTION find_or_create_match(UUID, TEXT) TO authenticated;
