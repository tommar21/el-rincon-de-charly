'use client';

/**
 * Modal Component System
 *
 * This is an alias layer that maps the Modal API to the unified Dialog system.
 * New code should prefer using Dialog directly from '@/components/ui/dialog'.
 *
 * @deprecated Use Dialog components from '@/components/ui/dialog' for new code.
 */

import * as React from 'react';
import {
  Dialog,
  DialogContent as BaseDialogContent,
  DialogHeader as BaseDialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  type DialogSize,
} from './dialog';

// Re-export unchanged components
export { DialogBody as ModalBody, DialogFooter as ModalFooter, DialogTitle as ModalTitle, DialogDescription as ModalDescription };

/**
 * Modal wrapper - adapts the open/onClose API to Dialog's open/onOpenChange
 */
interface ModalProps {
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
}

function Modal({ children, open, onClose }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      {children}
    </Dialog>
  );
}

/**
 * ModalContent - wraps DialogContent with legacy prop names
 */
interface ModalContentProps {
  children: React.ReactNode;
  size?: DialogSize;
  ariaLabel?: string;
  className?: string;
}

const ModalContent = React.forwardRef<HTMLDivElement, ModalContentProps>(
  ({ children, size = 'default', ariaLabel, className }, ref) => {
    return (
      <BaseDialogContent
        ref={ref}
        size={size}
        className={className}
        aria-label={ariaLabel}
        showCloseButton={false}
      >
        {children}
      </BaseDialogContent>
    );
  }
);
ModalContent.displayName = 'ModalContent';

/**
 * ModalHeader - wraps DialogHeader with showClose prop
 */
interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  showClose?: boolean;
}

const ModalHeader = React.forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ showClose = true, ...props }, ref) => {
    return <BaseDialogHeader ref={ref} showClose={showClose} {...props} />;
  }
);
ModalHeader.displayName = 'ModalHeader';

export { Modal, ModalContent, ModalHeader };
