import React, { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { ParishSelector } from '../components/ParishSelector';
import { PeopleDirectory } from '../components/PeopleDirectory';

export function People() {
  const [refreshing, setRefreshing] = useState(false);
  return (
    <div className="space-y-8">
      <PageHeader title="People Directory" description="Everyone baptised across the parishes of the archdiocese." />
      <ParishSelector refreshing={refreshing} onRefresh={() => {setRefreshing(true);window.setTimeout(() => setRefreshing(false), 600);}} />
      <PeopleDirectory />
    </div>);

}