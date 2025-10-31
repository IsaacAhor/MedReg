"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Activity, Users, FileText, Calendar, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">MedReg</span>
          </div>
          <Link href="/login">
            <Button className="bg-teal-600 hover:bg-teal-700 text-white">Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Ghana EMR System</h1>
          <p className="text-lg text-gray-600">Electronic Medical Records for healthcare facilities</p>
        </div>

        {/* Quick Access Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Link href="/patients/register" className="block no-underline">
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Patient Registration</h3>
              <p className="text-sm text-gray-600">Register new patients with Ghana Card and NHIS verification</p>
            </div>
          </Link>

          <Link href="/opd" className="block no-underline">
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">OPD Workflow</h3>
              <p className="text-sm text-gray-600">Triage, consultation, pharmacy, and billing</p>
            </div>
          </Link>

          <Link href="/records" className="block no-underline">
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Medical Records</h3>
              <p className="text-sm text-gray-600">Access and manage patient medical history</p>
            </div>
          </Link>

          <Link href="/appointments" className="block no-underline">
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Appointments</h3>
              <p className="text-sm text-gray-600">Schedule and manage patient appointments</p>
            </div>
          </Link>
        </div>

        {/* System Info */}
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-teal-600 mb-2">5 min</div>
              <div className="text-sm text-gray-600">Average patient registration time</div>
            </div>
            <div>
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-sm text-gray-600">NHIE compliant • Ghana standards</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-teal-600 mb-2">6 Roles</div>
              <div className="text-sm text-gray-600">Admin, Doctor, Nurse, Pharmacist, Records, Cashier</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-600">
          <p>© 2025 MedReg — Ghana Electronic Medical Records System</p>
          <p className="mt-2">Built for Ghana healthcare facilities</p>
        </div>
      </footer>
    </div>
  );
}

