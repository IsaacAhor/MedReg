import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { HeaderNav } from '@/components/layout/header-nav';
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
          <HeaderNav
            isAdmin={isAdmin}
            canTriage={canTriage}
            canConsult={canConsult}
            canDispense={canDispense}
          />
          {children}
        </Providers>
      </body>
    </html>
  );
}
