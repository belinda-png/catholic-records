import React, { FormEvent, ReactNode, useEffect, useState } from 'react';
import { completeSignup, fetchPublicParishes, getToken, requestLoginCode, requestSignupCode, verifyLoginCode } from '../auth';
import { inputClass, primaryButton, secondaryButton } from '../utils/styles';

type Mode = 'login' | 'signup';

export function LoginGate({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(!!getToken());
  const [mode, setMode] = useState<Mode>('login');
  const [step, setStep] = useState<'details' | 'code'>('details');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [parishId, setParishId] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [otp, setOtp] = useState('');
  const [parishes, setParishes] = useState<{ id: number; name: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => { if (!signedIn) fetchPublicParishes().then(setParishes).catch(() => {}); }, [signedIn]);

  if (signedIn) return <>{children}</>;

  const run = async (fn: () => Promise<unknown>, onOk: () => void) => {
    setBusy(true); setError('');
    try { await fn(); onOk(); } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.'); }
    setBusy(false);
  };

  const sendCode = (e: FormEvent) => {
    e.preventDefault();
    run(
      () => (mode === 'login' ? requestLoginCode(email.trim()) : requestSignupCode(fullName.trim(), email.trim(), parishId)),
      () => { setStep('code'); setNotice('We sent a code to your email.'); }
    );
  };

  const verify = (e: FormEvent) => {
    e.preventDefault();
    run(
      () => (mode === 'login' ? verifyLoginCode(email.trim(), otp.trim()) : completeSignup(email.trim(), otp.trim(), accessCode.trim())),
      () => window.location.reload()
    );
  };

  const switchMode = (m: Mode) => { setMode(m); setStep('details'); setError(''); setNotice(''); setOtp(''); };
  const label = 'mb-1 block text-xs font-semibold text-muted';

  return (
    <div className="grid min-h-screen place-items-center bg-cream px-4">
      <form onSubmit={step === 'details' ? sendCode : verify} className="w-full max-w-sm space-y-4 rounded-2xl border border-line bg-paper p-6">
        <div>
          <h1 className="text-xl font-semibold text-forest">Parish Records</h1>
          <p className="text-sm text-muted">{mode === 'login' ? 'Sign in with a code sent to your email' : 'Create your parish account'}</p>
        </div>

        {step === 'details' ?
        <>
            {mode === 'signup' &&
          <>
                <div>
                  <label htmlFor="su-name" className={label}>FULL NAME</label>
                  <input id="su-name" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="su-parish" className={label}>YOUR PARISH</label>
                  <select id="su-parish" value={parishId} onChange={(e) => setParishId(e.target.value)} className={inputClass}>
                    <option value="">Select parish…</option>
                    {parishes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </>
          }
            <div>
              <label htmlFor="lg-email" className={label}>EMAIL</label>
              <input id="lg-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>
          </> :

        <>
            {notice && <p className="text-sm text-sage-ink">{notice}</p>}
            <div>
              <label htmlFor="lg-otp" className={label}>EMAIL CODE</label>
              <input id="lg-otp" inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(e) => setOtp(e.target.value)} className={inputClass} />
            </div>
            {mode === 'signup' &&
          <div>
                <label htmlFor="su-access" className={label}>PARISH ACCESS CODE</label>
                <input id="su-access" value={accessCode} onChange={(e) => setAccessCode(e.target.value)} className={inputClass} />
              </div>
          }
          </>
        }

        {error && <p className="text-sm text-danger" role="alert">{error}</p>}

        <button type="submit" disabled={busy} className={`${primaryButton} w-full justify-center`}>
          {busy ? 'Please wait…' : step === 'details' ? 'Send code' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
        {step === 'code' &&
        <button type="button" onClick={() => switchMode(mode)} className={`${secondaryButton} w-full justify-center`}>Back</button>
        }
        <p className="text-center text-xs text-muted">
          {mode === 'login' ?
          <>New here? <button type="button" onClick={() => switchMode('signup')} className="font-semibold text-forest underline">Create an account</button></> :
          <>Have an account? <button type="button" onClick={() => switchMode('login')} className="font-semibold text-forest underline">Sign in</button></>}
        </p>
      </form>
    </div>);

}