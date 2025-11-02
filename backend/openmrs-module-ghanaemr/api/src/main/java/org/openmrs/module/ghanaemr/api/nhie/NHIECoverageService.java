package org.openmrs.module.ghanaemr.api.nhie;

/**
 * Service for NHIS Coverage checks with 24h caching.
 */
public interface NHIECoverageService {

    /**
     * Check NHIS coverage status using cache unless refresh=true.
     * @param nhis 10-digit NHIS number
     * @param refresh bypass cache if true
     * @return CoverageResult with status and optional raw JSON
     */
    CoverageResult checkCoverage(String nhis, boolean refresh);

    class CoverageResult {
        public final String status; // active | not-found | error
        public final String rawJson; // optional raw body

        public CoverageResult(String status, String rawJson) {
            this.status = status;
            this.rawJson = rawJson;
        }
    }
}

