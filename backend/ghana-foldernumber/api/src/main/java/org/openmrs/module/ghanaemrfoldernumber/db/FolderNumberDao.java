package org.openmrs.module.ghanaemrfoldernumber.db;

public interface FolderNumberDao {

    /**
     * Atomically increments and returns the last_seq for the given prefix.
     * If no row exists, creates it with last_seq=1 and returns 1.
     *
     * @param prefix sequence prefix (e.g., GA-KBTH-2025)
     * @return the new sequence value after increment
     */
    int nextSequence(String prefix);
}

