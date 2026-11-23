import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import { getUser } from '../auth';
import { SacramentType } from '../types/records';

export type ModalState =
  | { kind: 'none' }
  | { kind: 'sacrament'; type: SacramentType; personId?: string }
  | { kind: 'import'; type: SacramentType }
  | { kind: 'documents' }
  | { kind: 'editPerson'; personId: string }
  | { kind: 'admin' }
  | { kind: 'profile'; stack: string[] };

interface UIContextValue {
  selectedParishId: string;
  setSelectedParishId: (id: string) => void;
  isStaff: boolean;
  myParishId: string | null;
  viewParishId: string;
  viewAll: boolean;
  setViewAll: (v: boolean) => void;
  canEdit: (parishId: string) => boolean;
  modal: ModalState;
  openSacrament: (type: SacramentType, personId?: string) => void;
  openAdmin: () => void;
  openImport: (type: SacramentType) => void;
  openDocuments: () => void;
  openEditPerson: (personId: string) => void;
  openProfile: (personId: string) => void;
  backProfile: () => void;
  closeModal: () => void;
  parishPrompt: boolean;
  chooseParish: (id: string) => void;
  cancelParishPrompt: () => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const user = getUser();

  const isStaff = user?.role === 'staff' && !!user.parish_id;

  const myParishId = isStaff ? String(user!.parish_id) : null;

  const [selectedParishId, setSelected] = useState(myParishId ?? 'all');

  const [viewAll, setViewAll] = useState(true);

  const [modal, setModal] = useState<ModalState>({
    kind: 'none',
  });

  const [pending, setPending] = useState<(() => void) | null>(null);

  // Staff cannot switch the parish they work in
  const setSelectedParishId = useCallback(
    (id: string) => {
      if (!isStaff) {
        setSelected(id);
      }
    },
    [isStaff]
  );

  // Determines which parish the people list displays
  const viewParishId = isStaff
    ? viewAll
      ? 'all'
      : (myParishId as string)
    : selectedParishId;

  // Determines whether a user can edit records in a parish
  const canEdit = useCallback(
    (parishId: string) =>
      isStaff
        ? parishId === myParishId
        : selectedParishId !== 'all' &&
          parishId === selectedParishId,
    [isStaff, myParishId, selectedParishId]
  );

  // Require parish selection before certain actions
  const guard = useCallback(
    (action: () => void) => {
      if (selectedParishId === 'all') {
        setPending(() => action);
      } else {
        action();
      }
    },
    [selectedParishId]
  );

  // Open sacrament form
  const openSacrament = useCallback(
    (type: SacramentType, personId?: string) =>
      guard(() =>
        setModal({
          kind: 'sacrament',
          type,
          personId,
        })
      ),
    [guard]
  );

  // Open import
  const openImport = useCallback(
    (type: SacramentType) =>
      guard(() =>
        setModal({
          kind: 'import',
          type,
        })
      ),
    [guard]
  );

  // Open documents
  const openDocuments = useCallback(
    () => guard(() => setModal({ kind: 'documents' })),
    [guard]
  );

  // Open edit person
  const openEditPerson = useCallback(
    (personId: string) =>
      guard(() =>
        setModal({
          kind: 'editPerson',
          personId,
        })
      ),
    [guard]
  );

  // Open admin
  const openAdmin = useCallback(
    () => setModal({ kind: 'admin' }),
    []
  );

  // Profile navigation
  const openProfile = useCallback(
    (personId: string) =>
      setModal((prev) =>
        prev.kind === 'profile'
          ? {
              kind: 'profile',
              stack: [...prev.stack, personId],
            }
          : {
              kind: 'profile',
              stack: [personId],
            }
      ),
    []
  );

  // Go back in profile navigation
  const backProfile = useCallback(
    () =>
      setModal((prev) =>
        prev.kind === 'profile' && prev.stack.length > 1
          ? {
              kind: 'profile',
              stack: prev.stack.slice(0, -1),
            }
          : prev
      ),
    []
  );

  // Close modal
  const closeModal = useCallback(
    () => setModal({ kind: 'none' }),
    []
  );

  // Select parish and execute pending action
  const chooseParish = useCallback(
    (id: string) => {
      setSelectedParishId(id);

      const action = pending;

      setPending(null);

      action?.();
    },
    [pending, setSelectedParishId]
  );

  // Cancel parish prompt
  const cancelParishPrompt = useCallback(
    () => setPending(null),
    []
  );

  // Context value
  const value = useMemo(
    () => ({
      selectedParishId,
      setSelectedParishId,
      isStaff,
      myParishId,
      viewParishId,
      viewAll,
      setViewAll,
      canEdit,
      modal,
      openSacrament,
      openAdmin,
      openImport,
      openDocuments,
      openEditPerson,
      openProfile,
      backProfile,
      closeModal,
      parishPrompt: pending !== null,
      chooseParish,
      cancelParishPrompt,
    }),
    [
      selectedParishId,
      setSelectedParishId,
      isStaff,
      myParishId,
      viewParishId,
      viewAll,
      canEdit,
      modal,
      openSacrament,
      openAdmin,
      openImport,
      openDocuments,
      openEditPerson,
      openProfile,
      backProfile,
      closeModal,
      pending,
      chooseParish,
      cancelParishPrompt,
    ]
  );

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);

  if (!ctx) {
    throw new Error('useUI must be used within UIProvider');
  }

  return ctx;
}