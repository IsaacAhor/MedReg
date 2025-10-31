# Queue & Retry Policy

Error Taxonomy
- 400/404: validation/not found — do not retry.
- 401/403: auth — refresh token once, then alert.
- 409: conflict — fetch server version, reconcile.
- 422: business rule — move to DLQ; operator fix + replay.
- 429/5xx/timeouts: transient — retry with backoff.

Backoff
- 5s -> 30s -> 2m -> 10m -> 1h (cap); maxAttempts=8.

Operator Actions
- View queue, requeue DLQ, download error, annotate resolution.
