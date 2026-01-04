-- ===========================================
-- Supabase Schema para Plataforma de Juegos
-- ===========================================

-- Tabla de perfiles de usuario
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de estadisticas por juego
CREATE TABLE game_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL DEFAULT 'tic-tac-toe',
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  games_lost INTEGER DEFAULT 0,
  games_draw INTEGER DEFAULT 0,
  best_win_streak INTEGER DEFAULT 0,
  total_play_time INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, game_type)
);

-- Habilitar Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;

-- Politicas de acceso
CREATE POLICY "Perfiles publicos para lectura"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Usuarios pueden editar su perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Stats publicas para lectura"
  ON game_stats FOR SELECT
  USING (true);

CREATE POLICY "Usuarios pueden gestionar sus stats"
  ON game_stats FOR ALL
  USING (auth.uid() = user_id);

-- Trigger para crear perfil automaticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ===========================================
-- Tablas para Multiplayer (Fase 8)
-- ===========================================

-- Descomentar cuando se implemente multiplayer:

-- CREATE TABLE game_rooms (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   game_type TEXT NOT NULL DEFAULT 'tic-tac-toe',
--   status TEXT DEFAULT 'waiting', -- waiting, playing, finished
--   player1_id UUID REFERENCES profiles(id),
--   player2_id UUID REFERENCES profiles(id),
--   current_turn UUID,
--   game_state JSONB DEFAULT '{}',
--   winner_id UUID REFERENCES profiles(id),
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- CREATE TABLE game_moves (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
--   player_id UUID REFERENCES profiles(id),
--   move_data JSONB NOT NULL,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );
