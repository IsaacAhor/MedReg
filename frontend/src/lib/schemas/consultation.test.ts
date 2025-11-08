import { describe, it, expect } from 'vitest';
import { consultationSchema } from './consultation';

describe('consultationSchema', () => {
  const base = {
    patientUuid: '12345678-1234-1234-1234-1234567890ab',
    chiefComplaint: 'Fever and headache for three days',
    diagnoses: ['B54'],
    prescriptions: [],
    labs: [],
  };

  it('accepts valid payload', () => {
    const parsed = consultationSchema.parse(base);
    expect(parsed.patientUuid).toBe(base.patientUuid);
  });

  it('requires chiefComplaint of at least 10 characters', () => {
    expect(() => consultationSchema.parse({ ...base, chiefComplaint: 'TooShort' })).toThrowError();
    expect(() => consultationSchema.parse({ ...base, chiefComplaint: 'Adequately long' })).not.toThrowError();
  });

  it('requires at least one diagnosis', () => {
    expect(() => consultationSchema.parse({ ...base, diagnoses: [] })).toThrowError();
    expect(() => consultationSchema.parse({ ...base, diagnoses: ['J06.9'] })).not.toThrowError();
  });

  it('accepts diagnosis objects with code and display', () => {
    const payload = { ...base, diagnoses: [{ code: 'I10', display: 'Essential hypertension' }] };
    expect(() => consultationSchema.parse(payload)).not.toThrowError();
  });

  it('allows optional labs and prescriptions arrays', () => {
    expect(() => consultationSchema.parse({ ...base, labs: ['RBS'], prescriptions: ['Paracetamol 500 mg Tablet'] })).not.toThrowError();
  });
});

