import './globals.css';
import { Figtree } from 'next/font/google';

const font = Figtree({ subsets: ['latin'] });

export const metadata = {
  title: 'BBC City Park – Parking Charge',
  description: 'Record a parking violation and notify the resident and the association.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={font.className}>{children}</body>
    </html>
  );
}
