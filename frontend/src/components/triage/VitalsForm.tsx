"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vitalsSchema, type VitalsFormData, calculateBMI, getBMICategory } from '@/lib/schemas/vitals';
import { useRecordVitals } from '@/hooks/useRecordVitals';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VitalsFormProps {
  patientUuid: string;
  patientName: string;
  onSuccess?: () => void;
}

export function VitalsForm({ patientUuid, patientName, onSuccess }: VitalsFormProps) {
  const form = useForm<VitalsFormData>({
    resolver: zodResolver(vitalsSchema),
    defaultValues: {
      patientUuid,
      bpSystolic: undefined as any,
      bpDiastolic: undefined as any,
      temperature: undefined as any,
      weight: undefined as any,
      height: undefined as any,
    },
    mode: 'onChange',
  });

  const recordVitals = useRecordVitals();
  const [bmi, setBMI] = useState<number | null>(null);

  const weight = form.watch('weight');
  const height = form.watch('height');

  useEffect(() => {
    if (typeof weight === 'number' && typeof height === 'number' && weight > 0 && height > 0) {
      setBMI(calculateBMI(weight, height));
    } else {
      setBMI(null);
    }
  }, [weight, height]);

  const onSubmit = async (data: VitalsFormData) => {
    try {
      await recordVitals.mutateAsync(data);
      form.reset({ patientUuid } as any);
      setBMI(null);
      onSuccess?.();
    } catch {
      // handled in onError
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Vitals - {patientName}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bpSystolic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BP Systolic (mmHg) *</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        type="number"
                        placeholder="120"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : (undefined as any))}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Normal range: 90-120 mmHg</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bpDiastolic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BP Diastolic (mmHg) *</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        type="number"
                        placeholder="80"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : (undefined as any))}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Normal range: 60-90 mmHg</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperature (°C) *</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        type="number"
                        step="0.1"
                        placeholder="36.8"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : (undefined as any))}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Normal range: 36.1-37.2 °C</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg) *</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        type="number"
                        step="0.1"
                        placeholder="70"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : (undefined as any))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (cm) *</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        type="number"
                        placeholder="170"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : (undefined as any))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {typeof bmi === 'number' && (
              <div className="p-4 border rounded-lg bg-muted">
                <p className="text-sm font-medium">Calculated BMI</p>
                <p className={`text-2xl font-bold ${getBMICategory(bmi).color}`}>
                  {bmi.toFixed(1)} - {getBMICategory(bmi).category}
                </p>
              </div>
            )}

            <Button type="submit" disabled={recordVitals.isPending} className="w-full">
              {recordVitals.isPending ? 'Recording…' : 'Record Vitals'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

