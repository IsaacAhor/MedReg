"use client";
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NHIEStatus {
  patientUuid: string;
  syncStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'DLQ';
  nhiePatientId?: string;
  lastSyncAttempt?: string;
  retryCount: number;
  errorMessage?: string;
}

interface PatientDetails {
  uuid: string;
  display: string;
  identifiers: Array<{
    identifier: string;
    identifierType: { display: string };
  }>;
  person: {
    gender: string;
    birthdate: string;
    age: number;
  };
}

function NHIEStatusBadge({ status }: { status: string }) {
  const variants = {
    PENDING: { className: "bg-yellow-500 hover:bg-yellow-600", text: "Sync Pending" },
    SUCCESS: { className: "bg-green-500 hover:bg-green-600", text: "Synced to NHIE" },
    FAILED: { className: "bg-red-500 hover:bg-red-600", text: "Sync Failed" },
    DLQ: { className: "bg-gray-500 hover:bg-gray-600", text: "Manual Review Required" }
  };

  const variant = variants[status as keyof typeof variants] || variants.PENDING;

  return <Badge className={variant.className}>{variant.text}</Badge>;
}

export default function PatientHubPage() {
  const params = useParams<{ uuid: string }>();
  const router = useRouter();
  const uuid = params.uuid;

  // Fetch patient details
  const { data: patient, isLoading: patientLoading } = useQuery<PatientDetails>({
    queryKey: ['patient', uuid],
    queryFn: async () => {
      const response = await fetch(`/api/patients/${uuid}`);
      if (!response.ok) throw new Error('Failed to fetch patient');
      return response.json();
    }
  });

  // Fetch NHIE sync status with polling for pending/failed states
  const { data: nhieStatus, isLoading: statusLoading } = useQuery<NHIEStatus>({
    queryKey: ['nhie-status', uuid],
    queryFn: async () => {
      const response = await fetch(`/api/patients/${uuid}/nhie-status`);
      if (!response.ok) throw new Error('Failed to fetch NHIE status');
      return response.json();
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      // Poll every 5 seconds if sync is pending or failed (and retrying)
      if (data && (data.syncStatus === 'PENDING' ||
          (data.syncStatus === 'FAILED' && data.retryCount < 8))) {
        return 5000;
      }
      return false; // Stop polling if success or DLQ
    }
  });

  const go = (path: string) => router.push(`${path}?patientUuid=${encodeURIComponent(uuid)}`);

  const findIdentifier = (type: string) => {
    return patient?.identifiers.find(id =>
      id.identifierType.display.toLowerCase().includes(type.toLowerCase())
    )?.identifier;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Patient Demographics */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Details</CardTitle>
        </CardHeader>
        <CardContent>
          {patientLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : patient ? (
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{patient.display}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Gender / Age</p>
                  <p className="font-medium">{patient.person.gender} / {patient.person.age} years</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <p className="text-sm text-gray-500">Ghana Card</p>
                  <p className="font-mono text-sm">{findIdentifier('Ghana Card') || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">NHIS Number</p>
                  <p className="font-mono text-sm">{findIdentifier('NHIS') || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Folder Number</p>
                  <p className="font-mono text-sm">{findIdentifier('Folder') || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-mono text-sm">{patient.person.birthdate}</p>
                </div>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertDescription>Failed to load patient details</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* NHIE Sync Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>NHIE Synchronization Status</span>
            {nhieStatus && <NHIEStatusBadge status={nhieStatus.syncStatus} />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : nhieStatus ? (
            <div className="space-y-3">
              {nhieStatus.nhiePatientId && (
                <div>
                  <p className="text-sm text-gray-500">NHIE Patient ID</p>
                  <p className="font-mono text-sm font-medium">{nhieStatus.nhiePatientId}</p>
                </div>
              )}

              {nhieStatus.lastSyncAttempt && (
                <div>
                  <p className="text-sm text-gray-500">Last Sync Attempt</p>
                  <p className="text-sm">{new Date(nhieStatus.lastSyncAttempt).toLocaleString()}</p>
                </div>
              )}

              {nhieStatus.retryCount > 0 && (
                <div>
                  <p className="text-sm text-gray-500">Retry Count</p>
                  <p className="text-sm">{nhieStatus.retryCount} / 8 attempts</p>
                </div>
              )}

              {nhieStatus.errorMessage && (
                <Alert>
                  <AlertDescription className="text-sm">
                    {nhieStatus.errorMessage}
                  </AlertDescription>
                </Alert>
              )}

              {nhieStatus.syncStatus === 'PENDING' && (
                <p className="text-sm text-yellow-600">
                  Patient will be synchronized to NHIE shortly...
                </p>
              )}

              {nhieStatus.syncStatus === 'FAILED' && nhieStatus.retryCount < 8 && (
                <p className="text-sm text-orange-600">
                  Sync failed but will be retried automatically (attempt {nhieStatus.retryCount + 1}/8)
                </p>
              )}

              {nhieStatus.syncStatus === 'DLQ' && (
                <p className="text-sm text-red-600">
                  Sync failed after maximum retries. Manual intervention required.
                </p>
              )}
            </div>
          ) : (
            <Alert>
              <AlertDescription>Failed to load NHIE status</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* OPD Workflow Actions */}
      <Card>
        <CardHeader>
          <CardTitle>OPD Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => go('/opd/triage')}>Triage</Button>
            <Button variant="outline" onClick={() => go('/opd/consultation')}>Consultation</Button>
            <Button variant="outline" onClick={() => go('/opd/dispense')}>Dispense</Button>
            <Link href={`/patients/${uuid}/success`}>
              <Button variant="ghost" className="w-full">NHIS Coverage</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
