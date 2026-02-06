'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Check, X, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { formatBalance } from '@/features/wallet/store/wallet-store';
import type { NegotiationState } from '../../common/hooks';
import { BET_PRESETS } from '../../common/constants';

interface BetNegotiationOverlayProps {
  isOpen: boolean;
  myProposal: number | null;
  opponentProposal: number | null;
  opponentName: string;
  deadline: string | null;
  balance: number;
  negotiationState: NegotiationState;
  onAccept: () => void;
  onCounterPropose: (amount: number) => void;
  onSkip: () => void;
}

export function BetNegotiationOverlay({
  isOpen,
  myProposal,
  opponentProposal,
  opponentName,
  deadline,
  balance,
  negotiationState,
  onAccept,
  onCounterPropose,
  onSkip,
}: BetNegotiationOverlayProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customInput, setCustomInput] = useState('');
  const [timeLeft, setTimeLeft] = useState<number>(30);

  // Calculate time remaining
  useEffect(() => {
    if (!deadline || negotiationState !== 'pending') {
      setTimeLeft(30); // eslint-disable-line react-hooks/set-state-in-effect -- reset timer state
      return;
    }

    const deadlineDate = new Date(deadline);

    const updateTimer = () => {
      const now = new Date();
      const remaining = Math.max(0, Math.floor((deadlineDate.getTime() - now.getTime()) / 1000));
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [deadline, negotiationState]);

  // Reset selected amount when proposals change
  useEffect(() => {
    setSelectedAmount(null); // eslint-disable-line react-hooks/set-state-in-effect -- reset on prop change
    setCustomInput('');  
  }, [myProposal, opponentProposal]);

  const handleCounterPropose = useCallback(() => {
    if (selectedAmount && selectedAmount <= balance) {
      onCounterPropose(selectedAmount);
    }
  }, [selectedAmount, balance, onCounterPropose]);

  // Determine if we can afford the opponent's proposal
  const canAffordOpponent = useMemo(() => {
    return opponentProposal !== null && opponentProposal <= balance;
  }, [opponentProposal, balance]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-sm bg-(--color-surface) rounded-2xl border border-(--color-border) shadow-2xl overflow-hidden"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            {/* Header */}
            <div className="bg-(--color-warning)/10 border-b border-(--color-warning)/20 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="text-(--color-warning)" size={24} />
                  <h2 className="text-lg font-bold text-(--color-text)">
                    Negociación de Apuesta
                  </h2>
                </div>
                <div className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium',
                  timeLeft <= 10
                    ? 'bg-(--color-error)/20 text-(--color-error)'
                    : 'bg-(--color-surface) text-(--color-text-muted)'
                )}>
                  <Clock size={14} />
                  <span>{timeLeft}s</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Proposals comparison */}
              <div className="grid grid-cols-2 gap-3">
                {/* My proposal */}
                <div className="p-3 rounded-xl bg-(--color-primary)/10 border border-(--color-primary)/30">
                  <p className="text-xs text-(--color-text-muted) mb-1">Tu propuesta</p>
                  <p className="text-xl font-bold text-(--color-primary)">
                    {myProposal ? formatBalance(myProposal) : '-'}
                  </p>
                </div>

                {/* Opponent proposal */}
                <div className="p-3 rounded-xl bg-(--color-secondary)/10 border border-(--color-secondary)/30">
                  <p className="text-xs text-(--color-text-muted) mb-1">{opponentName}</p>
                  <p className="text-xl font-bold text-(--color-secondary)">
                    {opponentProposal ? formatBalance(opponentProposal) : '-'}
                  </p>
                </div>
              </div>

              {/* Balance info */}
              <div className="flex items-center justify-center gap-1 text-xs text-(--color-text-muted)">
                <span>Tu balance:</span>
                <span className="text-(--color-primary) font-medium">{formatBalance(balance)}</span>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {/* Accept opponent's proposal */}
                {opponentProposal && (
                  <Button
                    onClick={onAccept}
                    disabled={!canAffordOpponent}
                    variant="primary"
                    className="w-full gap-2"
                  >
                    <Check size={18} />
                    Aceptar {formatBalance(opponentProposal)}
                    {!canAffordOpponent && (
                      <span className="text-xs opacity-75">(Balance insuficiente)</span>
                    )}
                  </Button>
                )}

                {/* Counter-propose section */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-(--color-text-muted) text-center">
                    O propón otro monto:
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {BET_PRESETS.map((amount) => {
                      const canAfford = amount <= balance;
                      const isSelected = selectedAmount === amount && !customInput;
                      const isMyCurrentProposal = amount === myProposal;

                      return (
                        <button
                          key={amount}
                          onClick={() => {
                            if (canAfford && !isMyCurrentProposal) {
                              setSelectedAmount(amount);
                              setCustomInput('');
                            }
                          }}
                          disabled={!canAfford || isMyCurrentProposal}
                          aria-label={`Proponer ${amount} créditos`}
                          aria-pressed={isSelected}
                          className={cn(
                            'py-2 px-2 rounded-lg text-xs font-medium transition-all',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-warning) focus-visible:ring-offset-2',
                            isSelected
                              ? 'bg-(--color-warning) text-white ring-2 ring-(--color-warning) ring-offset-2 ring-offset-(--color-surface)'
                              : isMyCurrentProposal
                                ? 'bg-(--color-primary)/20 text-(--color-primary) cursor-not-allowed'
                                : canAfford
                                  ? 'bg-(--color-background) text-(--color-text) hover:bg-(--color-background-hover)'
                                  : 'bg-(--color-background) text-(--color-text-subtle) opacity-50 cursor-not-allowed'
                          )}
                        >
                          {formatBalance(amount)}
                          {isMyCurrentProposal && <span className="block text-[9px]">(actual)</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom amount input */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Coins size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-(--color-text-muted)" />
                      <input
                        type="number"
                        inputMode="numeric"
                        min="1"
                        max={balance}
                        value={customInput}
                        onChange={(e) => {
                          const value = e.target.value;
                          setCustomInput(value);
                          const numValue = parseInt(value, 10);
                          if (!isNaN(numValue) && numValue > 0 && numValue <= balance && numValue !== myProposal) {
                            setSelectedAmount(numValue);
                          } else {
                            setSelectedAmount(null);
                          }
                        }}
                        placeholder="Otro monto..."
                        aria-label="Monto de contra-propuesta personalizado"
                        className={cn(
                          'w-full pl-8 pr-3 py-2 rounded-lg text-xs font-medium',
                          'bg-(--color-background) border border-(--color-border)',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-warning) focus-visible:ring-offset-2',
                          'placeholder:text-(--color-text-muted)',
                          '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                          customInput && selectedAmount && !(BET_PRESETS as readonly number[]).includes(selectedAmount)
                            ? 'ring-2 ring-(--color-warning) border-transparent'
                            : ''
                        )}
                      />
                    </div>
                  </div>
                  {customInput && parseInt(customInput, 10) > balance && (
                    <p className="text-[10px] text-(--color-error)">Balance insuficiente</p>
                  )}
                  {customInput && parseInt(customInput, 10) === myProposal && (
                    <p className="text-[10px] text-(--color-text-muted)">Es tu propuesta actual</p>
                  )}

                  {selectedAmount && (
                    <Button
                      onClick={handleCounterPropose}
                      variant="outline"
                      className="w-full gap-2 mt-2"
                    >
                      <ArrowRight size={16} />
                      Proponer {formatBalance(selectedAmount)}
                    </Button>
                  )}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-(--color-border)" />
                  <span className="text-xs text-(--color-text-muted)">o</span>
                  <div className="flex-1 h-px bg-(--color-border)" />
                </div>

                {/* Skip betting */}
                <Button
                  onClick={onSkip}
                  variant="ghost"
                  className="w-full gap-2 text-(--color-text-muted)"
                >
                  <X size={16} />
                  Jugar sin apuesta
                </Button>
              </div>
            </div>

            {/* Footer note */}
            <div className="px-4 pb-4">
              <p className="text-[10px] text-(--color-text-muted) text-center">
                Si no hay acuerdo en {timeLeft}s, la partida comenzará sin apuesta
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default BetNegotiationOverlay;
