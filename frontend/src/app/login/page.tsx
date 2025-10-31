"use client";
import { LoginForm } from '@/components/auth/login-form';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">M</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">MedReg</span>
            </div>
          </Link>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">Sign in</h2>
          <p className="mt-2 text-sm text-gray-600">Use your OpenMRS credentials</p>
        </div>
        <LoginForm />
        <p className="text-center text-xs text-gray-500">admin / Admin123 for local dev</p>
      </div>
    </div>
  );
}

