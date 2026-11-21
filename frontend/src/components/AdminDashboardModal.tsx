import React, { useEffect, useState } from 'react';
import { ShieldIcon } from 'lucide-react';
import { fetchAdminOverview } from '../api';
import { Modal } from './Modal';
import { secondaryButton } from '../utils/styles';

const when = (s?: string | null) => (s ? new Date(s).toLocaleString() : 'Never');

export function AdminDashboardModal({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdminOverview().then(setData).catch((e) => setError(e.message));
  }, []);

  return (
    <Modal
      title="Admin dashboard"
      subtitle="Staff accounts and parish activity"
      icon={<span className="grid h-10 w-10 place-items-center rounded-xl bg-sage text-sage-ink"><ShieldIcon className="h-5 w-5" /></span>}
      onClose={onClose}
      footer={<button type="button" onClick={onClose} className={secondaryButton}>Close</button>}>
      {error && <p className="text-sm text-danger">{error}</p>}
      {!data && !error && <p className="text-sm text-muted">Loading…</p>}
      {data &&
      <div className="space-y-6">
          <section>
            <h3 className="mb-2 text-sm font-semibold text-forest">Parishes</h3>
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-sm">
                <thead><tr className="bg-cream text-left text-[10px] tracking-wider text-muted">
                  <th className="px-3 py-2">PARISH</th><th className="px-3 py-2">BAPTISMS</th><th className="px-3 py-2">FHC</th><th className="px-3 py-2">CONF.</th><th className="px-3 py-2">MARR.</th>
                </tr></thead>
                <tbody className="divide-y divide-line">
                  {data.parishes.map((p: any) =>
                <tr key={p.id}><td className="px-3 py-2 font-medium text-ink">{p.name}</td><td className="px-3 py-2">{p.baptisms}</td><td className="px-3 py-2">{p.communions}</td><td className="px-3 py-2">{p.confirmations}</td><td className="px-3 py-2">{p.matrimonies}</td></tr>
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