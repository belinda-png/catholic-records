import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MenuIcon } from 'lucide-react';
import { AppView } from '../types/records';
import { Dashboard } from '../pages/Dashboard';
import { People } from '../pages/People';
import { Records } from '../pages/Records';
import { ModalHost } from './ModalHost';
import { Sidebar } from './Sidebar';

const titles: Record<AppView, string> = {
  dashboard: 'Dashboard',
  people: 'People directory',
  records: 'Sacramental records'
};

export function AppShell() {
  const [view, setView] = useState<AppView>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = (next: AppView) => {
    setView(next);
    setMenuOpen(false);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen w-full bg-cream">
      <aside className="fixed inset-y-0 left-0 z-30 hidden lg:block">
        <Sidebar view={view} onNavigate={navigate} />
      </aside>

      <AnimatePresence>
        {menuOpen &&
        <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div className="absolute inset-0 bg-ink/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={() => setMenuOpen(false)} />
            <motion.aside
            className="absolute inset-y-0 left-0"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}>
            
              <Sidebar view={view} onNavigate={navigate} onClose={() => setMenuOpen(false)} />
            </motion.aside>
          </div>
        }
      </AnimatePresence>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-paper/95 px-4 backdrop-blur sm:px-8">
          <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu" className="grid h-9 w-9 place-items-center rounded-lg text-forest hover:bg-cream lg:hidden">
            <MenuIcon className="h-5 w-5" />
          </button>
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs">
            <span className="text-muted">Archdiocese</span>
            <span className="text-muted/60">/</span>
            <span className="font-medium text-forest">{titles[view]}</span>
          </nav>
          <p className="ml-auto hidden items-center gap-2 text-xs text-sage-ink sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-sage-ink" aria-hidden="true" />
            Records Management
          </p>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
          {view === 'dashboard' && <Dashboard onViewAllPeople={() => navigate('people')} />}
          {view === 'people' && <People />}
          {view === 'records' && <Records />}
          <footer className="mt-10 flex flex-col gap-1 text-[11px] text-muted sm:flex-row sm:justify-between">
            <span>Tororo Archdiocese · Sacramental Records Management</span>
            <span>Faith · Community · Record</span>
          </footer>
        </main>
      </div>

      <ModalHost />
    </div>);

}