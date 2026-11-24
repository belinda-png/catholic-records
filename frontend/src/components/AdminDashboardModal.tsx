import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { ShieldIcon } from 'lucide-react';
import { createParish, fetchAdminOverview, resetParishCode } from '../api';
import { useRecords } from '../contexts/RecordsContext';
import { inputClass, primaryButton, secondaryButton } from '../utils/styles';
import { Modal } from './Modal';

const when = (s?: string | null) => (s ? new Date(s).toLocaleString() : 'Never');

export function AdminDashboardModal({ onClose }: { onClose: () => void }) {
  const { reload } = useRecords();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(
    () => fetchAdminOverview().then(setData).catch((e) => setError(e.message)),
    []
  );
  useEffect(() => { load(); }, [load]);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      const p = await createParish(name.trim(), location.trim());
      setNotice(`${p.name} added. Access code: ${p.access_code}`);
      setName(''); setLocation('');
      await load();
      await reload(); // refresh the parish lists in the app
    } catch (err) {
      setError(err instanceof Error ? err.message.replace(/^Request to .*?failed \(\d+\) /, '') : 'Could not add the parish.');
    }
    setBusy(false);
  };

  const reset = async (id: number, parishName: string) => {
    if (!window.confirm(`Create a new access code for ${parishName}? The old one stops working.`)) return;
    try {
      const r = await resetParishCode(id);
      setNotice(`New access code for ${parishName}: ${r.access_code}`);
      await load();
    } catch {
      setError('Could not reset the code.');
    }
  };

  return (
    <Modal
      title="Admin dashboard"
      subtitle="Parishes, access codes and staff accounts"
      icon={<span className="grid h-10 w-10 place-items-center rounded-xl bg-sage text-sage-ink"><ShieldIcon className="h-5 w-5" /></span>}
      onClose={onClose}
      footer={<button type="button" onClick={onClose} className={secondaryButton}>Close</button>}>
      {error && <p className="mb-3 rounded-xl bg-amber-soft px-4 py-3 text-sm text-danger" role="alert">{error}</p>}
      {notice && <p className="mb-3 rounded-xl bg-sage px-4 py-3 text-sm font-medium text-sage-ink" role="status">{notice}</p>}
      {!data && !error && <p className="text-sm text-muted">Loading…</p>}

      {data &&
      <div className="space-y-6">
          <section>
            <h3 className="mb-2 text-sm font-semibold text-forest">Add a parish</h3>
            <form onSubmit={add} className="flex flex-col gap-2 sm:flex-row">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Parish name, e.g. St. Peter, Nagongera Parish" className={`${inputClass} flex-1`} />
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (optional)" className={`${inputClass} sm:w-48`} />
              <button type="submit" disabled={busy || !name.trim()} className={`${primaryButton} disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500`}>
                {busy ? 'Adding…' : 'Add parish'}
              </button>
            </form>
            <p className="mt-1 text-xs text-muted">Each new parish gets its own access code automatically.</p>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-forest">Parishes · {data.parishes.length}</h3>
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-sm">
                <thead><tr className="bg-cream text-left text-[10px] tracking-wider text-muted">
                  <th className="px-3 py-2">PARISH</th><th className="px-3 py-2">ACCESS CODE</th><th className="px-3 py-2">BAPT.</th><th className="px-3 py-2">FHC</th><th className="px-3 py-2">CONF.</th><th className="px-3 py-2">MARR.</th><th className="px-3 py-2"></th>
                </tr></thead>
                <tbody className="divide-y divide-line">
                  {data.parishes.map((p: any) =>
                <tr key={p.id}>
                      <td className="px-3 py-2 font-medium text-ink">{p.name}{!p.is_active && <span className="ml-2 text-xs text-danger">inactive</span>}</td>
                      <td className="px-3 py-2 font-mono tracking-wider text-forest">{p.access_code || '—'}</td>
                      <td className="px-3 py-2">{p.baptisms}</td><td className="px-3 py-2">{p.communions}</td><td className="px-3 py-2">{p.confirmations}</td><td className="px-3 py-2">{p.matrimonies}</td>
                      <td className="px-3 py-2 text-right"><button type="button" onClick={() => reset(p.id, p.name)} className="text-xs font-medium text-forest underline hover:text-gold">Reset code</button></td>
                    </tr>
                )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-forest">Staff accounts · {data.staff.length}</h3>
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-sm">
                <thead><tr className="bg-cream text-left text-[10px] tracking-wider text-muted">
                  <th className="px-3 py-2">NAME</th><th className="px-3 py-2">EMAIL</th><th className="px-3 py-2">PARISH</th><th className="px-3 py-2">LAST SIGN-IN</th><th className="px-3 py-2">STATUS</th>
                </tr></thead>
                <tbody className="divide-y divide-line">
                  {data.staff.map((s: any) =>
                <tr key={s.id}>
                      <td className="px-3 py-2 font-medium text-ink">{s.name}</td>
                      <td className="px-3 py-2">{s.email}</td>
                      <td className="px-3 py-2">{s.parish}</td>
                      <td className="px-3 py-2 text-muted">{when(s.last_login)}</td>
                      <td className={`px-3 py-2 ${s.is_active ? 'text-sage-ink' : 'text-danger'}`}>{s.is_active ? 'Active' : 'Inactive'}</td>
                    </tr>
                )}
                </tbody>
              </table>
            </div>
          </section>

          {data.pending.length > 0 &&
        <section>
              <h3 className="mb-2 text-sm font-semibold text-forest">Started sign-up, not finished</h3>
              <ul className="text-sm text-muted">{data.pending.map((p: any) => <li key={p.email}>{p.full_name} · {p.email} · {p.parish__name}</li>)}</ul>
            </section>
        }
        </div>
      }
    </Modal>);
}