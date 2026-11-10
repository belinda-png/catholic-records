import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { SacramentType } from '../types/records';

export type ModalState =
{kind: 'none';} |
{kind: 'sacrament';type: SacramentType;personId?: string;} |
{kind: 'import';type: SacramentType;} |
{kind: 'documents';} |
{kind: 'profile';stack: string[];};

interface UIContextValue {
  selectedParishId: string;
  setSelectedParishId: (id: string) => void;
  modal: ModalState;
  openSacrament: (type: SacramentType, personId?: string) => void;
  openImport: (type: SacramentType) => void;
  openDocuments: () => void;
  openProfile: (personId: string) => void;
  backProfile: () => void;
  closeModal: () => void;
  parishPrompt: boolean;
  chooseParish: (id: string) => void;
  cancelParishPrompt: () => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: {children: ReactNode;}) {
  const [selectedParishId, setSelectedParishId] = useState('all');
  const [modal, setModal] = useState<ModalState>({ kind: 'none' });
  const [pending, setPending] = useState<(() => void) | null>(null);

  // Editing needs a parish. Viewing does not.
  const guard = useCallback(
    (action: () => void) => {
      if (selectedParishId === 'all') setPending(() => action);else
      action();
    },
    [selectedParishId]
  );

  const openSacrament = useCallback(
    (type: SacramentType, personId?: string) => guard(() => setModal({ kind: 'sacrament', type, personId })),
    [guard]
  );
  const openImport = useCallback((type: SacramentType) => guard(() => setModal({ kind: 'import', type })), [guard]);
  const openDocuments = useCallback(() => guard(() => setModal({ kind: 'documents' })), [guard]);

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

  const chooseParish = useCallback((id: string) => {
    setSelectedParishId(id);
    const action = pending;
    setPending(null);
    action?.();
  }, [pending]);
  const cancelParishPrompt = useCallback(() => setPending(null), []);

  const value = useMemo(
    () => ({
      selectedParishId, setSelectedParishId, modal, openSacrament, openImport, openDocuments,
      openProfile, backProfile, closeModal,
      parishPrompt: pending !== null, chooseParish, cancelParishPrompt
    }),
    [selectedParishId, modal, openSacrament, openImport, openDocuments, openProfile, backProfile, closeModal, pending, chooseParish, cancelParishPrompt]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}