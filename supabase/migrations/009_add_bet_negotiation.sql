-- Sistema de negociación de apuestas post-match
-- En lugar de filtrar por monto exacto, los jugadores se conectan primero
-- y luego negocian la apuesta si ambos quieren apostar montos diferentes

-- Metadata structure para negociación:
-- {
--   "bet_amount": number | null,           -- Monto acordado final (después de negociación)
--   "negotiation_state": string,           -- 'none', 'pending', 'agreed', 'no_bet'
--   "player1_bet_proposal": number | null, -- Propuesta de apuesta del jugador 1
--   "player2_bet_proposal": number | null, -- Propuesta de apuesta del jugador 2
--   "negotiation_deadline": string | null  -- ISO timestamp de cuando expira la negociación
-- }

-- Nueva función de matchmaking que NO filtra por apuesta
-- Los jugadores se emparejan primero, luego negocian
CREATE OR REPLACE FUNCTION find_or_create_match_v2(
  p_player_id UUID,
  p_game_type TEXT DEFAULT 'tic-tac-toe',
  p_wants_bet BOOLEAN DEFAULT false,
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
  v_other_wants_bet BOOLEAN;
  v_other_amount DECIMAL;
  v_negotiation_state TEXT;
  v_deadline TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Buscar sala PUBLICA en espera (sin filtrar por apuesta)
  SELECT * INTO v_room
  FROM game_rooms
  WHERE game_type = p_game_type
    AND status = 'waiting'
    AND is_private = false
    AND player1_id != p_player_id
    AND player2_id IS NULL
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_room IS NOT NULL THEN
    -- Hay una sala disponible, determinar estado de negociación
    v_other_wants_bet := COALESCE((v_room.metadata->>'player1_bet_proposal')::decimal, 0) > 0;
    v_other_amount := COALESCE((v_room.metadata->>'player1_bet_proposal')::decimal, 0);

    -- Determinar estado de negociación basado en preferencias de ambos
    IF NOT p_wants_bet AND NOT v_other_wants_bet THEN
      -- Ninguno quiere apostar
      v_negotiation_state := 'none';
      v_metadata := jsonb_build_object(
        'negotiation_state', 'none',
        'bet_amount', NULL
      );
    ELSIF p_wants_bet AND v_other_wants_bet AND p_bet_amount = v_other_amount THEN
      -- Ambos quieren apostar el mismo monto - acuerdo inmediato
      v_negotiation_state := 'agreed';
      v_metadata := jsonb_build_object(
        'negotiation_state', 'agreed',
        'bet_amount', p_bet_amount,
        'player1_bet_proposal', v_other_amount,
        'player2_bet_proposal', p_bet_amount
      );
    ELSIF p_wants_bet AND v_other_wants_bet THEN
      -- Ambos quieren apostar pero montos diferentes - iniciar negociación
      v_deadline := NOW() + INTERVAL '30 seconds';
      v_negotiation_state := 'pending';
      v_metadata := jsonb_build_object(
        'negotiation_state', 'pending',
        'bet_amount', NULL,
        'player1_bet_proposal', v_other_amount,
        'player2_bet_proposal', p_bet_amount,
        'negotiation_deadline', v_deadline
      );
    ELSE
      -- Solo uno quiere apostar - sin apuesta
      v_negotiation_state := 'no_bet';
      v_metadata := jsonb_build_object(
        'negotiation_state', 'no_bet',
        'bet_amount', NULL,
        'player1_bet_proposal', CASE WHEN v_other_wants_bet THEN v_other_amount ELSE NULL END,
        'player2_bet_proposal', CASE WHEN p_wants_bet THEN p_bet_amount ELSE NULL END
      );
    END IF;

    -- Unirse a la sala y actualizar metadata con estado de negociación
    UPDATE game_rooms
    SET
      player2_id = p_player_id,
      status = CASE WHEN v_negotiation_state = 'pending' THEN 'waiting' ELSE 'playing' END,
      metadata = v_metadata,
      updated_at = NOW()
    WHERE id = v_room.id
    RETURNING * INTO v_room;

    RETURN v_room;
  ELSE
    -- No hay salas disponibles, crear una nueva
    -- Guardar preferencia de apuesta del creador
    IF p_wants_bet AND p_bet_amount IS NOT NULL AND p_bet_amount > 0 THEN
      v_metadata := jsonb_build_object(
        'player1_bet_proposal', p_bet_amount,
        'negotiation_state', 'none'
      );
    ELSE
      v_metadata := jsonb_build_object(
        'player1_bet_proposal', NULL,
        'negotiation_state', 'none'
      );
    END IF;

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

-- Función para enviar/actualizar propuesta de apuesta durante negociación
CREATE OR REPLACE FUNCTION submit_bet_proposal(
  p_room_id UUID,
  p_player_id UUID,
  p_amount DECIMAL
)
RETURNS game_rooms
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room game_rooms;
  v_is_player1 BOOLEAN;
  v_other_proposal DECIMAL;
  v_new_metadata JSONB;
  v_deadline TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Obtener sala con lock
  SELECT * INTO v_room
  FROM game_rooms
  WHERE id = p_room_id
  FOR UPDATE;

  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  -- Verificar que el jugador es parte de la sala
  v_is_player1 := v_room.player1_id = p_player_id;
  IF NOT v_is_player1 AND v_room.player2_id != p_player_id THEN
    RAISE EXCEPTION 'Player not in room';
  END IF;

  -- Verificar que estamos en estado de negociación
  IF v_room.metadata->>'negotiation_state' != 'pending' THEN
    RAISE EXCEPTION 'Not in negotiation state';
  END IF;

  -- Obtener propuesta del otro jugador
  IF v_is_player1 THEN
    v_other_proposal := (v_room.metadata->>'player2_bet_proposal')::decimal;
  ELSE
    v_other_proposal := (v_room.metadata->>'player1_bet_proposal')::decimal;
  END IF;

  -- Verificar si hay acuerdo
  IF p_amount = v_other_proposal THEN
    -- Acuerdo alcanzado
    v_new_metadata := v_room.metadata || jsonb_build_object(
      'negotiation_state', 'agreed',
      'bet_amount', p_amount,
      CASE WHEN v_is_player1 THEN 'player1_bet_proposal' ELSE 'player2_bet_proposal' END, p_amount
    );

    UPDATE game_rooms
    SET
      metadata = v_new_metadata,
      status = 'playing',
      updated_at = NOW()
    WHERE id = p_room_id
    RETURNING * INTO v_room;
  ELSE
    -- Actualizar propuesta y extender deadline
    v_deadline := NOW() + INTERVAL '30 seconds';
    v_new_metadata := v_room.metadata || jsonb_build_object(
      CASE WHEN v_is_player1 THEN 'player1_bet_proposal' ELSE 'player2_bet_proposal' END, p_amount,
      'negotiation_deadline', v_deadline
    );

    UPDATE game_rooms
    SET
      metadata = v_new_metadata,
      updated_at = NOW()
    WHERE id = p_room_id
    RETURNING * INTO v_room;
  END IF;

  RETURN v_room;
END;
$$;

-- Función para aceptar la propuesta del oponente
CREATE OR REPLACE FUNCTION accept_bet_proposal(
  p_room_id UUID,
  p_player_id UUID
)
RETURNS game_rooms
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room game_rooms;
  v_is_player1 BOOLEAN;
  v_other_proposal DECIMAL;
  v_new_metadata JSONB;
BEGIN
  -- Obtener sala con lock
  SELECT * INTO v_room
  FROM game_rooms
  WHERE id = p_room_id
  FOR UPDATE;

  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  -- Verificar que el jugador es parte de la sala
  v_is_player1 := v_room.player1_id = p_player_id;
  IF NOT v_is_player1 AND v_room.player2_id != p_player_id THEN
    RAISE EXCEPTION 'Player not in room';
  END IF;

  -- Verificar estado de negociación
  IF v_room.metadata->>'negotiation_state' != 'pending' THEN
    RAISE EXCEPTION 'Not in negotiation state';
  END IF;

  -- Obtener propuesta del otro jugador
  IF v_is_player1 THEN
    v_other_proposal := (v_room.metadata->>'player2_bet_proposal')::decimal;
  ELSE
    v_other_proposal := (v_room.metadata->>'player1_bet_proposal')::decimal;
  END IF;

  IF v_other_proposal IS NULL OR v_other_proposal <= 0 THEN
    RAISE EXCEPTION 'No valid proposal to accept';
  END IF;

  -- Aceptar propuesta del oponente
  v_new_metadata := v_room.metadata || jsonb_build_object(
    'negotiation_state', 'agreed',
    'bet_amount', v_other_proposal,
    CASE WHEN v_is_player1 THEN 'player1_bet_proposal' ELSE 'player2_bet_proposal' END, v_other_proposal
  );

  UPDATE game_rooms
  SET
    metadata = v_new_metadata,
    status = 'playing',
    updated_at = NOW()
  WHERE id = p_room_id
  RETURNING * INTO v_room;

  RETURN v_room;
END;
$$;

-- Función para saltar la apuesta y comenzar sin apostar
CREATE OR REPLACE FUNCTION skip_betting(
  p_room_id UUID,
  p_player_id UUID
)
RETURNS game_rooms
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room game_rooms;
  v_new_metadata JSONB;
BEGIN
  -- Obtener sala con lock
  SELECT * INTO v_room
  FROM game_rooms
  WHERE id = p_room_id
  FOR UPDATE;

  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  -- Verificar que el jugador es parte de la sala
  IF v_room.player1_id != p_player_id AND v_room.player2_id != p_player_id THEN
    RAISE EXCEPTION 'Player not in room';
  END IF;

  -- Actualizar a estado sin apuesta
  v_new_metadata := v_room.metadata || jsonb_build_object(
    'negotiation_state', 'no_bet',
    'bet_amount', NULL
  );

  UPDATE game_rooms
  SET
    metadata = v_new_metadata,
    status = 'playing',
    updated_at = NOW()
  WHERE id = p_room_id
  RETURNING * INTO v_room;

  RETURN v_room;
END;
$$;

-- Función para verificar timeout de negociación (llamada por el cliente)
CREATE OR REPLACE FUNCTION check_negotiation_timeout(
  p_room_id UUID
)
RETURNS game_rooms
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room game_rooms;
  v_deadline TIMESTAMP WITH TIME ZONE;
  v_new_metadata JSONB;
BEGIN
  -- Obtener sala
  SELECT * INTO v_room
  FROM game_rooms
  WHERE id = p_room_id
  FOR UPDATE;

  IF v_room IS NULL THEN
    RETURN NULL;
  END IF;

  -- Solo procesar si está en estado pending
  IF v_room.metadata->>'negotiation_state' != 'pending' THEN
    RETURN v_room;
  END IF;

  -- Verificar deadline
  v_deadline := (v_room.metadata->>'negotiation_deadline')::timestamp with time zone;

  IF v_deadline IS NOT NULL AND NOW() > v_deadline THEN
    -- Timeout - continuar sin apuesta
    v_new_metadata := v_room.metadata || jsonb_build_object(
      'negotiation_state', 'no_bet',
      'bet_amount', NULL
    );

    UPDATE game_rooms
    SET
      metadata = v_new_metadata,
      status = 'playing',
      updated_at = NOW()
    WHERE id = p_room_id
    RETURNING * INTO v_room;
  END IF;

  RETURN v_room;
END;
$$;

-- Dar permisos a usuarios autenticados
GRANT EXECUTE ON FUNCTION find_or_create_match_v2(UUID, TEXT, BOOLEAN, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION submit_bet_proposal(UUID, UUID, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_bet_proposal(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION skip_betting(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_negotiation_timeout(UUID) TO authenticated;

-- Índice para mejorar búsqueda de salas en negociación
CREATE INDEX IF NOT EXISTS idx_game_rooms_negotiation
ON game_rooms ((metadata->>'negotiation_state'))
WHERE metadata->>'negotiation_state' = 'pending';
