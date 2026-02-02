'use client';

import { useState } from 'react';
import {
  Settings,
  Palette,
  Check,
  Volume2,
  User,
  Globe,
  Music,
  Bell,
  Zap,
} from 'lucide-react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalTitle,
  ModalDescription,
} from '@/components/ui/modal';
import { useTheme, type Theme } from '@/components/client/theme-provider';
import { cn } from '@/lib/utils/cn';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'preferences' | 'sound' | 'account';

interface ThemeOption {
  name: Theme;
  label: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
  };
}

const themes: ThemeOption[] = [
  {
    name: 'ember',
    label: 'Ember',
    description: 'Naranja vibrante',
    colors: {
      primary: '#FF6B35',
      secondary: '#7C4DFF',
    },
  },
  {
    name: 'midnight',
    label: 'Midnight',
    description: 'Azul profundo',
    colors: {
      primary: '#3B82F6',
      secondary: '#6366F1',
    },
  },
  {
    name: 'neon',
    label: 'Neon',
    description: 'Vibrante y futurista',
    colors: {
      primary: '#00F5FF',
      secondary: '#FF00FF',
    },
  },
];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('preferences');
  const { theme, setTheme } = useTheme();

  return (
    <Modal open={isOpen} onClose={onClose}>
      <ModalContent size="lg">
        {/* Header */}
        <ModalHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Settings className="text-(--color-primary)" size={20} />
            </div>
            <div>
              <ModalTitle className="font-heading font-bold text-lg text-(--color-text)">
                Configuración
              </ModalTitle>
              <ModalDescription className="text-sm text-(--color-text-muted)">
                Personaliza tu experiencia
              </ModalDescription>
            </div>
          </div>
        </ModalHeader>

        {/* Tabs */}
        <div className="px-5 py-3 border-b border-(--color-border)">
          <div className="flex bg-(--color-background) rounded-lg p-1">
            <button
              onClick={() => setActiveTab('preferences')}
              className={cn(
                'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors',
                'flex items-center justify-center gap-2',
                activeTab === 'preferences'
                  ? 'bg-(--color-primary) text-white'
                  : 'text-(--color-text-muted) hover:text-(--color-text)'
              )}
            >
              <Palette size={16} />
              Preferencias
            </button>
            <button
              onClick={() => setActiveTab('sound')}
              className={cn(
                'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors',
                'flex items-center justify-center gap-2',
                activeTab === 'sound'
                  ? 'bg-(--color-primary) text-white'
                  : 'text-(--color-text-muted) hover:text-(--color-text)'
              )}
            >
              <Volume2 size={16} />
              Sonido
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={cn(
                'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors',
                'flex items-center justify-center gap-2',
                activeTab === 'account'
                  ? 'bg-(--color-primary) text-white'
                  : 'text-(--color-text-muted) hover:text-(--color-text)'
              )}
            >
              <User size={16} />
              Cuenta
            </button>
          </div>
        </div>

        {/* Content */}
        <ModalBody>
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              {/* Theme Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Palette size={16} className="text-(--color-text-muted)" />
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-(--color-text-muted)">
                    Tema
                  </h3>
                </div>

                <div className="grid gap-2">
                  {themes.map((t) => {
                    const isActive = theme === t.name;

                    return (
                      <button
                        key={t.name}
                        onClick={() => setTheme(t.name)}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl',
                          'border transition-all duration-200',
                          'hover:bg-(--color-surface-hover)',
                          isActive
                            ? 'border-(--color-primary) bg-primary/5'
                            : 'border-(--color-border)'
                        )}
                      >
                        {/* Color Preview */}
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${t.colors.primary}, ${t.colors.secondary})`,
                          }}
                        />

                        {/* Label */}
                        <div className="flex flex-col flex-1 min-w-0 text-left">
                          <span
                            className={cn(
                              'text-sm font-semibold',
                              isActive && 'text-(--color-primary)'
                            )}
                          >
                            {t.label}
                          </span>
                          <span className="text-xs text-(--color-text-muted)">
                            {t.description}
                          </span>
                        </div>

                        {/* Active Indicator */}
                        {isActive && (
                          <div className="w-7 h-7 rounded-full bg-(--color-primary) flex items-center justify-center shrink-0">
                            <Check size={14} className="text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={16} className="text-(--color-text-muted)" />
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-(--color-text-muted)">
                    Idioma
                  </h3>
                </div>

                <div className="p-4 rounded-xl bg-(--color-background) border border-(--color-border)">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Globe size={18} className="text-(--color-primary)" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-(--color-text)">
                        Español (Argentina)
                      </p>
                      <p className="text-xs text-(--color-text-muted)">
                        Próximamente más idiomas
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sound' && (
            <div className="space-y-4">
              {/* Music */}
              <div className="p-4 rounded-xl bg-(--color-background) border border-(--color-border)">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Music size={18} className="text-(--color-accent)" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-(--color-text)">
                      Música de fondo
                    </p>
                    <p className="text-xs text-(--color-text-muted)">
                      Próximamente
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-(--color-warning)/10 text-(--color-warning) text-xs font-medium">
                    Pronto
                  </div>
                </div>
              </div>

              {/* Sound Effects */}
              <div className="p-4 rounded-xl bg-(--color-background) border border-(--color-border)">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-(--color-success)/10 flex items-center justify-center">
                    <Zap size={18} className="text-(--color-success)" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-(--color-text)">
                      Efectos de sonido
                    </p>
                    <p className="text-xs text-(--color-text-muted)">
                      Próximamente
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-(--color-warning)/10 text-(--color-warning) text-xs font-medium">
                    Pronto
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="p-4 rounded-xl bg-(--color-background) border border-(--color-border)">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Bell size={18} className="text-(--color-primary)" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-(--color-text)">
                      Notificaciones
                    </p>
                    <p className="text-xs text-(--color-text-muted)">
                      Próximamente
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-(--color-warning)/10 text-(--color-warning) text-xs font-medium">
                    Pronto
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-(--color-background) border border-(--color-border) flex items-center justify-center mx-auto mb-4">
                <User size={28} className="text-(--color-text-muted)" />
              </div>
              <h3 className="text-lg font-semibold text-(--color-text) mb-2">
                Gestión de cuenta
              </h3>
              <p className="text-sm text-(--color-text-muted) mb-4 max-w-xs mx-auto">
                Próximamente podrás gestionar tu perfil, estadísticas y
                preferencias de cuenta.
              </p>
              <div className="inline-flex px-4 py-2 rounded-full bg-(--color-warning)/10 text-(--color-warning) text-sm font-medium">
                Próximamente
              </div>
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default SettingsModal;
