package org.openmrs.module.ghanaemr.api.queue.db.hibernate;

import org.hibernate.SessionFactory;
import org.openmrs.Location;
import org.openmrs.Patient;
import org.openmrs.module.ghanaemr.api.queue.db.PatientQueueDAO;
import org.openmrs.module.ghanaemr.api.queue.model.PatientQueue;
import org.openmrs.module.ghanaemr.api.queue.model.QueueStatus;
import org.springframework.transaction.annotation.Transactional;

import java.util.Calendar;
import java.util.Date;
import java.util.List;

public class HibernatePatientQueueDAO implements PatientQueueDAO {

    private SessionFactory sessionFactory;

    public void setSessionFactory(SessionFactory sessionFactory) {
        this.sessionFactory = sessionFactory;
    }

    @Override
    @Transactional
    public PatientQueue save(PatientQueue queue) {
        sessionFactory.getCurrentSession().saveOrUpdate(queue);
        return queue;
    }

    @Override
    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<PatientQueue> getQueueByLocationAndStatus(Location location, QueueStatus status) {
        return (List<PatientQueue>) sessionFactory.getCurrentSession()
                .createQuery("from PatientQueue q where q.voided = false and q.locationTo = :loc and q.status = :status order by q.priority asc, q.dateCreated asc")
                .setParameter("loc", location)
                .setParameter("status", status)
                .list();
    }

    @Override
    @Transactional(readOnly = true)
    public int getNextQueueNumber(Location toLocation, Date day) {
        Calendar calStart = Calendar.getInstance();
        calStart.setTime(day);
        calStart.set(Calendar.HOUR_OF_DAY, 0);
        calStart.set(Calendar.MINUTE, 0);
        calStart.set(Calendar.SECOND, 0);
        calStart.set(Calendar.MILLISECOND, 0);

        Calendar calEnd = Calendar.getInstance();
        calEnd.setTime(calStart.getTime());
        calEnd.add(Calendar.DATE, 1);

        Long count = (Long) sessionFactory.getCurrentSession()
                .createQuery("select count(q.queueId) from PatientQueue q where q.locationTo = :loc and q.dateCreated >= :start and q.dateCreated < :end")
                .setParameter("loc", toLocation)
                .setParameter("start", calStart.getTime())
                .setParameter("end", calEnd.getTime())
                .uniqueResult();
        if (count == null) {
            return 1;
        }
        return count.intValue() + 1;
    }

    @Override
    @Transactional(readOnly = true)
    public PatientQueue getActiveQueueEntry(Patient patient, Location location) {
        List list = sessionFactory.getCurrentSession()
                .createQuery("from PatientQueue q where q.voided = false and q.patient = :p and q.locationTo = :loc and (q.status = :pnd or q.status = :prog) order by q.dateCreated asc")
                .setParameter("p", patient)
                .setParameter("loc", location)
                .setParameter("pnd", QueueStatus.PENDING)
                .setParameter("prog", QueueStatus.IN_PROGRESS)
                .setMaxResults(1)
                .list();
        return list.isEmpty() ? null : (PatientQueue) list.get(0);
    }

    @Override
    @Transactional(readOnly = true)
    public PatientQueue getByUuid(String uuid) {
        List list = sessionFactory.getCurrentSession()
                .createQuery("from PatientQueue q where q.uuid = :u")
                .setParameter("u", uuid)
                .setMaxResults(1)
                .list();
        return list.isEmpty() ? null : (PatientQueue) list.get(0);
    }
}
