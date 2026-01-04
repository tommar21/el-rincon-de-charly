# Roadmap - Plataforma de Juegos

## Completado

### Fase 1: Setup Base
- [x] Migrar de vanilla JS a React + TypeScript + Vite
- [x] Configurar Tailwind CSS
- [x] Estructura de carpetas escalable (features/)

### Fase 2: Juego Core - Tic Tac Toe
- [x] Logica del juego (gameLogic.ts)
- [x] IA con Minimax y alpha-beta pruning
- [x] 4 niveles de dificultad (facil, medio, dificil, imposible)
- [x] Componentes: Board, Cell, XMark, OMark
- [x] Animaciones con Framer Motion
- [x] Modo local (2 jugadores)
- [x] Modo vs IA

### Fase 3: Temas Visuales
- [x] Sistema de temas con CSS variables
- [x] 3 temas: Neon (default), Dark, Light
- [x] ThemeProvider con persistencia localStorage
- [x] ThemeSelector component

### Fase 4: PWA + Mobile First
- [x] Configuracion PWA con vite-plugin-pwa
- [x] Manifest y service worker
- [x] Responsive design
- [x] Touch-friendly

### Fase 5: Autenticacion (Parcial)
- [x] Integracion Supabase client
- [x] Auth store con Zustand
- [x] Hook useAuth
- [x] AuthModal component
- [x] UserMenu component
- [x] Login/registro con email (requiere config Supabase)

### Fase 6-7: Stats y Leaderboard
- [x] Stats store con persistencia local
- [x] Tracking de partidas, victorias, rachas
- [x] Stats por oponente
- [x] StatsDisplay y StatsModal
- [x] Leaderboard component
- [x] LeaderboardModal
- [x] Sincronizacion de stats con Supabase

### Fase 8: Multiplayer Online
- [x] Tabla game_rooms con Supabase
- [x] GameRoomService para operaciones de sala
- [x] useOnlineGame hook con Realtime
- [x] Matchmaking simple (buscar/crear sala)
- [x] UI para modo online integrada

---

## Pendiente

### Fase 5b: Google OAuth
Configurar autenticacion con Google:

1. **Google Cloud Console**
   - Crear proyecto en console.cloud.google.com
   - APIs & Services > Credentials > Create OAuth client ID
   - Configurar OAuth consent screen
   - Application type: Web application
   - Authorized redirect URI: `https://TU-PROYECTO.supabase.co/auth/v1/callback`
   - Obtener Client ID y Client Secret

2. **Supabase Dashboard**
   - Authentication > Providers > Google
   - Pegar Client ID y Client Secret
   - Habilitar provider

### Fase 9: Arquitectura Multi-juego
- [ ] Abstraccion de logica de juegos
- [ ] Sistema de plugins para nuevos juegos
- [ ] Selector de juegos en menu principal
- [ ] Juegos candidatos:
  - Connect 4
  - Batalla Naval
  - Memory
  - Snake

### Fase 10: Polish y Testing
- [x] Unit tests con Vitest (57 tests)
- [x] Optimizacion de bundle (code-splitting)
- [x] E2E tests con Playwright (configurado)
- [x] SEO y meta tags (Open Graph, Twitter, JSON-LD)
- [ ] Analytics (opcional)

---

## Configuracion Supabase

Variables de entorno necesarias (`.env`):
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=tu-publishable-key
```

SQL para crear tablas:
```sql
-- Ver archivo en docs/supabase-schema.sql
```
