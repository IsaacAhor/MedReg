package org.openmrs.module.ghanaemr.api.queue.impl;

import org.openmrs.Location;
import org.openmrs.Patient;
import org.openmrs.Visit;
import org.openmrs.api.context.Context;
import org.openmrs.api.impl.BaseOpenmrsService;
import org.openmrs.module.ghanaemr.api.queue.PatientQueueService;
import org.openmrs.module.ghanaemr.api.queue.db.PatientQueueDAO;
import org.openmrs.module.ghanaemr.api.queue.model.PatientQueue;
import org.openmrs.module.ghanaemr.api.queue.model.QueueStatus;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.UUID;

@Transactional
public class PatientQueueServiceImpl extends BaseOpenmrsService implements PatientQueueService {

    private PatientQueueDAO dao;

    public void setDao(PatientQueueDAO dao) {
        this.dao = dao;
    }

    @Override
    public PatientQueue addToQueue(Patient patient, Visit visit, Location toLocation, Integer priority) {
        PatientQueue queue = new PatientQueue();
        queue.setUuid(UUID.randomUUID().toString());
        queue.setPatient(patient);
        queue.setVisit(visit);
        queue.setLocationTo(toLocation);
        queue.setPriority(priority != null ? priority : 5);
        queue.setStatus(QueueStatus.PENDING);
        queue.setDateCreated(new Date());
        queue.setCreator(Context.getAuthenticatedUser());

        String prefix = generateQueuePrefix(toLocation);
        int nextNumber = dao.getNextQueueNumber(toLocation, new Date());
        queue.setQueueNumber(String.format("%s%03d", prefix, nextNumber));

        return dao.save(queue);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PatientQueue> getQueueByLocationAndStatus(Location location, QueueStatus status) {
        return dao.getQueueByLocationAndStatus(location, status);
    }

    @Override
    public PatientQueue updateQueueStatus(PatientQueue queueEntry, QueueStatus newStatus) {
        queueEntry.setStatus(newStatus);
        queueEntry.setDateChanged(new Date());
        queueEntry.setChangedBy(Context.getAuthenticatedUser());
        return dao.save(queueEntry);
    }

    @Override
    public PatientQueue moveToNextStation(PatientQueue currentQueue, Location nextLocation) {
        completeQueueEntry(currentQueue);
        return addToQueue(currentQueue.getPatient(), currentQueue.getVisit(), nextLocation, currentQueue.getPriority());
    }

    @Override
    @Transactional(readOnly = true)
    public PatientQueue getActiveQueueEntry(Patient patient, Location location) {
        return dao.getActiveQueueEntry(patient, location);
    }

    @Override
    public void completeQueueEntry(PatientQueue queueEntry) {
        queueEntry.setStatus(QueueStatus.COMPLETED);
        queueEntry.setDateChanged(new Date());
        queueEntry.setChangedBy(Context.getAuthenticatedUser());
        dao.save(queueEntry);
    }

    private String generateQueuePrefix(Location location) {
        String locationName = location != null && location.getName() != null ? location.getName().toLowerCase() : "";
        if (locationName.contains("triage")) return "TR";
        if (locationName.contains("consultation") || locationName.contains("opd")) return "CN";
        if (locationName.contains("pharmacy")) return "PH";
        return "QU";
    }

    @Override
    @Transactional(readOnly = true)
    public PatientQueue getByUuid(String uuid) {
        return dao.getByUuid(uuid);
    }
}
