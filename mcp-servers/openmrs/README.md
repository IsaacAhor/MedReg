# OpenMRS MCP Server

MCP server for OpenMRS REST API operations with Ghana-specific validation.

## Features

- **create_patient**: Create new patient with Ghana Card validation (Luhn checksum), NHIS validation, folder number generation
- **search_patient**: Search patients by Ghana Card, NHIS, folder number, or name
- **PII Masking**: Automatic PII masking in all responses
- **NHIE Enforcement**: Validates that external health system calls route through NHIE middleware

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your OpenMRS credentials
```

3. Build:
```bash
npm run build
```

4. Configure Claude Desktop (see main README.md)

## Development

```bash
# Watch mode (auto-rebuild on changes)
npm run watch

# Run tests
npm test

# Lint
npm run lint
```

## Tools (OpenMRS)

- Patient: `create_patient`, `search_patient`, `get_patient`, `update_patient`
- Session/Config: `verify_session`, `update_env`
- Discovery: `list_encounter_types`, `list_visit_types`, `list_locations`, `list_providers`, `list_identifier_types`, `list_person_attribute_types`, `list_encounter_roles`, `list_concepts`
- Visits: `find_active_visit`, `create_visit`, `close_visit`
- Encounters: `create_encounter`
- Opinionated OPD: `record_triage_vitals`, `record_consultation_notes`

### Example: create_patient

Input:
```json
{
  "ghanaCard": "GHA-123456789-0",
  "nhisNumber": "0123456789",
  "givenName": "Kwame",
  "familyName": "Mensah",
  "gender": "M",
  "dateOfBirth": "1985-03-15",
  "phone": "+233244123456",
  "address": "123 Main St",
  "city": "Accra",
  "region": "Greater Accra"
}
```

Output (PII-masked):
```json
{
  "success": true,
  "patient": {
    "uuid": "abc-123",
    "ghanaCard": "GHA-1234****-*",
    "folderNumber": "GA-KBTH-2025-000123",
    "gender": "M"
  }
}
```

### Example: record_triage_vitals

Input:
```json
{
  "patientUuid": "<uuid>",
  "vitals": { "temp": 36.9, "weight": 70, "height": 175, "pulse": 72, "systolic": 120, "diastolic": 80 }
}
```

Behavior:
- Ensures active visit (creates if missing) using `OPENMRS_OPD_VISIT_TYPE_UUID` and `OPENMRS_LOCATION_UUID`.
- Creates an encounter with configured concept UUIDs for vitals.

## Architecture

```
OpenMRS MCP Server
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── tools/
│   │   ├── create-patient.ts # Patient creation with validation
│   │   └── search-patient.ts # Patient search
│   ├── validators/
│   │   ├── ghana-card.ts     # Ghana Card format + Luhn checksum
│   │   ├── nhis-number.ts    # NHIS number validation
│   │   └── nhie-enforcer.ts  # NHIE routing enforcement
│   └── utils/
│       └── openmrs-client.ts # OpenMRS REST API client
└── package.json
```

## Ghana Domain Rules

### Ghana Card Format
- Format: `GHA-XXXXXXXXX-X`
- Validation: Luhn checksum algorithm
- Example: `GHA-123456789-0`

### NHIS Number
- Format: 10 digits (no hyphens, no letters)
- Example: `0123456789`

### Folder Number
- Format: `{REGION}-{FACILITY}-{YEAR}-{SEQUENCE}`
- Example: `GA-KBTH-2025-000123`
- Auto-generated, sequential

## Error Handling

All errors return structured JSON:
```json
{
  "success": false,
  "error": "Ghana Card validation failed: Invalid checksum",
  "code": "VALIDATION_ERROR"
}
```

## Security

- **PII Masking**: All Ghana Cards, NHIS numbers, phone numbers masked in responses
- **NHIE Enforcement**: Blocks direct calls to NHIA/MPI (must route through NHIE)
- **Session Management**: Automatic OpenMRS session handling
- **Error Sanitization**: Error messages masked for PII
