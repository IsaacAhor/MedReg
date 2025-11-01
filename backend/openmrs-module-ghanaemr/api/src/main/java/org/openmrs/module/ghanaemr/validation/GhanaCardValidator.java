package org.openmrs.module.ghanaemr.validation;

public final class GhanaCardValidator {
    private GhanaCardValidator() {}

    private static final String REGEX = "^GHA-\\d{9}-\\d$";

    public static boolean isValid(String ghanaCard) {
        if (ghanaCard == null) return false;
        String normalized = normalize(ghanaCard);
        if (!normalized.matches(REGEX)) return false;
        return validateChecksum(normalized);
    }

    public static String normalize(String input) {
        if (input == null) return null;
        String s = input.trim().toUpperCase();
        // Auto-insert hyphens if 13-length GHA prefix without hyphens
        String cleaned = s.replaceAll("[^A-Z0-9]", "");
        if (cleaned.length() == 13 && cleaned.startsWith("GHA")) {
            return String.format("%s-%s-%s", cleaned.substring(0,3), cleaned.substring(3,12), cleaned.substring(12));
        }
        // Handle 10 digits case (assume missing GHA prefix)
        if (cleaned.matches("\\d{10}")) {
            return String.format("GHA-%s-%s", cleaned.substring(0,9), cleaned.substring(9));
        }
        return s;
    }

    public static boolean validateChecksum(String ghanaCard) {
        String digits = ghanaCard.replaceAll("[^0-9]", "");
        if (digits.length() != 10) return false;
        int sum = 0;
        for (int i = 0; i < 9; i++) {
            int digit = Character.getNumericValue(digits.charAt(i));
            if (i % 2 == 0) digit *= 2;
            if (digit > 9) digit -= 9;
            sum += digit;
        }
        int checkDigit = (10 - (sum % 10)) % 10;
        return checkDigit == Character.getNumericValue(digits.charAt(9));
    }
}

