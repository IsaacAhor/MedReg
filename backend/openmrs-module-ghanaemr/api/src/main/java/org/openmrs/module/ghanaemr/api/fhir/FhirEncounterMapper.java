package org.openmrs.module.ghanaemr.api.fhir;

import org.hl7.fhir.r4.model.Coding;
import org.hl7.fhir.r4.model.Encounter;
import org.hl7.fhir.r4.model.Identifier;
import org.hl7.fhir.r4.model.Period;
import org.hl7.fhir.r4.model.Reference;
import org.hl7.fhir.r4.model.CodeableConcept;
import org.openmrs.Concept;
import org.openmrs.ConceptMap;
import org.openmrs.ConceptSource;
import org.openmrs.ConceptReferenceTerm;
import org.openmrs.EncounterType;
import org.openmrs.Obs;
import org.openmrs.PatientIdentifier;
import org.openmrs.Patient;
import org.openmrs.Visit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Date;
import java.util.Optional;
import java.util.Set;
import java.util.Collection;

/**
 * FHIR R4 Encounter Mapper for NHIE Integration
 *
 * Maps OpenMRS Encounter to FHIR R4 Encounter resource according to
 * Ghana NHIE specifications in AGENTS.md (Encounter Resource section).
 *
 * Notes:
 * - Uses canonical identifier systems and codes
 * - Defaults class to AMB (ambulatory) for OPD
 * - Status defaults to finished (OpenMRS has no status field)
 * - Period start from encounterDatetime; end from visit stopDatetime when available
 * - Subject references Patient by Ghana Card identifier if present, else UUID reference
 * - ReasonCode attempts ICD-10 mapping from Encounter observations
 */
public class FhirEncounterMapper {

    private static final Logger log = LoggerFactory.getLogger(FhirEncounterMapper.class);

    // Canonical systems and codes
    public static final String ENCOUNTER_ID_SYSTEM = "http://moh.gov.gh/fhir/identifier/encounter";
    public static final String ENCOUNTER_TYPE_SYSTEM = "http://moh.gov.gh/fhir/encounter-type";
    public static final String ACT_CODE_SYSTEM = "http://terminology.hl7.org/CodeSystem/v3-ActCode";
    public static final String ICD10_SYSTEM = "http://hl7.org/fhir/sid/icd-10";
    public static final String GHANA_CARD_SYSTEM = "http://moh.gov.gh/fhir/identifier/ghana-card";

    /**
     * Convert OpenMRS Encounter to FHIR R4 Encounter resource
     *
     * @param omrsEncounter OpenMRS encounter
     * @return FHIR Encounter
     */
    public Encounter toFhirEncounter(org.openmrs.Encounter omrsEncounter) {
        if (omrsEncounter == null) {
            throw new IllegalArgumentException("Encounter cannot be null");
        }

        Encounter fhirEncounter = new Encounter();

        // Identifier: prefer stable client identifier; fall back to UUID
        Identifier identifier = new Identifier();
        identifier.setSystem(ENCOUNTER_ID_SYSTEM);
        identifier.setValue(Optional.ofNullable(omrsEncounter.getEncounterId())
                .map(Object::toString)
                .orElseGet(() -> omrsEncounter.getUuid()));
        fhirEncounter.addIdentifier(identifier);

        // Status: OpenMRS lacks status -> default finished
        fhirEncounter.setStatus(Encounter.EncounterStatus.FINISHED);

        // Class: AMB (ambulatory) for OPD
        fhirEncounter.setClass_(new Coding()
                .setSystem(ACT_CODE_SYSTEM)
                .setCode("AMB")
                .setDisplay("ambulatory"));

        // Type: OPD
        fhirEncounter.addType(new CodeableConcept().addCoding(new Coding()
                .setSystem(ENCOUNTER_TYPE_SYSTEM)
                .setCode("OPD")
                .setDisplay("Outpatient Department")));

        // Subject (patient)
        Patient patient = omrsEncounter.getPatient();
        if (patient != null) {
            Reference subjectRef = buildPatientReference(patient);
            fhirEncounter.setSubject(subjectRef);
        }

        // Period
        Date start = omrsEncounter.getEncounterDatetime();
        Date end = deriveEncounterEnd(omrsEncounter);
        if (start != null || end != null) {
            Period period = new Period();
            if (start != null) period.setStart(start);
            if (end != null) period.setEnd(end);
            fhirEncounter.setPeriod(period);
        }

        // Reason codes (ICD-10, if available)
        addReasonCodesFromObs(omrsEncounter, fhirEncounter);

        log.debug("Mapped OpenMRS Encounter {} to FHIR Encounter", omrsEncounter.getUuid());
        return fhirEncounter;
    }

    private Reference buildPatientReference(Patient patient) {
        // Try Ghana Card identifier first for subject.identifier
        Optional<PatientIdentifier> ghanaCard = Optional.ofNullable(patient.getIdentifiers())
                .map(Set::stream)
                .orElseGet(java.util.stream.Stream::empty)
                .filter(id -> id.getIdentifierType() != null)
                .filter(id -> "Ghana Card".equalsIgnoreCase(id.getIdentifierType().getName()))
                .findFirst();

        Reference ref = new Reference();
        if (ghanaCard.isPresent()) {
            Identifier id = new Identifier();
            id.setSystem(GHANA_CARD_SYSTEM);
            id.setValue(ghanaCard.get().getIdentifier());
            ref.setIdentifier(id);
        }
        // Always include logical reference as fallback
        ref.setReference("Patient/" + patient.getUuid());
        return ref;
    }

    private Date deriveEncounterEnd(org.openmrs.Encounter encounter) {
        Visit visit = encounter.getVisit();
        if (visit != null && visit.getStopDatetime() != null) {
            return visit.getStopDatetime();
        }
        // If no visit stop time, we can leave end null (instantaneous encounter)
        return null;
    }

    private void addReasonCodesFromObs(org.openmrs.Encounter omrsEncounter, Encounter fhirEncounter) {
        Set<Obs> obsSet = omrsEncounter.getObs();
        if (obsSet == null || obsSet.isEmpty()) {
            return;
        }

        for (Obs obs : obsSet) {
            Concept concept = obs.getConcept();
            if (concept == null) continue;

            // Attempt to find ICD-10 mapping on the concept
            Collection<ConceptMap> mappings = concept.getConceptMappings();
            Optional<ConceptMap> icd10Map = (mappings != null ? mappings.stream() : java.util.stream.Stream.<ConceptMap>empty())
                    .filter(cm -> cm.getConceptReferenceTerm() != null)
                    .filter(cm -> {
                        ConceptReferenceTerm term = cm.getConceptReferenceTerm();
                        ConceptSource src = term.getConceptSource();
                        if (src == null) return false;
                        String name = src.getName();
                        String hl7Code = src.getHl7Code();
                        return (name != null && name.toUpperCase().contains("ICD")) ||
                                (hl7Code != null && hl7Code.toUpperCase().contains("ICD"));
                    })
                    .findFirst();

            if (icd10Map.isPresent()) {
                ConceptReferenceTerm term = icd10Map.get().getConceptReferenceTerm();
                String code = term.getCode();
                String display = concept.getName() != null ? concept.getName().getName() : null;
                CodeableConcept reason = new CodeableConcept().addCoding(new Coding()
                        .setSystem(ICD10_SYSTEM)
                        .setCode(code)
                        .setDisplay(display));
                fhirEncounter.addReasonCode(reason);
                // Only map first ICD-10 concept by default
                return;
            }
        }
    }
}


