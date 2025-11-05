"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PatientSearchHeader } from '@/components/patient/patient-search-header';
import { useLogout, useSession } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';

interface HeaderNavProps {
  isAdmin: boolean;
  canTriage: boolean;
  canConsult: boolean;
  canDispense: boolean;
}

export function HeaderNav({ isAdmin, canTriage, canConsult, canDispense }: HeaderNavProps) {
  const logout = useLogout();
  const { data: session } = useSession();
  const pathname = usePathname();

  // Don't show nav on login page
  if (pathname === '/login') {
    return null;
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-gray-800 font-semibold">
            MedReg
          </Link>

          {/* Global Patient Search */}
          <PatientSearchHeader />
        </div>

        <nav className="flex items-center gap-4 text-sm text-gray-600">
          <Link href="/dashboard" className="hover:text-gray-900">
            Dashboard
          </Link>
          <Link href="/patients" className="hover:text-gray-900">
            Patients
          </Link>
          <Link href="/reports" className="hover:text-gray-900">
            Reports
          </Link>
          {canTriage && (
            <Link href="/opd/triage-queue" className="hover:text-gray-900">
              Triage Queue
            </Link>
          )}
          {canConsult && (
            <Link href="/opd/consultation-queue" className="hover:text-gray-900">
              Consult Queue
            </Link>
          )}
          {canDispense && (
            <Link href="/opd/pharmacy-queue" className="hover:text-gray-900">
              Pharmacy Queue
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin/nhie-queue" className="hover:text-gray-900">
              NHIE Queue
            </Link>
          )}

          {/* User menu */}
          <div className="ml-2 flex items-center gap-2 border-l pl-4">
            <span className="text-xs text-gray-500">
              {session?.user?.display || 'User'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              className="text-xs"
            >
              {logout.isPending ? 'Logging out...' : 'Logout'}
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
