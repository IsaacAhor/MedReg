package org.openmrs.module.ghanaemr.validation;

public final class NHISValidator {
    private NHISValidator() {}

    public static boolean isValid(String nhis) {
        if (nhis == null || nhis.trim().isEmpty()) return true; // optional
        return nhis.matches("^\\d{10}$");
    }
}

