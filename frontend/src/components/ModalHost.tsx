import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { MapPinIcon } from 'lucide-react';
import { useRecords } from '../contexts/RecordsContext';
import { useUI } from '../contexts/UIContext';
import { inputClass, secondaryButton } from '../utils/styles';
import { DocumentsModal } from './DocumentsModal';
import { ImportModal } from './ImportModal';
import { Modal } from './Modal';
import { PersonProfileModal } from './PersonProfileModal';
import { SacramentFormModal } from './SacramentFormModal';
import { EditPersonModal } from './EditPersonModal';
import {AdminDashboardModal} from './AdminDashboardModal';
export function ModalHost() {
  const { modal, closeModal, openProfile, backProfile, openSacrament, parishPrompt, chooseParish, cancelParishPrompt } = useUI();
  const { parishes } = useRecords();

  return (
    <AnimatePresence>
      {modal.kind === 'sacrament' &&
      <SacramentFormModal key={`s-${modal.type}-${modal.personId ?? ''}`} type={modal.type} initialPersonId={modal.personId} onClose={closeModal} />
      }
      {modal.kind === 'editPerson' && <EditPersonModal key={`e-${modal.personId}`} personId={modal.personId} onClose={closeModal} />}
      {modal.kind === 'import' && <ImportModal key={`i-${modal.type}`} type={modal.type} onClose={closeModal} />}
      {modal.kind === 'documents' && <DocumentsModal key="documents" onClose={closeModal} />}
      {modal.kind === 'admin' && <AdminDashboardModal key="admin" onClose={closeModal} />}
      {modal.kind === 'profile' &&
      <PersonProfileModal
        key="profile"
        stack={modal.stack}
        onClose={closeModal}
        onOpenPerson={openProfile}
        onBack={backProfile}
        onRecord={openSacrament} />
      }
      {parishPrompt &&
      <Modal
        key="parish-prompt"
        title="Select your parish"
        subtitle="You can view every parish, but you can only add or change records for your own."
        icon={
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-sage text-sage-ink">
              <MapPinIcon className="h-5 w-5" />
            </span>
        }
        onClose={cancelParishPrompt}
        size="md"
        footer={<button type="button" onClick={cancelParishPrompt} className={secondaryButton}>Cancel</button>}>
          <label htmlFor="prompt-parish" className="mb-1 block text-xs font-semibold text-muted">YOUR PARISH</label>
          <select id="prompt-parish" defaultValue="" onChange={(e) => e.target.value && chooseParish(e.target.value)} className={inputClass}>
            <option value="">Select parish…</option>
            {parishes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Modal>
      }
    </AnimatePresence>);

}