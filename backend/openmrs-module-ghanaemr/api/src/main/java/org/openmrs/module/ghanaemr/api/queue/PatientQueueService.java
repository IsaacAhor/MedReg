package org.openmrs.module.ghanaemr.api.queue;

import org.openmrs.Location;
import org.openmrs.Patient;
import org.openmrs.Visit;
import org.openmrs.annotation.Authorized;
import org.openmrs.api.OpenmrsService;
import org.openmrs.module.ghanaemr.api.queue.model.PatientQueue;
import org.openmrs.module.ghanaemr.api.queue.model.QueueStatus;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface PatientQueueService extends OpenmrsService {

    @Authorized({"Register Patient Queue"})
    @Transactional
    PatientQueue addToQueue(Patient patient, Visit visit, Location toLocation, Integer priority);

    @Authorized({"View Patient Queue"})
    @Transactional(readOnly = true)
    List<PatientQueue> getQueueByLocationAndStatus(Location location, QueueStatus status);

    @Authorized({"Update Patient Queue"})
    @Transactional
    PatientQueue updateQueueStatus(PatientQueue queueEntry, QueueStatus newStatus);

    @Authorized({"Move Patient Queue"})
    @Transactional
    PatientQueue moveToNextStation(PatientQueue currentQueue, Location nextLocation);

    @Transactional(readOnly = true)
    PatientQueue getActiveQueueEntry(Patient patient, Location location);

    @Authorized({"Complete Patient Queue"})
    @Transactional
    void completeQueueEntry(PatientQueue queueEntry);
}

