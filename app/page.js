'use client';
import { useState } from 'react';

export default function Home() {
  const [status, setStatus] = useState(null); // {type:'ok'|'err', text}
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Something went wrong.');
      setStatus({ type: 'ok', text: json.message });
      form.reset();
    } catch (err) {
      setStatus({ type: 'err', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="shell">
      <img className="photo" src="/bbc-city-park.png" alt="BBC City Park apartment building" width="355" height="399" />
    <main>
      <h1>BBC City Park<br />Parking charge notice</h1>
      <p className="sub">
        Enter the vehicle and apartment number. The resident and the association
        will both receive an email.
      </p>

      <form onSubmit={onSubmit}>
        <label>
          Vehicle number
          <input className="plate" name="vehicle" placeholder="TN 09 AB 1234" required autoComplete="off" />
        </label>
        <label>
          Apartment number
          <input name="apartment" placeholder="e.g. A-101" required autoComplete="off" />
        </label>
        <label>
          Access code <small>(if the association has given you one)</small>
          <input name="code" type="password" autoComplete="off" />
        </label>
        <button type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send notice'}</button>
      </form>

      {status && <div className={`msg ${status.type}`} role="status">{status.text}</div>}
    </main>
    </div>
  );
}
