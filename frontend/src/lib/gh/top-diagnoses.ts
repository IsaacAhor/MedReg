export type DiagnosisCode = { code: string; display: string };

// Top 20 Ghana OPD Diagnoses (ICD-10)
export const TOP_DIAGNOSES: DiagnosisCode[] = [
  { code: 'B54', display: 'Malaria, unspecified' },
  { code: 'J06.9', display: 'Upper respiratory tract infection, unspecified' },
  { code: 'I10', display: 'Essential (primary) hypertension' },
  { code: 'E11.9', display: 'Type 2 diabetes mellitus without complications' },
  { code: 'J18.9', display: 'Pneumonia, unspecified organism' },
  { code: 'N39.0', display: 'Urinary tract infection, site not specified' },
  { code: 'K29.0', display: 'Acute gastritis' },
  { code: 'L08.9', display: 'Local infection of the skin and subcut tissue, unspecified' },
  { code: 'M79.9', display: 'Soft tissue disorder, unspecified' },
  { code: 'A09', display: 'Diarrhoea and gastroenteritis of presumed infectious origin' },
  { code: 'H10.9', display: 'Conjunctivitis, unspecified' },
  { code: 'K27.9', display: 'Peptic ulcer, unspecified as acute or chronic, without haemorrhage or perforation' },
  { code: 'H66.9', display: 'Otitis media, unspecified' },
  { code: 'K02.9', display: 'Dental caries, unspecified' },
  { code: 'M19.9', display: 'Osteoarthritis, unspecified site' },
  { code: 'J45.9', display: 'Asthma, unspecified' },
  { code: 'D64.9', display: 'Anaemia, unspecified' },
  { code: 'A01.0', display: 'Typhoid fever' },
  { code: 'V89.2', display: 'Person injured in unspecified motor-vehicle accident' },
  { code: 'A09', display: 'Gastroenteritis and colitis of unspecified origin' },
];

