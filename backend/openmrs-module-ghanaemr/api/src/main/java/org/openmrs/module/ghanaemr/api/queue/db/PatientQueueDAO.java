package org.openmrs.module.ghanaemr.api.queue.db;

import org.openmrs.Location;
import org.openmrs.Patient;
import org.openmrs.module.ghanaemr.api.queue.model.PatientQueue;
import org.openmrs.module.ghanaemr.api.queue.model.QueueStatus;

import java.util.Date;
import java.util.List;

public interface PatientQueueDAO {

    PatientQueue save(PatientQueue queue);

    List<PatientQueue> getQueueByLocationAndStatus(Location location, QueueStatus status);

    int getNextQueueNumber(Location toLocation, Date day);

    PatientQueue getActiveQueueEntry(Patient patient, Location location);
}

