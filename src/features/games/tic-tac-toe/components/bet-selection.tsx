'use client';

import { useState, useCallback, useEffect } from 'react';
import { Coins, AlertCircle, Trophy } from 'lucide-react';
import { useWalletStore, formatBalance } from '@/features/wallet/store/wallet-store';
import { cn } from '@/lib/utils/cn';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalTitle,
  ModalDescription,
} from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

// Configuracion de apuestas
const BET_CONFIG = {
  MIN_BET: 10,
  MAX_BET: 1000,
  PRESETS: [10, 25, 50, 100, 250, 500],
};

interface BetSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  isLoading?: boolean;
}

export function BetSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: BetSelectionModalProps) {
  const { wallet } = useWalletStore();
  const [selectedAmount, setSelectedAmount] = useState<number>(BET_CONFIG.PRESETS[0]);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [useCustom, setUseCustom] = useState(false);

  // Reset form state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedAmount(BET_CONFIG.PRESETS[0]);
      setCustomAmount('');
      setUseCustom(false);
    }
  }, [isOpen]);

  const balance = wallet?.balance ?? 0;

  // Calcular el monto efectivo de la apuesta
  const effectiveAmount = useCustom ? parseInt(customAmount, 10) || 0 : selectedAmount;

  // Validaciones
  const isValidAmount =
    effectiveAmount >= BET_CONFIG.MIN_BET &&
    effectiveAmount <= BET_CONFIG.MAX_BET &&
    effectiveAmount <= balance;

  const getErrorMessage = useCallback(() => {
    if (effectiveAmount < BET_CONFIG.MIN_BET) {
      return `La apuesta minima es ${formatBalance(BET_CONFIG.MIN_BET)}`;
    }
    if (effectiveAmount > BET_CONFIG.MAX_BET) {
      return `La apuesta maxima es ${formatBalance(BET_CONFIG.MAX_BET)}`;
    }
    if (effectiveAmount > balance) {
      return 'Saldo insuficiente';
    }
    return null;
  }, [effectiveAmount, balance]);

  const handlePresetClick = (amount: number) => {
    setSelectedAmount(amount);
    setUseCustom(false);
    setCustomAmount('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove non-numeric characters and limit to 4 digits (max 9999)
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length > 4) {
      value = value.slice(0, 4);
    }
    // Enforce max bet limit
    const numValue = parseInt(value, 10) || 0;
    if (numValue > BET_CONFIG.MAX_BET) {
      value = String(BET_CONFIG.MAX_BET);
    }
    setCustomAmount(value);
    setUseCustom(true);
  };

  const handleConfirm = () => {
    if (isValidAmount && !isLoading) {
      onConfirm(effectiveAmount);
    }
  };

  const errorMessage = getErrorMessage();

  return (
    <Modal open={isOpen} onClose={onClose}>
      <ModalContent size="default">
        {/* Header */}
        <ModalHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-(--color-warning)/10 border border-(--color-warning)/30 flex items-center justify-center">
              <Trophy className="text-(--color-warning)" size={20} />
            </div>
            <div>
              <ModalTitle className="font-heading font-bold text-lg text-(--color-text)">
                Partida con Apuesta
              </ModalTitle>
              <ModalDescription className="text-sm text-(--color-text-muted)">
                Selecciona el monto a apostar
              </ModalDescription>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="space-y-5">
          {/* Balance Display */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-(--color-background) border border-(--color-border)">
            <div className="flex items-center gap-2">
              <Coins className="text-(--color-warning)" size={20} />
              <span className="text-sm text-(--color-text-muted)">Tu balance:</span>
            </div>
            <span className="font-heading font-bold text-lg text-(--color-primary)">
              {formatBalance(balance)}
            </span>
          </div>

          {/* Preset Amounts */}
          <div>
            <p className="text-sm font-medium text-(--color-text-muted) mb-3">
              Montos rapidos:
            </p>
            <div className="grid grid-cols-3 gap-2">
              {BET_CONFIG.PRESETS.map((amount) => {
                const canAfford = amount <= balance;
                const isSelected = !useCustom && selectedAmount === amount;

                return (
                  <button
                    key={amount}
                    onClick={() => canAfford && handlePresetClick(amount)}
                    disabled={!canAfford}
                    aria-label={`Apostar ${amount} créditos`}
                    aria-pressed={isSelected}
                    className={cn(
                      'py-3 px-4 rounded-lg text-sm font-medium transition-all',
                      'border-2',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary) focus-visible:ring-offset-2',
                      isSelected
                        ? 'bg-(--color-primary) border-(--color-primary) text-white'
                        : canAfford
                          ? 'bg-(--color-surface) border-(--color-border) text-(--color-text) hover:border-(--color-primary)/50'
                          : 'bg-(--color-background) border-(--color-border) text-(--color-text-subtle) opacity-50 cursor-not-allowed'
                    )}
                  >
                    {formatBalance(amount)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Amount */}
          <div>
            <p className="text-sm font-medium text-(--color-text-muted) mb-2">
              Monto personalizado:
            </p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-(--color-text-muted)">
                $
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={customAmount}
                onChange={handleCustomChange}
                placeholder={`${BET_CONFIG.MIN_BET} - ${BET_CONFIG.MAX_BET}`}
                aria-label="Monto de apuesta personalizado"
                className={cn(
                  'w-full py-3 pl-8 pr-4 rounded-lg text-sm',
                  'bg-(--color-surface) border-2 transition-colors',
                  'placeholder:text-(--color-text-subtle)',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary) focus-visible:ring-offset-2',
                  useCustom && customAmount
                    ? isValidAmount
                      ? 'border-(--color-primary) text-(--color-text)'
                      : 'border-(--color-error) text-(--color-text)'
                    : 'border-(--color-border) text-(--color-text)'
                )}
              />
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && effectiveAmount > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-(--color-error)/10 border border-(--color-error)/30">
              <AlertCircle className="text-(--color-error) shrink-0" size={18} />
              <span className="text-sm text-(--color-error)">{errorMessage}</span>
            </div>
          )}

          {/* Info: Pot and Win */}
          {isValidAmount && (
            <div className="p-4 rounded-xl bg-(--color-success)/10 border border-(--color-success)/30">
              <div className="flex justify-between items-center">
                <span className="text-sm text-(--color-text-muted)">
                  Si ganas, recibiras:
                </span>
                <span className="font-heading font-bold text-lg text-(--color-success)">
                  {formatBalance(effectiveAmount * 2)}
                </span>
              </div>
              <p className="text-xs text-(--color-text-subtle) mt-2">
                En caso de empate, tu apuesta sera reembolsada.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleConfirm}
              disabled={!isValidAmount || isLoading}
              loading={isLoading}
              icon={<Coins size={18} />}
            >
              Apostar {isValidAmount ? formatBalance(effectiveAmount) : ''}
            </Button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default BetSelectionModal;
