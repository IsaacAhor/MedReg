package org.openmrs.module.ghanaemrfoldernumber;

import org.openmrs.api.context.Context;
import org.openmrs.module.ghanaemrfoldernumber.db.FolderNumberDao;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

public class FolderNumberServiceImpl implements FolderNumberService {

    private FolderNumberDao folderNumberDao;

    public void setFolderNumberDao(FolderNumberDao folderNumberDao) {
        this.folderNumberDao = folderNumberDao;
    }

    @Override
    @Transactional
    public String generateNext(String regionCode, String facilityCode) {
        String region = (regionCode == null || regionCode.trim().isEmpty()) ? "GA" : regionCode.trim().toUpperCase();
        String facility = (facilityCode == null || facilityCode.trim().isEmpty()) ? "KBTH" : facilityCode.trim().toUpperCase();
        int year = LocalDate.now().getYear();
        String prefix = region + "-" + facility + "-" + year;
        int seq = folderNumberDao.nextSequence(prefix);
        return String.format("%s-%06d", prefix, seq);
    }
}

