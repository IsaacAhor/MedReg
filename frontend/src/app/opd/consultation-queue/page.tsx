"use client";
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/breadcrumb';

type QueueEntry = {
  uuid: string;
  queueNumber: string;
  status: string;
  priority: number;
  dateCreated: string;
  waitTime: number;
  patient: { uuid: string; display: string; identifiers: Array<{ identifier: string; identifierType: { display: string } }>; };
};

export default function ConsultationQueuePage() {
  const router = useRouter();
  const locationUuid = process.env.NEXT_PUBLIC_CONSULTATION_LOCATION_UUID || '';
  const { data, isLoading, refetch } = useQuery<{ results: QueueEntry[] }>({
    queryKey: ['consultQueue', locationUuid],
    queryFn: async () => {
      if (!locationUuid) return { results: [] } as any;
      const res = await fetch(`/api/opd/queue/${encodeURIComponent(locationUuid)}?status=PENDING`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch queue');
      return res.json();
    },
    refetchInterval: 10000,
    enabled: !!locationUuid,
  });

  const startConsult = (patientUuid: string, queueUuid: string) => {
    router.push(`/opd/consultation?patientUuid=${encodeURIComponent(patientUuid)}&queueUuid=${encodeURIComponent(queueUuid)}`);
  };

  const waitColor = (m: number) => (m < 15 ? 'bg-green-500' : m < 30 ? 'bg-yellow-500' : 'bg-red-500');
  const findId = (ids: any[], type: string) => ids.find((i: any) => (i.identifierType?.display || '').toLowerCase().includes(type))?.identifier || '—';
  const list = data?.results || [];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Breadcrumb items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Consultation Queue' },
      ]} />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Consultation Queue</h1>
        <div className="flex gap-3"><Button variant="outline" onClick={() => refetch()}>Refresh</Button></div>
      </div>
      <Card>
        <CardHeader><CardTitle>Waiting Patients</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
          ) : list.length === 0 ? (
            <div className="text-center py-8 text-gray-500"><Clock className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>No patients in queue</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Queue #</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Folder</TableHead>
                  <TableHead>Ghana Card</TableHead>
                  <TableHead>Wait</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((e) => (
                  <TableRow key={e.uuid}>
                    <TableCell className="font-mono">{e.queueNumber}</TableCell>
                    <TableCell>{e.patient.display}</TableCell>
                    <TableCell className="font-mono text-sm">{findId(e.patient.identifiers, 'folder')}</TableCell>
                    <TableCell className="font-mono text-sm">{(findId(e.patient.identifiers, 'ghana') || '').slice(0, 8)}...</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${waitColor(e.waitTime)}`} /><span className="text-sm">{e.waitTime} min</span></div>
                    </TableCell>
                    <TableCell>{e.priority === 1 ? (<Badge variant="destructive">Urgent</Badge>) : e.priority <= 3 ? (<Badge variant="secondary">High</Badge>) : (<Badge variant="outline">Normal</Badge>)}</TableCell>
                    <TableCell><Button size="sm" onClick={() => startConsult(e.patient.uuid, e.uuid)}>Start Consultation</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
