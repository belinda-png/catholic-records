import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { getUser } from '../auth';
import { SacramentType } from '../types/records';

export type ModalState =
{kind: 'none';} |
{kind: 'sacrament';type: SacramentType;personId?: string;} |
{kind: 'import';type: SacramentType;} |
{kind: 'documents';} |
{kind: 'editPerson';personId: string;} |
{kind: 'admin';} |
{kind: 'profile';stack: string[];};

interface UIContextValue {
  selectedParishId: string;          // the parish you WORK in (staff: always their own)
  setSelectedParishId: (id: string) => void;
  isStaff: boolean;
  myParishId: string | null;
  viewParishId: string;              // what the people list shows ('all' or one parish)
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

export function UIProvider({ children }: {children: ReactNode;}) {
  const user = getUser();
  const openAdmin = useCallback(() => setModal({ kind: 'admin' }), []);
  const isStaff = user?.role === 'staff' && !!user.parish_id;
  const myParishId = isStaff ? String(user!.parish_id) : null;

  const [selectedParishId, setSelected] = useState(myParishId ?? 'all');
  const [viewAll, setViewAll] = useState(true);
  const [modal, setModal] = useState<ModalState>({ kind: 'none' });
  const [pending, setPending] = useState<(() => void) | null>(null);

  // Staff cannot switch the parish they work in
  const setSelectedParishId = useCallback((id: string) => {
    if (!isStaff) setSelected(id);
  }, [isStaff]);

  const viewParishId = isStaff ? viewAll ? 'all' : (myParishId as string) : selectedParishId;

  const canEdit = useCallback(
    (parishId: string) => isStaff ? parishId === myParishId : selectedParishId !== 'all' && parishId === selectedParishId,
    [isStaff, myParishId, selectedParishId]
  );

  const guard = useCallback(
    (action: () => void) => {
      if (selectedParishId === 'all') setPending(() => action);else
      action();
    },
    [selectedParishId]
  );

  const openSacrament = useCallback((type: SacramentType, personId?: string) => guard(() => setModal({ kind: 'sacrament', type, personId })), [guard]);
  const openImport = useCallback((type: SacramentType) => guard(() => setModal({ kind: 'import', type })), [guard]);
  const openDocuments = useCallback(() => guard(() => setModal({ kind: 'documents' })), [guard]);
  const openEditPerson = useCallback((personId: string) => guard(() => setModal({ kind: 'editPerson', personId })), [guard]);

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
  }, [pending, setSelectedParishId]);
  const cancelParishPrompt = useCallback(() => setPending(null), []);
  const { people } = useRecords();
  const { viewParishId } = useUI();

const memberCount =
  viewParishId === 'all'
    ? people.length
    : people.filter((p) => p.parishId === viewParishId).length;

  const value = useMemo(
    () => ({
      selectedParishId, setSelectedParishId, isStaff, myParishId, viewParishId, viewAll, setViewAll, canEdit,
      modal, openSacrament, openImport, openDocuments, openEditPerson, openProfile, backProfile, closeModal,
      parishPrompt: pending !== null, chooseParish, cancelParishPrompt
    }),
    [selectedParishId, setSelectedParishId, isStaff, myParishId, viewParishId, viewAll, canEdit, modal, openSacrament, openImport, openDocuments, openEditPerson, openProfile, backProfile, closeModal, pending, chooseParish, cancelParishPrompt]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}