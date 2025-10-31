# NHIE Config Reference

- Purpose: Centralize environment-driven settings for NHIE adapter.

Keys
- ghana.nhie.baseUrl
- ghana.nhie.oauth.tokenUrl, ghana.nhie.oauth.clientId, ghana.nhie.oauth.clientSecret, ghana.nhie.oauth.scopes
- ghana.nhie.tls.enabled, ghana.nhie.tls.keystore.path, ghana.nhie.tls.keystore.password
- ghana.nhie.timeout.connectMs, ghana.nhie.timeout.readMs
- ghana.nhie.retry.maxAttempts, ghana.nhie.retry.initialDelayMs, ghana.nhie.retry.maxDelayMs, ghana.nhie.retry.multiplier
- ghana.fhir.identifier.ghanaCard (http://moh.gov.gh/fhir/identifier/ghana-card)
- ghana.fhir.identifier.nhis (http://moh.gov.gh/fhir/identifier/nhis)
- ghana.fhir.identifier.folder (http://moh.gov.gh/fhir/identifier/folder-number)

Environments
- dev, staging, pilot: override via env vars or global properties.
