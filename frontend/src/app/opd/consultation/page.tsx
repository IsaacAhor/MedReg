"use client";
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { TOP_DIAGNOSES } from '@/lib/gh/top-diagnoses';
import { ESSENTIAL_MEDICINES } from '@/lib/gh/essential-medicines';
import { COMMON_LAB_TESTS } from '@/lib/gh/common-labs';
import { consultationSchema, type ConsultationFormData } from '@/lib/schemas/consultation';
import { useConsultation } from '@/hooks/useConsultation';

export default function ConsultationPage() {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialUuid = params?.get('patientUuid') || '';
  const [allowed, setAllowed] = React.useState(true);
  React.useEffect(() => {
    try {
      const m = document.cookie.match(/(?:^|;\s*)omrsRole=([^;]+)/);
      const rolesCsv = m ? decodeURIComponent(m[1]) : '';
      const roles = rolesCsv.split(',').map(r => r.trim().toLowerCase());
      const isAdmin = roles.includes('admin') || roles.includes('platform admin') || roles.includes('facility admin');
      const ok = isAdmin || roles.includes('doctor');
      setAllowed(ok);
    } catch { setAllowed(true); }
  }, []);

  const form = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      patientUuid: initialUuid,
      chiefComplaint: '',
      diagnoses: [],
      prescriptions: [],
      labs: [],
    },
  });

  const mutation = useConsultation();

  const onSubmit = (values: ConsultationFormData) => {
    if (!allowed) return;
    mutation.mutate(values);
  };

  const toggleDiagnosis = (code: string, display: string) => {
    const current = form.getValues('diagnoses');
    const exists = current.find((d: any) => (typeof d === 'string' ? d === code : d.code === code));
    const next = exists
      ? current.filter((d: any) => (typeof d === 'string' ? d !== code : d.code !== code))
      : [...current, { code, display }];
    form.setValue('diagnoses', next, { shouldValidate: true });
  };

  const addPrescription = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const list = form.getValues('prescriptions');
    if (!list.includes(trimmed)) {
      form.setValue('prescriptions', [...list, trimmed], { shouldValidate: true });
    }
  };

  const removePrescription = (value: string) => {
    form.setValue('prescriptions', form.getValues('prescriptions').filter(v => v !== value), { shouldValidate: true });
  };

  const toggleLab = (_code: string, name: string) => {
    const label = `${name}`;
    const list = form.getValues('labs');
    form.setValue('labs', list.includes(label) ? list.filter(v => v !== label) : [...list, label], { shouldValidate: true });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">OPD Consultation</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="patientUuid"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Patient UUID</FormLabel>
                <FormControl>
                  <Input placeholder="patient-uuid" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="chiefComplaint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chief Complaint</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="e.g., Fever and headache for 3 days" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <div className="text-sm text-gray-700 mb-2">Diagnoses (quick picks)</div>
            <div className="grid md:grid-cols-2 gap-3">
              {TOP_DIAGNOSES.map(d => {
                const selected = (form.getValues('diagnoses') || []).find((x: any) => (typeof x === 'string' ? x === d.code : x.code === d.code));
                return (
                  <button
                    type="button"
                    key={d.code}
                    onClick={() => toggleDiagnosis(d.code, d.display)}
                    className={`text-left border rounded px-3 py-2 text-sm ${selected ? 'border-teal-600 bg-teal-50' : 'border-gray-200'}`}
                  >
                    <div className="font-medium">{d.display}</div>
                    <div className="text-xs text-gray-600">{d.code}</div>
                  </button>
                );
              })}
            </div>
            <FormMessage>{form.formState.errors.diagnoses?.message as any}</FormMessage>
          </div>

          <div>
            <div className="text-sm text-gray-700 mb-2">Prescriptions (essential medicines)</div>
            <div className="flex gap-2 flex-wrap mb-2">
              {ESSENTIAL_MEDICINES.map(m => {
                const label = `${m.name}${m.strength ? ` ${m.strength}` : ''}${m.form ? ` ${m.form}` : ''}`.trim();
                const active = form.getValues('prescriptions').includes(label);
                return (
                  <button
                    type="button"
                    key={m.code}
                    className={`text-xs border rounded px-2 py-1 ${active ? 'border-teal-600 bg-teal-50' : 'border-gray-200'}`}
                    onClick={() => (active ? removePrescription(label) : addPrescription(label))}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add custom prescription (free text)"
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addPrescription(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-700 mb-2">Lab Orders</div>
            <div className="flex gap-2 flex-wrap">
              {COMMON_LAB_TESTS.map(t => {
                const active = form.getValues('labs').includes(t.name);
                return (
                  <button
                    type="button"
                    key={t.code}
                    className={`text-xs border rounded px-2 py-1 ${active ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'}`}
                    onClick={() => toggleLab(t.code, t.name)}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={!allowed || mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save Consultation'}
            </Button>
            {!allowed && <span className="text-xs text-amber-600">Insufficient role to save consultation</span>}
          </div>
        </form>
      </Form>
    </div>
  );
}
