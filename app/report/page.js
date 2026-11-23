'use client';
import { useState } from 'react';

const thisMonth = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }).slice(0, 7);

export default function Report() {
  const [month, setMonth] = useState(thisMonth());
  const [code, setCode] = useState('');
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function call(format) {
    setBusy(true); setError('');
    try {
      const res = await fetch(`/api/report?month=${month}${format ? `&format=${format}` : ''}`, {
        headers: { 'x-report-code': code },
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Could not load the report.');
      if (format === 'xlsx') {
        const url = URL.createObjectURL(await res.blob());
        const a = Object.assign(document.createElement('a'), { href: url, download: `parking-report-${month}.xlsx` });
        a.click(); URL.revokeObjectURL(url);
      } else {
        setRows((await res.json()).rows);
      }
    } catch (e) { setError(e.message); setRows(null); }
    finally { setBusy(false); }
  }

  return (
    <main className="wide">
      <h1>Monthly parking report</h1>
      <p className="sub">Pick a month to see every notice sent, or download it as an Excel file.</p>
      <div className="card controls">
        <label>Month<input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></label>
        <label>Report code<input type="password" value={code} onChange={(e) => setCode(e.target.value)} /></label>
        <button onClick={() => call()} disabled={busy || !code}>Show report</button>
        <button className="alt" onClick={() => call('xlsx')} disabled={busy || !code}>Download Excel</button>
      </div>
      {error && <div className="msg err" role="alert">{error}</div>}
      {rows && (
        <div className="card">
          <p><strong>{rows.length}</strong> notice{rows.length === 1 ? '' : 's'} in {month}</p>
          {rows.length > 0 && (
            <div className="scroll">
              <table>
                <thead><tr><th>Date &amp; time</th><th>Vehicle</th><th>Apartment</th><th>Resident</th></tr></thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}><td>{r.date_time}</td><td>{r.vehicle}</td><td>{r.apartment}</td><td>{r.resident}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
