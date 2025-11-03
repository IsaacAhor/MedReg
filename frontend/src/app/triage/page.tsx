"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { VitalsForm } from '@/components/triage/VitalsForm';

export default function TriagePage() {
  // TODO: Replace with real triage queue selection
  const [selectedPatient, setSelectedPatient] = useState<{ uuid: string; name: string } | null>(null);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Triage - Vitals Entry</h1>

      {selectedPatient ? (
        <VitalsForm
          patientUuid={selectedPatient.uuid}
          patientName={selectedPatient.name}
          onSuccess={() => setSelectedPatient(null)}
        />
      ) : (
        <Card className="p-6">
          <p>Select a patient from the triage queue to record vitals.</p>
          {/* TODO: Add patient queue list and location check (Triage) */}
        </Card>
      )}
    </div>
  );
}

