import React, { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { ParishSelector } from '../components/ParishSelector';
import { RecordsTable } from '../components/RecordsTable';

export function Records() {
  const [refreshing, setRefreshing] = useState(false);
  return (
    <div className="space-y-8">
      <PageHeader title="Sacramental Register" description="Every baptism, communion, confirmation and marriage on record." />
      <ParishSelector refreshing={refreshing} onRefresh={() => {setRefreshing(true);window.setTimeout(() => setRefreshing(false), 600);}} />
      <RecordsTable />
    </div>);

}