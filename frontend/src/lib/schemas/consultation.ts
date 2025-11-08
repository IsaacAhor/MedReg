import { z } from 'zod';

export const diagnosisItem = z.object({ code: z.string().min(1), display: z.string().min(1) });

export const consultationSchema = z.object({
  patientUuid: z.string().min(10, 'Patient is required'),
  chiefComplaint: z.string().min(10, 'Chief complaint must be at least 10 characters'),
  diagnoses: z
    .array(z.union([z.string().min(1), diagnosisItem]))
    .min(1, 'Select at least one diagnosis'),
  prescriptions: z.array(z.string().min(1)).default([]),
  labs: z.array(z.string().min(1)).default([]),
});

export type ConsultationFormData = z.infer<typeof consultationSchema>;
