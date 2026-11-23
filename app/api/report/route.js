import * as XLSX from 'xlsx';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  const expected = process.env.REPORT_CODE;
  if (!expected) return Response.json({ error: 'REPORT_CODE is not set on the server.' }, { status: 500 });
  if (req.headers.get('x-report-code') !== expected) {
    return Response.json({ error: 'Incorrect report code.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month') || ''; // YYYY-MM
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return Response.json({ error: 'Choose a month.' }, { status: 400 });
  }
  const start = `${month}-01`;

  // Month boundaries are in Indian Standard Time
  const rows = await sql`
    SELECT to_char(n.sent_at AT TIME ZONE 'Asia/Kolkata', 'DD-Mon-YYYY HH24:MI') AS date_time,
           n.vehicle, n.apartment, COALESCE(r.name, '') AS resident, n.sent_to AS email
    FROM notices n LEFT JOIN residents r ON r.apartment = n.apartment
    WHERE n.sent_at >= (${start}::timestamp AT TIME ZONE 'Asia/Kolkata')
      AND n.sent_at <  ((${start}::timestamp + interval '1 month') AT TIME ZONE 'Asia/Kolkata')
    ORDER BY n.sent_at`;

  if (searchParams.get('format') !== 'xlsx') return Response.json({ rows });

  const byApt = {};
  rows.forEach((r) => { byApt[r.apartment] = (byApt[r.apartment] || 0) + 1; });
  const summary = Object.entries(byApt)
    .sort((a, b) => b[1] - a[1])
    .map(([apartment, notices]) => ({ Apartment: apartment, Notices: notices }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
    rows.map((r) => ({ 'Date & time': r.date_time, Vehicle: r.vehicle, Apartment: r.apartment, Resident: r.resident, Email: r.email }))
  ), 'Notices');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), 'By apartment');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="parking-report-${month}.xlsx"`,
    },
  });
}
