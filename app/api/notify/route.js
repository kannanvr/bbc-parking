import nodemailer from 'nodemailer';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const { vehicle, apartment, code } = await req.json();

    if (process.env.ACCESS_CODE && code !== process.env.ACCESS_CODE) {
      return Response.json({ error: 'Incorrect access code.' }, { status: 401 });
    }
    const plate = String(vehicle || '').toUpperCase().replace(/[\s\-_]/g, '');
    if (!/^[A-Z0-9]{6,12}$/.test(plate)) {
      return Response.json({ error: 'Enter a valid vehicle number.' }, { status: 400 });
    }
    const apt = String(apartment || '').trim();
    if (!apt) return Response.json({ error: 'Enter the apartment number.' }, { status: 400 });

    const key = apt.toUpperCase().replace(/[\s\-_/]/g, '');
    let resident;
    try {
      [resident] = await sql`
        SELECT apartment, name, email FROM residents
        WHERE regexp_replace(upper(apartment), '[\s\-_/]', '', 'g') = ${key}`;
    } catch (err) {
      console.error('DB lookup failed:', err.message);
      return Response.json({ error: 'Database problem: check DATABASE_URL in Vercel and that "npm run setup" was run.' }, { status: 500 });
    }
    if (!resident) {
      return Response.json({ error: `No resident found for apartment ${apt}. Check the number.` }, { status: 404 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: Number(process.env.SMTP_PORT || 465) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const when = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
    const charge = process.env.PARKING_CHARGE;
    const shownPlate = String(vehicle).toUpperCase().trim();
    const text =
      `Dear ${resident.name || 'Resident'},\n\n` +
      `A parking charge has been recorded for vehicle ${shownPlate} ` +
      `linked to apartment ${resident.apartment} at BBC City Park on ${when}.\n\n` +
      (charge ? `Charge: ${charge}\n\n` : '') +
      `Please contact the association if you have any questions.\n\nBBC City Park Association`;

    try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: resident.email,
      cc: process.env.ASSOCIATION_EMAIL,
      subject: `Parking charge – ${shownPlate} (Apt ${resident.apartment})`,
      text,
    });
    } catch (err) {
      console.error('Mail failed:', err.message);
      return Response.json({ error: 'Email could not be sent: check the SMTP settings (host, port, user, app password) in Vercel.' }, { status: 502 });
    }

    // Log only after the mail has gone out
    try {
      await sql`INSERT INTO notices (vehicle, apartment, sent_to)
                VALUES (${shownPlate}, ${resident.apartment}, ${resident.email})`;
    } catch (err) {
      console.error('Notice log failed:', err.message);
    }

    return Response.json({ message: `Notice sent to apartment ${resident.apartment} and the association.` });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Could not send the email. Please try again.' }, { status: 500 });
  }
}
