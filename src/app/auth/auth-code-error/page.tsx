import Link from 'next/link';

export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-(--color-error) mb-4">
          Error de autenticacion
        </h1>
        <p className="text-(--color-text-muted) mb-6">
          Hubo un problema al iniciar sesion. Por favor, intenta de nuevo.
        </p>
        <Link
          href="/games"
          className="px-6 py-3 rounded-lg bg-(--color-primary) text-black font-semibold hover:brightness-110 transition-all"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
