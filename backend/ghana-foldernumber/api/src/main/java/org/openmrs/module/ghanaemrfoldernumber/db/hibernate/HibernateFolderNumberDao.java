package org.openmrs.module.ghanaemrfoldernumber.db.hibernate;

import org.hibernate.Query;
import org.hibernate.SessionFactory;
import org.openmrs.module.ghanaemrfoldernumber.db.FolderNumberDao;
import org.springframework.transaction.annotation.Transactional;

public class HibernateFolderNumberDao implements FolderNumberDao {

    private SessionFactory sessionFactory;

    public void setSessionFactory(SessionFactory sessionFactory) {
        this.sessionFactory = sessionFactory;
    }

    @Override
    @Transactional
    public int nextSequence(String prefix) {
        // Try optimistic update first
        Query update = sessionFactory.getCurrentSession().createSQLQuery(
                "UPDATE gh_folder_number_sequence SET last_seq = last_seq + 1 WHERE prefix = :prefix");
        update.setString("prefix", prefix);
        int updated = update.executeUpdate();
        if (updated == 0) {
            // Insert initial row with last_seq = 1
            Query insert = sessionFactory.getCurrentSession().createSQLQuery(
                    "INSERT IGNORE INTO gh_folder_number_sequence(prefix, last_seq) VALUES (:prefix, 0)");
            insert.setString("prefix", prefix);
            insert.executeUpdate();

            // Now increment
            Query update2 = sessionFactory.getCurrentSession().createSQLQuery(
                    "UPDATE gh_folder_number_sequence SET last_seq = last_seq + 1 WHERE prefix = :prefix");
            update2.setString("prefix", prefix);
            update2.executeUpdate();
        }

        Query select = sessionFactory.getCurrentSession().createSQLQuery(
                "SELECT last_seq FROM gh_folder_number_sequence WHERE prefix = :prefix");
        select.setString("prefix", prefix);
        Number val = (Number) select.uniqueResult();
        return val == null ? 1 : val.intValue();
    }
}

