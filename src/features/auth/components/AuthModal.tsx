import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../../../lib/utils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'login' | 'register';

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const { signIn, signUp, signInWithProvider, isConfigured } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          onClose();
        }
      } else {
        if (!username.trim()) {
          setError('Username is required');
          setIsSubmitting(false);
          return;
        }
        const { error } = await signUp(email, password, username);
        if (error) {
          setError(error.message);
        } else {
          setError(null);
          setRegistrationSuccess(true);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    const { error } = await signInWithProvider('google');
    if (error) {
      setError(error.message);
    }
  };

  if (!isConfigured) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div
              className="bg-[var(--color-surface)] rounded-2xl w-full max-w-md p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                <X size={24} />
              </button>

              {/* Registration Success Screen */}
              {registrationSuccess ? (
                <div className="text-center py-6">
                  <CheckCircle className="mx-auto mb-4 text-green-400" size={64} />
                  <h2 className="text-2xl font-bold mb-2 text-[var(--color-text)]">
                    ¡Registro exitoso!
                  </h2>
                  <p className="text-[var(--color-text-muted)] mb-6">
                    Revisa tu email <span className="text-[var(--color-primary)]">{email}</span> y
                    haz clic en el enlace para confirmar tu cuenta.
                  </p>
                  <button
                    onClick={() => {
                      setRegistrationSuccess(false);
                      setMode('login');
                      setEmail('');
                      setPassword('');
                      setUsername('');
                    }}
                    className={cn(
                      'px-6 py-3 rounded-lg font-semibold',
                      'bg-[var(--color-primary)] text-black',
                      'hover:brightness-110 transition-all'
                    )}
                  >
                    Ir a Iniciar Sesion
                  </button>
                </div>
              ) : (
                <>
              {/* Title */}
              <h2 className="text-2xl font-bold text-center mb-6 text-gradient">
                {mode === 'login' ? 'Iniciar Sesion' : 'Crear Cuenta'}
              </h2>

              {/* Google login button */}
              <button
                onClick={handleGoogleLogin}
                className={cn(
                  'w-full flex items-center justify-center gap-3 py-3 rounded-lg mb-6',
                  'bg-white text-gray-800 font-medium',
                  'hover:bg-gray-100 transition-colors'
                )}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuar con Google
              </button>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--color-text-muted)]/20" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[var(--color-surface)] text-[var(--color-text-muted)]">
                    o continua con email
                  </span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div className="relative">
                    <User
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                      size={20}
                    />
                    <input
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={cn(
                        'w-full pl-10 pr-4 py-3 rounded-lg',
                        'bg-[var(--color-background)] text-[var(--color-text)]',
                        'border border-[var(--color-text-muted)]/20',
                        'focus:outline-none focus:border-[var(--color-primary)]',
                        'placeholder:text-[var(--color-text-muted)]'
                      )}
                      required
                    />
                  </div>
                )}

                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                    size={20}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(
                      'w-full pl-10 pr-4 py-3 rounded-lg',
                      'bg-[var(--color-background)] text-[var(--color-text)]',
                      'border border-[var(--color-text-muted)]/20',
                      'focus:outline-none focus:border-[var(--color-primary)]',
                      'placeholder:text-[var(--color-text-muted)]'
                    )}
                    required
                  />
                </div>

                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                    size={20}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(
                      'w-full pl-10 pr-12 py-3 rounded-lg',
                      'bg-[var(--color-background)] text-[var(--color-text)]',
                      'border border-[var(--color-text-muted)]/20',
                      'focus:outline-none focus:border-[var(--color-primary)]',
                      'placeholder:text-[var(--color-text-muted)]'
                    )}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {error && (
                  <p className={cn(
                    'text-sm text-center p-2 rounded',
                    error.includes('Check your email')
                      ? 'text-green-400 bg-green-400/10'
                      : 'text-red-400 bg-red-400/10'
                  )}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    'w-full py-3 rounded-lg font-semibold',
                    'bg-[var(--color-primary)] text-black',
                    'hover:brightness-110 transition-all',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'flex items-center justify-center gap-2'
                  )}
                >
                  {isSubmitting && <Loader2 className="animate-spin" size={20} />}
                  {mode === 'login' ? 'Iniciar Sesion' : 'Crear Cuenta'}
                </button>
              </form>

              {/* Switch mode */}
              <p className="text-center mt-6 text-[var(--color-text-muted)]">
                {mode === 'login' ? (
                  <>
                    ¿No tienes cuenta?{' '}
                    <button
                      onClick={() => {
                        setMode('register');
                        setError(null);
                      }}
                      className="text-[var(--color-primary)] hover:underline"
                    >
                      Registrate
                    </button>
                  </>
                ) : (
                  <>
                    ¿Ya tienes cuenta?{' '}
                    <button
                      onClick={() => {
                        setMode('login');
                        setError(null);
                      }}
                      className="text-[var(--color-primary)] hover:underline"
                    >
                      Inicia sesion
                    </button>
                  </>
                )}
              </p>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default AuthModal;
