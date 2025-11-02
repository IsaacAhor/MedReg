package org.openmrs.module.ghanaemr.api.fhir;

import org.hl7.fhir.r4.model.Coding;
import org.hl7.fhir.r4.model.Encounter;
import org.hl7.fhir.r4.model.Identifier;
import org.hl7.fhir.r4.model.Reference;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.openmrs.*;

import java.util.Calendar;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;

import static org.junit.Assert.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for FhirEncounterMapper
 */
public class FhirEncounterMapperTest {

    private FhirEncounterMapper mapper;

    @Mock
    private org.openmrs.Encounter mockEncounter;

    @Mock
    private Patient mockPatient;

    @Mock
    private Visit mockVisit;

    @Mock
    private Obs mockObs;

    @Mock
    private Concept mockConcept;

    @Mock
    private ConceptMap mockConceptMap;

    @Mock
    private ConceptReferenceTerm mockTerm;

    @Mock
    private ConceptReferenceSource mockSource;

    @Mock
    private PatientIdentifier mockGhanaCardIdentifier;

    @Mock
    private PatientIdentifierType mockGhanaCardType;

    @Before
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        mapper = new FhirEncounterMapper();
    }

    @Test(expected = IllegalArgumentException.class)
    public void toFhirEncounter_NullEncounter_ThrowsException() {
        mapper.toFhirEncounter(null);
    }

    @Test
    public void toFhirEncounter_MinimalEncounter_MapsCoreFields() {
        setupMinimalEncounter();

        Encounter fhirEncounter = mapper.toFhirEncounter(mockEncounter);

        // Identifier
        assertTrue(fhirEncounter.hasIdentifier());
        Identifier id = fhirEncounter.getIdentifierFirstRep();
        assertEquals(FhirEncounterMapper.ENCOUNTER_ID_SYSTEM, id.getSystem());
        assertEquals("enc-uuid-123", id.getValue());

        // Status
        assertEquals(Encounter.EncounterStatus.FINISHED, fhirEncounter.getStatus());

        // Class
        Coding cls = fhirEncounter.getClass_();
        assertEquals(FhirEncounterMapper.ACT_CODE_SYSTEM, cls.getSystem());
        assertEquals("AMB", cls.getCode());

        // Type
        assertFalse(fhirEncounter.getType().isEmpty());
        Coding typeCoding = fhirEncounter.getTypeFirstRep().getCodingFirstRep();
        assertEquals(FhirEncounterMapper.ENCOUNTER_TYPE_SYSTEM, typeCoding.getSystem());
        assertEquals("OPD", typeCoding.getCode());

        // Subject
        Reference subject = fhirEncounter.getSubject();
        assertNotNull(subject);
        assertEquals("Patient/patient-uuid-123", subject.getReference());
        assertNotNull(subject.getIdentifier());
        assertEquals(FhirEncounterMapper.GHANA_CARD_SYSTEM, subject.getIdentifier().getSystem());
        assertEquals("GHA-123456789-7", subject.getIdentifier().getValue());

        // Period
        assertTrue(fhirEncounter.hasPeriod());
        assertNotNull(fhirEncounter.getPeriod().getStart());
        assertNotNull(fhirEncounter.getPeriod().getEnd());
    }

    @Test
    public void toFhirEncounter_ReasonCodeFromICD10Concept_MapsCorrectly() {
        setupMinimalEncounter();
        // Add obs with ICD-10 concept mapping
        Set<Obs> obsSet = new HashSet<>();
        obsSet.add(mockObs);
        when(mockEncounter.getObs()).thenReturn(obsSet);

        when(mockObs.getConcept()).thenReturn(mockConcept);
        Set<ConceptMap> maps = new HashSet<>();
        maps.add(mockConceptMap);
        when(mockConcept.getConceptMappings()).thenReturn(maps);

        when(mockConceptMap.getConceptReferenceTerm()).thenReturn(mockTerm);
        when(mockTerm.getConceptSource()).thenReturn(mockSource);
        when(mockSource.getName()).thenReturn("ICD-10");
        when(mockTerm.getCode()).thenReturn("B54");
        ConceptName cn = new ConceptName();
        cn.setName("Malaria, unspecified");
        when(mockConcept.getName()).thenReturn(cn);

        Encounter fhirEncounter = mapper.toFhirEncounter(mockEncounter);

        assertFalse(fhirEncounter.getReasonCode().isEmpty());
        Coding coding = fhirEncounter.getReasonCodeFirstRep().getCodingFirstRep();
        assertEquals(FhirEncounterMapper.ICD10_SYSTEM, coding.getSystem());
        assertEquals("B54", coding.getCode());
        assertEquals("Malaria, unspecified", coding.getDisplay());
    }

    private void setupMinimalEncounter() {
        // Encounter basics
        when(mockEncounter.getUuid()).thenReturn("enc-uuid-123");
        when(mockEncounter.getEncounterId()).thenReturn(null); // ensure UUID path used

        Calendar cal = Calendar.getInstance();
        cal.set(2025, Calendar.OCTOBER, 30, 9, 30, 0);
        Date start = cal.getTime();
        when(mockEncounter.getEncounterDatetime()).thenReturn(start);

        // Visit with stop time for period end
        cal.set(2025, Calendar.OCTOBER, 30, 10, 15, 0);
        Date stop = cal.getTime();
        when(mockEncounter.getVisit()).thenReturn(mockVisit);
        when(mockVisit.getStopDatetime()).thenReturn(stop);

        // Patient with Ghana Card
        when(mockEncounter.getPatient()).thenReturn(mockPatient);
        when(mockPatient.getUuid()).thenReturn("patient-uuid-123");
        Set<PatientIdentifier> ids = new HashSet<>();
        ids.add(mockGhanaCardIdentifier);
        when(mockPatient.getIdentifiers()).thenReturn(ids);
        when(mockGhanaCardIdentifier.getIdentifierType()).thenReturn(mockGhanaCardType);
        when(mockGhanaCardType.getName()).thenReturn("Ghana Card");
        when(mockGhanaCardIdentifier.getIdentifier()).thenReturn("GHA-123456789-7");
    }
}

