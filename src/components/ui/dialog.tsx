'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Unified Dialog/Modal System
 * Based on Radix Dialog with custom styling
 *
 * Features:
 * - Escape key handling
 * - Focus trap
 * - Click outside to close
 * - Multiple sizes (sm, default, lg, xl, full)
 * - Consistent styling with design system
 */

// Size configuration
const sizeClasses = {
  sm: 'max-w-sm',
  default: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full mx-4',
} as const;

type DialogSize = keyof typeof sizeClasses;

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 z-(--z-modal-backdrop)',
        'bg-black/60 backdrop-blur-sm',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className
      )}
      {...props}
    />
  );
}

interface DialogContentProps
  extends React.ComponentProps<typeof DialogPrimitive.Content> {
  size?: DialogSize;
  showCloseButton?: boolean;
}

function DialogContent({
  className,
  children,
  size = 'default',
  showCloseButton = true,
  ...props
}: DialogContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'fixed left-1/2 top-1/2 z-(--z-modal)',
          '-translate-x-1/2 -translate-y-1/2',
          'w-full',
          sizeClasses[size],
          'max-h-[90vh] overflow-hidden',
          'flex flex-col',
          'rounded-2xl',
          'bg-(--color-surface)',
          'border border-(--color-border)',
          'shadow-xl',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'duration-200',
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            className={cn(
              'absolute right-4 top-4',
              'w-10 h-10 rounded-lg',
              'flex items-center justify-center',
              'text-(--color-text-muted) hover:text-(--color-text)',
              'bg-(--color-background)/50 hover:bg-(--color-background)',
              'transition-all duration-200',
              'hover:scale-105 active:scale-95',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary)'
            )}
            aria-label="Cerrar"
          >
            <X size={20} />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

interface DialogHeaderProps extends React.ComponentProps<'div'> {
  showClose?: boolean;
}

function DialogHeader({
  className,
  children,
  showClose = true,
  ...props
}: DialogHeaderProps) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        'flex items-center justify-between',
        'p-5',
        'border-b border-(--color-border)',
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-1.5 flex-1">{children}</div>
      {showClose && (
        <DialogPrimitive.Close
          className={cn(
            'w-10 h-10 rounded-lg',
            'flex items-center justify-center',
            'text-(--color-text-muted) hover:text-(--color-text)',
            'bg-background/50 hover:bg-background',
            'transition-all duration-200',
            'hover:scale-105 active:scale-95',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary)'
          )}
          aria-label="Cerrar"
        >
          <X size={20} />
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function DialogBody({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-body"
      className={cn('flex-1 overflow-y-auto p-5', className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex items-center gap-3',
        'p-4',
        'border-t border-(--color-border)',
        className
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-xl font-bold text-gradient', className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-sm text-(--color-text-muted)', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};

export type { DialogSize };
