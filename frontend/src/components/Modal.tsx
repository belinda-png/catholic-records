import React, { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { XIcon } from 'lucide-react';

interface ModalProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  leading?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
}

const ease = [0.23, 1, 0.32, 1] as const;
/** Tracks open modals so Escape only closes the top-most one. */
const openStack: symbol[] = [];

export function Modal({ title, subtitle, icon, leading, onClose, children, footer, size = 'lg' }: ModalProps) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const id = Symbol('modal');
    openStack.push(id);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openStack[openStack.length - 1] === id) onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      openStack.splice(openStack.indexOf(id), 1);
      document.body.style.overflow = prev;
    };
  }, []);

  return createPortal(
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease }}>
      
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} aria-hidden="true" />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-2xl bg-paper shadow-2xl sm:rounded-2xl ${
        size === 'lg' ? 'sm:max-w-3xl' : 'sm:max-w-xl'}`
        }
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.24, ease }}>
        
        <header className="flex items-start gap-3 border-b border-line px-5 py-4 sm:px-6">
          {leading}
          {icon && <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl">{icon}</div>}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-forest">{title}</h2>
            {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition-colors duration-150 hover:bg-cream hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500/30"
            aria-label="Close">
            
            <XIcon className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-cream/60 px-5 py-3.5 sm:px-6">{footer}</footer>}
      </motion.div>
    </motion.div>,
    document.body
  );
}