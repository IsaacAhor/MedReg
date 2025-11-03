export type Medicine = { code: string; name: string; strength?: string; form?: string };

/**
 * Ghana Essential Medicines List - OPD Subset (50 drugs)
 * Based on Ghana Standard Treatment Guidelines (STG)
 * Organized by therapeutic category for common OPD conditions
 */
export const ESSENTIAL_MEDICINES: Medicine[] = [
  // === ANTIMALARIALS (Ghana #1 diagnosis) ===
  { code: 'AL_2060', name: 'Artemether/Lumefantrine', strength: '20/120 mg', form: 'Tablet' },
  { code: 'ARTES_60', name: 'Artesunate', strength: '60 mg', form: 'Injection' },
  { code: 'QUIN_300', name: 'Quinine', strength: '300 mg', form: 'Tablet' },

  // === ANTIBIOTICS (Respiratory infections, UTI, skin) ===
  { code: 'AMOX250', name: 'Amoxicillin', strength: '250 mg', form: 'Capsule' },
  { code: 'AMOX500', name: 'Amoxicillin', strength: '500 mg', form: 'Capsule' },
  { code: 'AMOXCLAV625', name: 'Amoxicillin/Clavulanate', strength: '625 mg', form: 'Tablet' },
  { code: 'AZITH500', name: 'Azithromycin', strength: '500 mg', form: 'Tablet' },
  { code: 'CIPRO500', name: 'Ciprofloxacin', strength: '500 mg', form: 'Tablet' },
  { code: 'CLOX500', name: 'Cloxacillin', strength: '500 mg', form: 'Capsule' },
  { code: 'COTRI480', name: 'Co-trimoxazole', strength: '480 mg', form: 'Tablet' },
  { code: 'COTRI960', name: 'Co-trimoxazole', strength: '960 mg', form: 'Tablet' },
  { code: 'DOXY100', name: 'Doxycycline', strength: '100 mg', form: 'Capsule' },
  { code: 'ERYT500', name: 'Erythromycin', strength: '500 mg', form: 'Tablet' },
  { code: 'METRO400', name: 'Metronidazole', strength: '400 mg', form: 'Tablet' },
  { code: 'METRO500', name: 'Metronidazole', strength: '500 mg', form: 'Tablet' },
  { code: 'BENZPEN', name: 'Benzylpenicillin', strength: '1 MU', form: 'Injection' },

  // === ANALGESICS & NSAIDs (Pain, fever) ===
  { code: 'PARA500', name: 'Paracetamol', strength: '500 mg', form: 'Tablet' },
  { code: 'PARASYR', name: 'Paracetamol', strength: '120 mg/5mL', form: 'Syrup' },
  { code: 'IBU200', name: 'Ibuprofen', strength: '200 mg', form: 'Tablet' },
  { code: 'IBU400', name: 'Ibuprofen', strength: '400 mg', form: 'Tablet' },
  { code: 'DICLO50', name: 'Diclofenac', strength: '50 mg', form: 'Tablet' },
  { code: 'PETH50', name: 'Pethidine', strength: '50 mg', form: 'Injection' },

  // === ANTIHYPERTENSIVES (Hypertension - common in Ghana) ===
  { code: 'AMLOD5', name: 'Amlodipine', strength: '5 mg', form: 'Tablet' },
  { code: 'AMLOD10', name: 'Amlodipine', strength: '10 mg', form: 'Tablet' },
  { code: 'ENAL5', name: 'Enalapril', strength: '5 mg', form: 'Tablet' },
  { code: 'ENAL10', name: 'Enalapril', strength: '10 mg', form: 'Tablet' },
  { code: 'HCTZ25', name: 'Hydrochlorothiazide', strength: '25 mg', form: 'Tablet' },
  { code: 'ATEN50', name: 'Atenolol', strength: '50 mg', form: 'Tablet' },
  { code: 'NIFED20', name: 'Nifedipine', strength: '20 mg', form: 'Tablet SR' },

  // === ANTIDIABETICS (Diabetes - rising prevalence) ===
  { code: 'MET500', name: 'Metformin', strength: '500 mg', form: 'Tablet' },
  { code: 'MET850', name: 'Metformin', strength: '850 mg', form: 'Tablet' },
  { code: 'GLIB5', name: 'Glibenclamide', strength: '5 mg', form: 'Tablet' },
  { code: 'INSULIN_REG', name: 'Insulin Regular', strength: '100 IU/mL', form: 'Injection' },

  // === GASTROINTESTINAL (Diarrhea, dyspepsia, PUD) ===
  { code: 'ORS', name: 'Oral Rehydration Salts', form: 'Sachet' },
  { code: 'ZINC20', name: 'Zinc Sulfate', strength: '20 mg', form: 'Tablet' },
  { code: 'OMEP20', name: 'Omeprazole', strength: '20 mg', form: 'Capsule' },
  { code: 'RANI150', name: 'Ranitidine', strength: '150 mg', form: 'Tablet' },
  { code: 'ALUM', name: 'Aluminum Hydroxide', strength: '500 mg', form: 'Tablet' },
  { code: 'LOPER2', name: 'Loperamide', strength: '2 mg', form: 'Capsule' },

  // === RESPIRATORY (Asthma, COPD, cough) ===
  { code: 'SALBU4', name: 'Salbutamol', strength: '4 mg', form: 'Tablet' },
  { code: 'SALBU_INH', name: 'Salbutamol', strength: '100 mcg', form: 'Inhaler' },
  { code: 'PRED5', name: 'Prednisolone', strength: '5 mg', form: 'Tablet' },
  { code: 'DEXAM_INJ', name: 'Dexamethasone', strength: '4 mg', form: 'Injection' },

  // === ANTIHISTAMINES & ANTI-ALLERGICS ===
  { code: 'CHLOR4', name: 'Chlorpheniramine', strength: '4 mg', form: 'Tablet' },
  { code: 'CETIR10', name: 'Cetirizine', strength: '10 mg', form: 'Tablet' },
  { code: 'HYDRO25', name: 'Hydrocortisone', strength: '1%', form: 'Cream' },

  // === VITAMINS & SUPPLEMENTS (Anemia common) ===
  { code: 'FOLIC5', name: 'Folic Acid', strength: '5 mg', form: 'Tablet' },
  { code: 'FERROUS200', name: 'Ferrous Sulfate', strength: '200 mg', form: 'Tablet' },
  { code: 'VITB_COMP', name: 'Vitamin B Complex', form: 'Tablet' },
];

