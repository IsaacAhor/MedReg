export type LabTest = { code: string; name: string };

export const COMMON_LAB_TESTS: LabTest[] = [
  { code: 'MPS', name: 'Malaria Parasite Test (RDT)' },
  { code: 'FBC', name: 'Full Blood Count' },
  { code: 'RBS', name: 'Random Blood Sugar' },
  { code: 'FBS', name: 'Fasting Blood Sugar' },
  { code: 'URINE', name: 'Urinalysis (Dipstick)' },
  { code: 'WIDAL', name: 'Widal Test' },
  { code: 'XR-CH', name: 'Chest X-Ray' },
];

