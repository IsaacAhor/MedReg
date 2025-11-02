package org.openmrs.module.ghanaemr.web;

import org.openmrs.api.APIAuthenticationException;
import org.openmrs.api.context.Context;
import org.openmrs.module.ghanaemr.api.nhie.NHIECoverageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Minimal NHIS Coverage endpoint backed by NHIE mock/sandbox via NHIEHttpClient.
 * Note: Caching (24h TTL) will be added in a follow-up per tracker.
 */
@RestController
@RequestMapping("/ws/rest/v1/ghana/coverage")
public class NHIECoverageController {

    @GetMapping
    public ResponseEntity<?> getCoverage(HttpServletRequest request, @RequestParam("nhis") String nhis,
                                         @RequestParam(value = "refresh", required = false, defaultValue = "false") boolean refresh) {
        ensureAuthenticated(request);
        try {
            ensurePrivilege("ghanaemr.nhie.view");
            NHIECoverageService svc = getCoverageService();
            NHIECoverageService.CoverageResult result = svc.checkCoverage(nhis, refresh);
            Map<String, Object> body = new HashMap<>();
            body.put("status", result.status);
            if (result.rawJson != null) body.put("raw", result.rawJson);
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(error("NHIE_COVERAGE_FAILED", e.getMessage()));
        }
    }

    private void ensureAuthenticated(HttpServletRequest req) throws APIAuthenticationException {
        if (Context.isAuthenticated()) return;
        String auth = req.getHeader("Authorization");
        if (auth != null && auth.toLowerCase(Locale.ROOT).startsWith("basic ")) {
            try {
                String base64Credentials = auth.substring(6).trim();
                byte[] credDecoded = java.util.Base64.getDecoder().decode(base64Credentials);
                String credentials = new String(credDecoded, java.nio.charset.StandardCharsets.UTF_8);
                final String[] values = credentials.split(":", 2);
                if (values.length == 2) {
                    Context.authenticate(values[0], values[1]);
                }
            } catch (Exception ignored) { }
        }
        if (!Context.isAuthenticated()) {
            throw new APIAuthenticationException("Not authenticated");
        }
    }

    private static Map<String, Object> error(String code, String message) {
        Map<String, Object> m = new HashMap<>();
        m.put("code", code);
        m.put("message", message);
        return m;
    }

    private NHIECoverageService getCoverageService() {
        try {
            return Context.getRegisteredComponents(NHIECoverageService.class).stream().findFirst()
                    .orElseThrow(IllegalStateException::new);
        } catch (Exception e) {
            return Context.getService(NHIECoverageService.class);
        }
    }

    private void ensurePrivilege(String privilege) throws APIAuthenticationException {
        if (!Context.hasPrivilege(privilege)) {
            throw new APIAuthenticationException("Required privilege: " + privilege);
        }
    }
}
