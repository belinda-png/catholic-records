import React, { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { ParishSelector } from '../components/ParishSelector';
import { PeopleDirectory } from '../components/PeopleDirectory';
import { SacramentCards } from '../components/SacramentCards';

interface DashboardProps {
  onViewAllPeople: () => void;
}

export function Dashboard({ onViewAllPeople }: DashboardProps) {
  const [refreshing, setRefreshing] = useState(false);

  const refresh = () => {
    setRefreshing(true);
    window.setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Sacramental Records" description="A central place to preserve, manage, and find parish records." />
      <ParishSelector refreshing={refreshing} onRefresh={refresh} />
      <section aria-labelledby="overview-title">
        <h2 id="overview-title" className="text-lg font-semibold text-forest">Parish overview</h2>
        <p className="mb-4 text-xs text-muted">Tap a sacrament to record a new entry</p>
        <SacramentCards loading={refreshing} />
      </section>
      <PeopleDirectory limit={6} onViewAll={onViewAllPeople} />
    </div>);

}