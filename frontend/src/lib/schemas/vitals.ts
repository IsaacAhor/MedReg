import { z } from 'zod';

export const vitalsSchema = z
  .object({
    patientUuid: z.string().uuid('Invalid patient ID'),

    bpSystolic: z
      .number({ invalid_type_error: 'Systolic BP must be a number' })
      .min(60, 'Systolic BP must be at least 60 mmHg')
      .max(250, 'Systolic BP cannot exceed 250 mmHg'),

    bpDiastolic: z
      .number({ invalid_type_error: 'Diastolic BP must be a number' })
      .min(40, 'Diastolic BP must be at least 40 mmHg')
      .max(150, 'Diastolic BP cannot exceed 150 mmHg'),

    temperature: z
      .number({ invalid_type_error: 'Temperature must be a number' })
      .min(30, 'Temperature must be at least 30°C')
      .max(45, 'Temperature cannot exceed 45°C'),

    weight: z
      .number({ invalid_type_error: 'Weight must be a number' })
      .min(1, 'Weight must be at least 1 kg')
      .max(300, 'Weight cannot exceed 300 kg'),

    height: z
      .number({ invalid_type_error: 'Height must be a number' })
      .min(50, 'Height must be at least 50 cm')
      .max(250, 'Height cannot exceed 250 cm'),
  })
  .refine((data) => data.bpSystolic > data.bpDiastolic, {
    message: 'Systolic BP must be greater than diastolic BP',
    path: ['bpSystolic'],
  });

export type VitalsFormData = z.infer<typeof vitalsSchema>;

export function calculateBMI(weight: number, height: number): number {
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
}

export function getBMICategory(
  bmi: number
): {
  category: string;
  color: string;
} {
  if (bmi < 18.5) return { category: 'Underweight', color: 'text-yellow-600' };
  if (bmi < 25) return { category: 'Normal', color: 'text-green-600' };
  if (bmi < 30) return { category: 'Overweight', color: 'text-orange-600' };
  return { category: 'Obese', color: 'text-red-600' };
}

