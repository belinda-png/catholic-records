import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useUI } from '../contexts/UIContext';
import { DocumentsModal } from './DocumentsModal';
import { ImportModal } from './ImportModal';
import { PersonProfileModal } from './PersonProfileModal';
import { SacramentFormModal } from './SacramentFormModal';

export function ModalHost() {
  const { modal, closeModal, openProfile, backProfile, openSacrament } = useUI();

  return (
    <AnimatePresence>
      {modal.kind === 'sacrament' &&
      <SacramentFormModal key={`s-${modal.type}-${modal.personId ?? ''}`} type={modal.type} initialPersonId={modal.personId} onClose={closeModal} />
      }
      {modal.kind === 'import' && <ImportModal key={`i-${modal.type}`} type={modal.type} onClose={closeModal} />}
      {modal.kind === 'documents' && <DocumentsModal key="documents" onClose={closeModal} />}
      {modal.kind === 'profile' &&
      <PersonProfileModal
        key="profile"
        stack={modal.stack}
        onClose={closeModal}
        onOpenPerson={openProfile}
        onBack={backProfile}
        onRecord={openSacrament} />

      }
    </AnimatePresence>);

}