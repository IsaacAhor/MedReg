# Identifiers (Ghana)

Ghana Card
- Format: `GHA-XXXXXXXXX-X` (uppercase), mandatory for adults, primary identifier.
- Validation: Regex `^GHA-\d{9}-\d$` + Luhn checksum on the 10 digits.

NHIS Number
- Format: 10 digits (no hyphens, no letters). Example: `0123456789`.
- Registration: Optional (required only for NHIS eligibility/claims).
- Note: This supersedes earlier region-district formats; normalize any hyphenated input by removing separators.

Folder Number
- Format: `[REGION]-[FACILITY]-[YEAR]-[SEQUENCE]` (e.g., `GA-KBTH-2025-000123`).
- Uniqueness: Unique per facility-year prefix; sequence is a zero-padded 6-digit counter.

Identifier Types (OpenMRS)
- `Ghana Card` (preferred)
- `NHIS Number` (person attribute)
- `Folder Number`

MVP Storage Decision
- NHIS is stored as a Person Attribute (searchable) in MVP to simplify identifier management; value is 10 digits. We can migrate to a patient identifier later if search scenarios require it.
