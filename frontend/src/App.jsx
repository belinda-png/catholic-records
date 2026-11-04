import React from 'react';
import { AppShell } from './components/AppShell';
import { RecordsProvider } from './contexts/RecordsContext';
import { UIProvider } from './contexts/UIContext';

export function App() {
  return (
    <RecordsProvider>
      <UIProvider>
        <AppShell />
      </UIProvider>
    </RecordsProvider>);

}