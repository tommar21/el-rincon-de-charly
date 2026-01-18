import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/client/providers';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'El Rincon de Charly - Juegos de Mesa Online',
    template: '%s | El Rincon de Charly',
  },
  description:
    'Juega juegos de mesa gratis: Tic Tac Toe, Conecta 4, Ajedrez y mas. Juega contra la IA, con amigos en local o en linea.',
  keywords: [
    'juegos de mesa',
    'tic tac toe',
    'ta te ti',
    'conecta 4',
    'ajedrez',
    'damas',
    'online',
    'multijugador',
    'IA',
    'gratis',
  ],
  authors: [{ name: 'Tomi' }],
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    title: 'El Rincon de Charly - Juegos de Mesa Online',
    description:
      'Juega juegos de mesa gratis contra la IA o con amigos. Tic Tac Toe, Conecta 4, Ajedrez y mas.',
  },
  twitter: {
    card: 'summary',
    title: 'El Rincon de Charly - Juegos de Mesa Online',
    description: 'Juega juegos de mesa gratis contra la IA o con amigos',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
