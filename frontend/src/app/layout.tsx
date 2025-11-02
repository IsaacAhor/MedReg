import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import Link from 'next/link';
import { cookies } from 'next/headers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MedReg - Ghana EMR System',
  description: 'Ghana NHIE-Compliant Electronic Medical Records System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const rolesRaw = cookies().get('omrsRole')?.value || '';
  const roles = rolesRaw.split(',').map(r => r.trim().toLowerCase());
  const isAdmin = roles.includes('admin') || roles.includes('platform admin') || roles.includes('facility admin');
  const canTriage = isAdmin || roles.includes('nurse') || roles.includes('records officer');
  const canConsult = isAdmin || roles.includes('doctor');
  const canDispense = isAdmin || roles.includes('pharmacist');
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <header className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
              <Link href="/" className="text-sm text-gray-800 font-semibold">MedReg</Link>
              <nav className="flex items-center gap-4 text-sm text-gray-600">
                <Link href="/dashboard">Dashboard</Link>
                <Link href="/reports">Reports</Link>
                {canTriage && <Link href="/opd/triage">Triage</Link>}
                {canConsult && <Link href="/opd/consultation">Consult</Link>}
                {canDispense && <Link href="/opd/dispense">Dispense</Link>}
                {isAdmin && <Link href="/admin/nhie-queue">NHIE Queue</Link>}
              </nav>
            </div>
          </header>
          {children}
        </Providers>
      </body>
    </html>
  );
}
