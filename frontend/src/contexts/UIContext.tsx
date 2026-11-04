import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { SacramentType } from '../types/records';

export type ModalState =
{kind: 'none';} |
{kind: 'sacrament';type: SacramentType;personId?: string;} |
{kind: 'profile';stack: string[];};

interface UIContextValue {
  selectedParishId: string;
  setSelectedParishId: (id: string) => void;
  modal: ModalState;
  openSacrament: (type: SacramentType, personId?: string) => void;
  openProfile: (personId: string) => void;
  backProfile: () => void;
  closeModal: () => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: {children: ReactNode;}) {
  const [selectedParishId, setSelectedParishId] = useState('all');
  const [modal, setModal] = useState<ModalState>({ kind: 'none' });

  const openSacrament = useCallback((type: SacramentType, personId?: string) => setModal({ kind: 'sacrament', type, personId }), []);
  const openProfile = useCallback(
    (personId: string) =>
    setModal((prev) =>
    prev.kind === 'profile' ? { kind: 'profile', stack: [...prev.stack, personId] } : { kind: 'profile', stack: [personId] }
    ),
    []
  );
  const backProfile = useCallback(
    () =>
    setModal((prev) =>
    prev.kind === 'profile' && prev.stack.length > 1 ? { kind: 'profile', stack: prev.stack.slice(0, -1) } : prev
    ),
    []
  );
  const closeModal = useCallback(() => setModal({ kind: 'none' }), []);

  const value = useMemo(
    () => ({ selectedParishId, setSelectedParishId, modal, openSacrament, openProfile, backProfile, closeModal }),
    [selectedParishId, modal, openSacrament, openProfile, backProfile, closeModal]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}