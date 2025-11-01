package org.openmrs.module.ghanaemr.util;

import java.time.LocalDate;

public class FolderNumberGenerator {
    private final SequenceProvider sequenceProvider;

    public FolderNumberGenerator(SequenceProvider sequenceProvider) {
        this.sequenceProvider = sequenceProvider;
    }

    public String generate(String facilityCode, String regionCode) {
        int year = LocalDate.now().getYear();
        String prefix = regionCode + "-" + facilityCode + "-" + year;
        int seq = sequenceProvider.nextSequenceForPrefix(prefix);
        return String.format("%s-%06d", prefix, seq);
    }
}

