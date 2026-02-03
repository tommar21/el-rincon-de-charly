-- Agregar soporte de apuestas al sistema de matchmaking
-- Las apuestas se almacenan en el campo metadata de game_rooms

-- Agregar columna metadata si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_rooms' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE game_rooms ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
END $$;

-- Crear indice para matchmaking con apuestas
-- Permite buscar salas publicas con un monto de apuesta especifico
CREATE INDEX IF NOT EXISTS idx_game_rooms_betting_matchmaking
ON game_rooms ((metadata->>'bet_amount'), game_type, status, created_at)
WHERE status = 'waiting' AND is_private = false AND player2_id IS NULL;

-- Funcion atomica para matchmaking CON apuestas
-- Solo empareja jugadores que apuestan el mismo monto
CREATE OR REPLACE FUNCTION find_or_create_match_with_bet(
  p_player_id UUID,
  p_game_type TEXT DEFAULT 'tic-tac-toe',
  p_bet_amount DECIMAL DEFAULT NULL
)
RETURNS game_rooms
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room game_rooms;
  v_new_room game_rooms;
  v_metadata JSONB;
BEGIN
  -- Construir metadata con el monto de apuesta
  IF p_bet_amount IS NOT NULL AND p_bet_amount > 0 THEN
    v_metadata := jsonb_build_object('bet_amount', p_bet_amount);
  ELSE
    v_metadata := '{}'::jsonb;
  END IF;

  -- Buscar sala PUBLICA en espera con la MISMA apuesta (o sin apuesta si p_bet_amount es NULL)
  -- Usar FOR UPDATE SKIP LOCKED para evitar race conditions
  SELECT * INTO v_room
  FROM game_rooms
  WHERE game_type = p_game_type
    AND status = 'waiting'
    AND is_private = false
    AND player1_id != p_player_id
    AND player2_id IS NULL
    AND (
      -- Emparejar salas sin apuesta con jugadores sin apuesta
      (p_bet_amount IS NULL AND (metadata IS NULL OR metadata->>'bet_amount' IS NULL))
      OR
      -- Emparejar salas con EXACTAMENTE el mismo monto de apuesta
      (p_bet_amount IS NOT NULL AND (metadata->>'bet_amount')::decimal = p_bet_amount)
    )
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
    -- No hay salas disponibles con el mismo monto, crear una nueva
    INSERT INTO game_rooms (
      game_type,
      player1_id,
      current_turn,
      status,
      board,
      is_private,
      metadata
    )
    VALUES (
      p_game_type,
      p_player_id,
      p_player_id,
      'waiting',
      '["", "", "", "", "", "", "", "", ""]'::jsonb,
      false,
      v_metadata
    )
    RETURNING * INTO v_new_room;

    RETURN v_new_room;
  END IF;
END;
$$;

-- Dar permisos a usuarios autenticados
GRANT EXECUTE ON FUNCTION find_or_create_match_with_bet(UUID, TEXT, DECIMAL) TO authenticated;
