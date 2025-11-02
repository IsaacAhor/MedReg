"use client";
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PatientHubPage() {
  const params = useParams<{ uuid: string }>();
  const router = useRouter();
  const uuid = params.uuid;

  const go = (path: string) => router.push(`${path}?patientUuid=${encodeURIComponent(uuid)}`);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Patient</h1>
      <div className="font-mono text-sm break-all text-gray-700">{uuid}</div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={() => go('/opd/triage')}>Triage</Button>
        <Button variant="outline" onClick={() => go('/opd/consultation')}>Consultation</Button>
        <Button variant="outline" onClick={() => go('/opd/dispense')}>Dispense</Button>
        <Link href={`/patients/${uuid}/success`}><Button variant="ghost">Coverage</Button></Link>
      </div>
    </div>
  );
}

