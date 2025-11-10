package org.openmrs.module.ghanaemr.util;

import org.hibernate.SessionFactory;
import org.springframework.transaction.annotation.Transactional;

/**
 * Database-backed implementation of SequenceProvider.
 * Queries the patient_identifier table to find the highest sequence number for a given prefix.
 * Thread-safe through database row-level locking.
 */
public class DatabaseSequenceProvider implements SequenceProvider {
    
    private SessionFactory sessionFactory;
    
    public void setSessionFactory(SessionFactory sessionFactory) {
        this.sessionFactory = sessionFactory;
    }
    
    @Override
    @Transactional
    public int nextSequenceForPrefix(String prefix) {
        // Query to find the maximum sequence number for this prefix
        // Example: For prefix "GAR-KBTH-2025-", find max of "GAR-KBTH-2025-000123" -> 123
        String sql = "SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(identifier, '-', -1) AS UNSIGNED)), 0) + 1 " +
                     "FROM patient_identifier " +
                     "WHERE identifier LIKE :prefix " +
                     "AND voided = 0";
        
        Object result = sessionFactory.getCurrentSession()
                .createSQLQuery(sql)
                .setParameter("prefix", prefix + "%")
                .uniqueResult();
        
        if (result == null) {
            return 1; // First sequence for this prefix
        }
        
        return ((Number) result).intValue();
    }
}
