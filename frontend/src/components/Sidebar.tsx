import React from 'react';
import { ChurchIcon, CrossIcon, LayoutDashboardIcon, ScrollTextIcon, UsersIcon, XIcon } from 'lucide-react';
import { AppView } from '../types/records';

interface SidebarProps {
  view: AppView;
  onNavigate: (view: AppView) => void;
  onClose?: () => void;
}

const navItems: {view: AppView;label: string;icon: typeof UsersIcon;}[] = [
{ view: 'dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
{ view: 'people', label: 'People directory', icon: UsersIcon },
{ view: 'records', label: 'Sacramental records', icon: ScrollTextIcon }];


export function Sidebar({ view, onNavigate, onClose }: SidebarProps) {
  return (
    <div className="flex h-full w-64 flex-col bg-forest text-white">
      <div className="flex items-center gap-3 px-5 py-6">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-gold-bright/70 text-gold-bright">
          <ChurchIcon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-tight">Parish Records</p>
          <p className="text-[10px] font-medium tracking-[0.16em] text-white/60">TORORO ARCHDIOCESE</p>
        </div>
        {onClose &&
        <button type="button" onClick={onClose} aria-label="Close menu" className="grid h-8 w-8 place-items-center rounded-lg text-white/70 hover:bg-white/10">
            <XIcon className="h-5 w-5" />
          </button>
        }
      </div>
      <div className="mx-5 h-px bg-white/10" />
      <nav aria-label="Main" className="flex-1 px-3 py-6">
        <p className="px-3 pb-3 text-[11px] font-semibold tracking-[0.14em] text-white/50">MAIN MENU</p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = view === item.view;
            const Icon = item.icon;
            return (
              <li key={item.view}>
                <button
                  type="button"
                  onClick={() => onNavigate(item.view)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex w-full items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm transition-colors duration-150 ${
                  active ? 'border-gold-bright bg-white/10 font-medium text-white' : 'border-transparent text-white/75 hover:bg-white/5 hover:text-white'}`
                  }>
                  
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </button>
              </li>);

          })}
        </ul>
      </nav>
      <div className="mx-5 h-px bg-white/10" />
      <div className="flex items-start gap-3 px-5 py-5 text-xs text-white/70">
        <CrossIcon className="mt-0.5 h-4 w-4 text-gold-bright" aria-hidden="true" />
        <p>Faithfully preserving<br />our sacramental history.</p>
      </div>
    </div>);

}