# Validators

Ghana Card
- Format: `GHA-XXXXXXXXX-X` (3 letters + hyphen + 9 digits + hyphen + 1 check digit).
- Regex: `^GHA-\d{9}-\d$` (case-insensitive; normalize to uppercase).
- Checksum: Luhn on the first 9 digits, last digit is the check digit.
- Normalization: trim, uppercase, auto-insert hyphens if 13-char `GHA` prefix provided; accept 10 digits by auto-prefixing `GHA-`.
- Examples: valid `GHA-123456789-7`, `GHA-987654321-7`; invalid `GHA-123456789-0` (checksum).
- Errors: clear messages for format vs checksum failures; reject on checksum fail.

Server vs Frontend Enforcement
- Frontend: enforces both regex and Luhn (real‑time form validation).
- Server (OpenMRS): enforces regex only for now (stock Luhn validator is incompatible with `GHA-` prefix + hyphens).
- Future: add a custom `GhanaCardIdentifierValidator` to server that strips non‑digits and applies Luhn to the first 9 digits.

NHIS Number
- Format: 10 digits (no hyphens, no letters). Regex: `^\d{10}$`.
- Optional at registration; required for eligibility check and claims.
- Normalization: strip spaces/hyphens, store digits only.
- Examples: valid `0123456789`, invalid `012-345-6789`, `NHIS123456`, `12345`.

Folder Number
- Format: `[REGION]-[FACILITY]-[YEAR]-[SEQUENCE]` (e.g., `GA-KBTH-2025-000123`).
- Generation: prefix = `REGION-FACILITY-YEAR`; sequence is 6-digit zero-padded.
- Concurrency: use DB row lock or sequence table (`folder_number_sequence`) to prevent duplicates.
