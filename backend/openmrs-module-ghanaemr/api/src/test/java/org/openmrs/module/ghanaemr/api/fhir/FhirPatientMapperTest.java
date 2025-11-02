package org.openmrs.module.ghanaemr.api.fhir;

import ca.uhn.fhir.context.FhirContext;
import org.hl7.fhir.r4.model.*;
import org.hl7.fhir.r4.model.Enumerations.AdministrativeGender;
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
 * Unit tests for FhirPatientMapper
 * 
 * Tests cover:
 * - Identifier mapping (Ghana Card, NHIS, Folder Number)
 * - Name mapping
 * - Gender mapping (all cases: M, F, O, U)
 * - Birth date mapping
 * - Telecom (phone) mapping
 * - Address mapping
 * - JSON serialization/deserialization
 * - Validation
 * - Edge cases (null values, missing data)
 * 
 * Target: >90% code coverage
 */
public class FhirPatientMapperTest {
    
    private FhirPatientMapper mapper;
    
    @Mock
    private org.openmrs.Patient mockPatient;
    
    @Mock
    private Person mockPerson;
    
    @Mock
    private PersonName mockPersonName;
    
    @Mock
    private PersonAddress mockPersonAddress;
    
    @Mock
    private PatientIdentifier mockGhanaCardIdentifier;
    
    @Mock
    private PatientIdentifier mockFolderNumberIdentifier;
    
    @Mock
    private PatientIdentifierType mockGhanaCardType;
    
    @Mock
    private PatientIdentifierType mockFolderNumberType;
    
    @Mock
    private PersonAttribute mockNhisAttribute;
    
    @Mock
    private PersonAttribute mockPhoneAttribute;
    
    @Mock
    private PersonAttributeType mockNhisAttributeType;
    
    @Mock
    private PersonAttributeType mockPhoneAttributeType;
    
    @Before
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        mapper = new FhirPatientMapper();
    }
    
    @Test(expected = IllegalArgumentException.class)
    public void toFhirPatient_NullPatient_ThrowsException() {
        mapper.toFhirPatient(null);
    }
    
    @Test(expected = IllegalArgumentException.class)
    public void toFhirPatient_PatientWithNoPerson_ThrowsException() {
        when(mockPatient.getPerson()).thenReturn(null);
        mapper.toFhirPatient(mockPatient);
    }
    
    @Test
    public void toFhirPatient_CompletePatient_MapsAllFields() {
        // Setup complete patient
        setupCompletePatient();
        
        // Execute
        Patient fhirPatient = mapper.toFhirPatient(mockPatient);
        
        // Verify identifiers
        assertNotNull(fhirPatient.getIdentifier());
        assertEquals(3, fhirPatient.getIdentifier().size());
        
        // Verify Ghana Card
        Identifier ghanaCard = fhirPatient.getIdentifier().stream()
            .filter(id -> FhirPatientMapper.GHANA_CARD_SYSTEM.equals(id.getSystem()))
            .findFirst()
            .orElse(null);
        assertNotNull("Ghana Card identifier should be present", ghanaCard);
        assertEquals("GHA-123456789-7", ghanaCard.getValue());
        
        // Verify NHIS
        Identifier nhis = fhirPatient.getIdentifier().stream()
            .filter(id -> FhirPatientMapper.NHIS_SYSTEM.equals(id.getSystem()))
            .findFirst()
            .orElse(null);
        assertNotNull("NHIS identifier should be present", nhis);
        assertEquals("0123456789", nhis.getValue());
        
        // Verify Folder Number
        Identifier folderNumber = fhirPatient.getIdentifier().stream()
            .filter(id -> FhirPatientMapper.FOLDER_NUMBER_SYSTEM.equals(id.getSystem()))
            .findFirst()
            .orElse(null);
        assertNotNull("Folder Number identifier should be present", folderNumber);
        assertEquals("GAR-KBTH-2025-000123", folderNumber.getValue());
        
        // Verify name
        assertNotNull(fhirPatient.getName());
        assertEquals(1, fhirPatient.getName().size());
        HumanName name = fhirPatient.getName().get(0);
        assertEquals(HumanName.NameUse.OFFICIAL, name.getUse());
        assertEquals("Mensah", name.getFamily());
        assertEquals(2, name.getGiven().size());
        assertEquals("Kwame", name.getGiven().get(0).getValue());
        assertEquals("Kofi", name.getGiven().get(1).getValue());
        
        // Verify gender
        assertEquals(AdministrativeGender.MALE, fhirPatient.getGender());
        
        // Verify birth date
        assertNotNull(fhirPatient.getBirthDate());
        
        // Verify phone
        assertNotNull(fhirPatient.getTelecom());
        assertEquals(1, fhirPatient.getTelecom().size());
        ContactPoint phone = fhirPatient.getTelecom().get(0);
        assertEquals(ContactPoint.ContactPointSystem.PHONE, phone.getSystem());
        assertEquals("+233244123456", phone.getValue());
        assertEquals(ContactPoint.ContactPointUse.MOBILE, phone.getUse());
        
        // Verify address
        assertNotNull(fhirPatient.getAddress());
        assertEquals(1, fhirPatient.getAddress().size());
        Address address = fhirPatient.getAddress().get(0);
        assertEquals(Address.AddressUse.HOME, address.getUse());
        assertEquals("Accra", address.getCity());
        assertEquals("Greater Accra", address.getState());
        assertEquals("GH", address.getCountry());
    }
    
    @Test
    public void toFhirPatient_GenderMale_MapsProperly() {
        setupMinimalPatient();
        when(mockPerson.getGender()).thenReturn("M");
        
        Patient fhirPatient = mapper.toFhirPatient(mockPatient);
        
        assertEquals(AdministrativeGender.MALE, fhirPatient.getGender());
    }
    
    @Test
    public void toFhirPatient_GenderFemale_MapsProperly() {
        setupMinimalPatient();
        when(mockPerson.getGender()).thenReturn("F");
        
        Patient fhirPatient = mapper.toFhirPatient(mockPatient);
        
        assertEquals(AdministrativeGender.FEMALE, fhirPatient.getGender());
    }
    
    @Test
    public void toFhirPatient_GenderOther_MapsProperly() {
        setupMinimalPatient();
        when(mockPerson.getGender()).thenReturn("O");
        
        Patient fhirPatient = mapper.toFhirPatient(mockPatient);
        
        assertEquals(AdministrativeGender.OTHER, fhirPatient.getGender());
    }
    
    @Test
    public void toFhirPatient_GenderUnknown_MapsProperly() {
        setupMinimalPatient();
        when(mockPerson.getGender()).thenReturn("U");
        
        Patient fhirPatient = mapper.toFhirPatient(mockPatient);
        
        assertEquals(AdministrativeGender.UNKNOWN, fhirPatient.getGender());
    }
    
    @Test
    public void toFhirPatient_NullGender_MapsToUnknown() {
        setupMinimalPatient();
        when(mockPerson.getGender()).thenReturn(null);
        
        Patient fhirPatient = mapper.toFhirPatient(mockPatient);
        
        assertEquals(AdministrativeGender.UNKNOWN, fhirPatient.getGender());
    }
    
    @Test
    public void toFhirPatient_MinimalPatient_MapsSuccessfully() {
        setupMinimalPatient();
        
        Patient fhirPatient = mapper.toFhirPatient(mockPatient);
        
        assertNotNull(fhirPatient);
        assertTrue(fhirPatient.hasIdentifier());
        assertTrue(fhirPatient.hasName());
        assertTrue(fhirPatient.hasGender());
        assertTrue(fhirPatient.hasBirthDate());
    }
    
    @Test
    public void toFhirPatient_NoPhoneAttribute_HandlesGracefully() {
        setupMinimalPatient();
        
        // Don't add phone attribute
        Set<PersonAttribute> attributes = new HashSet<>();
        attributes.add(mockNhisAttribute);
        when(mockPerson.getAttributes()).thenReturn(attributes);
        
        Patient fhirPatient = mapper.toFhirPatient(mockPatient);
        
        assertTrue(fhirPatient.getTelecom().isEmpty());
    }
    
    @Test
    public void toFhirPatient_NoAddress_HandlesGracefully() {
        setupMinimalPatient();
        when(mockPerson.getPersonAddress()).thenReturn(null);
        
        Patient fhirPatient = mapper.toFhirPatient(mockPatient);
        
        assertTrue(fhirPatient.getAddress().isEmpty());
    }
    
    @Test
    public void toFhirPatient_EmptyIdentifiers_HandlesGracefully() {
        setupMinimalPatient();
        
        // Set empty identifiers
        Set<PatientIdentifier> identifiers = new HashSet<>();
        when(mockPatient.getIdentifiers()).thenReturn(identifiers);
        
        Patient fhirPatient = mapper.toFhirPatient(mockPatient);
        
        assertTrue(fhirPatient.getIdentifier().isEmpty());
    }
    
    @Test
    public void toJson_ValidPatient_ReturnsJsonString() {
        setupMinimalPatient();
        Patient fhirPatient = mapper.toFhirPatient(mockPatient);
        
        String json = mapper.toJson(fhirPatient);
        
        assertNotNull(json);
        assertTrue(json.contains("\"resourceType\" : \"Patient\""));
        assertTrue(json.contains("GHA-123456789-7"));
    }
    
    @Test
    public void fromJson_ValidJson_ReturnsPatient() {
        setupMinimalPatient();
        Patient originalPatient = mapper.toFhirPatient(mockPatient);
        String json = mapper.toJson(originalPatient);
        
        Patient parsedPatient = mapper.fromJson(json);
        
        assertNotNull(parsedPatient);
        assertEquals(originalPatient.getIdentifier().size(), parsedPatient.getIdentifier().size());
    }
    
    @Test
    public void validate_CompletePatient_ReturnsTrue() {
        setupMinimalPatient();
        Patient fhirPatient = mapper.toFhirPatient(mockPatient);
        
        boolean isValid = mapper.validate(fhirPatient);
        
        assertTrue("Complete patient should be valid", isValid);
    }
    
    @Test
    public void validate_NullPatient_ReturnsFalse() {
        boolean isValid = mapper.validate(null);
        
        assertFalse("Null patient should be invalid", isValid);
    }
    
    @Test
    public void validate_PatientWithoutIdentifier_ReturnsFalse() {
        Patient patient = new Patient();
        patient.addName(new HumanName().setFamily("Test"));
        patient.setGender(AdministrativeGender.MALE);
        patient.setBirthDate(new Date());
        
        boolean isValid = mapper.validate(patient);
        
        assertFalse("Patient without identifier should be invalid", isValid);
    }
    
    @Test
    public void validate_PatientWithoutName_ReturnsFalse() {
        Patient patient = new Patient();
        patient.addIdentifier(new Identifier().setSystem("test").setValue("123"));
        patient.setGender(AdministrativeGender.MALE);
        patient.setBirthDate(new Date());
        
        boolean isValid = mapper.validate(patient);
        
        assertFalse("Patient without name should be invalid", isValid);
    }
    
    @Test
    public void validate_PatientWithoutGender_ReturnsFalse() {
        Patient patient = new Patient();
        patient.addIdentifier(new Identifier().setSystem("test").setValue("123"));
        patient.addName(new HumanName().setFamily("Test"));
        patient.setBirthDate(new Date());
        
        boolean isValid = mapper.validate(patient);
        
        assertFalse("Patient without gender should be invalid", isValid);
    }
    
    @Test
    public void validate_PatientWithoutBirthDate_ReturnsFalse() {
        Patient patient = new Patient();
        patient.addIdentifier(new Identifier().setSystem("test").setValue("123"));
        patient.addName(new HumanName().setFamily("Test"));
        patient.setGender(AdministrativeGender.MALE);
        
        boolean isValid = mapper.validate(patient);
        
        assertFalse("Patient without birthdate should be invalid", isValid);
    }
    
    // Helper methods
    
    private void setupMinimalPatient() {
        // Patient
        when(mockPatient.getPerson()).thenReturn(mockPerson);
        when(mockPatient.getUuid()).thenReturn("patient-uuid-123");
        
        // Identifiers
        Set<PatientIdentifier> identifiers = new HashSet<>();
        identifiers.add(mockGhanaCardIdentifier);
        when(mockPatient.getIdentifiers()).thenReturn(identifiers);
        
        when(mockGhanaCardIdentifier.getIdentifierType()).thenReturn(mockGhanaCardType);
        when(mockGhanaCardType.getName()).thenReturn("Ghana Card");
        when(mockGhanaCardIdentifier.getIdentifier()).thenReturn("GHA-123456789-7");
        
        // Person
        when(mockPerson.getUuid()).thenReturn("person-uuid-123");
        when(mockPerson.getPersonName()).thenReturn(mockPersonName);
        when(mockPerson.getGender()).thenReturn("M");
        
        Calendar cal = Calendar.getInstance();
        cal.set(1990, Calendar.JANUARY, 1);
        when(mockPerson.getBirthdate()).thenReturn(cal.getTime());
        
        // Name
        when(mockPersonName.getGivenName()).thenReturn("Kwame");
        when(mockPersonName.getFamilyName()).thenReturn("Mensah");
        when(mockPersonName.getMiddleName()).thenReturn("Kofi");
        
        // Attributes (NHIS only for minimal)
        Set<PersonAttribute> attributes = new HashSet<>();
        attributes.add(mockNhisAttribute);
        when(mockPerson.getAttributes()).thenReturn(attributes);
        
        when(mockNhisAttribute.getAttributeType()).thenReturn(mockNhisAttributeType);
        when(mockNhisAttributeType.getName()).thenReturn("NHIS Number");
        when(mockNhisAttribute.getValue()).thenReturn("0123456789");
        
        // No address for minimal patient
        when(mockPerson.getPersonAddress()).thenReturn(null);
    }
    
    private void setupCompletePatient() {
        setupMinimalPatient();
        
        // Add folder number identifier
        Set<PatientIdentifier> identifiers = new HashSet<>();
        identifiers.add(mockGhanaCardIdentifier);
        identifiers.add(mockFolderNumberIdentifier);
        when(mockPatient.getIdentifiers()).thenReturn(identifiers);
        
        when(mockFolderNumberIdentifier.getIdentifierType()).thenReturn(mockFolderNumberType);
        when(mockFolderNumberType.getName()).thenReturn("Folder Number");
        when(mockFolderNumberIdentifier.getIdentifier()).thenReturn("GAR-KBTH-2025-000123");
        
        // Add phone attribute
        Set<PersonAttribute> attributes = new HashSet<>();
        attributes.add(mockNhisAttribute);
        attributes.add(mockPhoneAttribute);
        when(mockPerson.getAttributes()).thenReturn(attributes);
        
        when(mockPhoneAttribute.getAttributeType()).thenReturn(mockPhoneAttributeType);
        when(mockPhoneAttributeType.getName()).thenReturn("Phone Number");
        when(mockPhoneAttribute.getValue()).thenReturn("+233244123456");
        
        // Add address
        when(mockPerson.getPersonAddress()).thenReturn(mockPersonAddress);
        when(mockPersonAddress.getAddress1()).thenReturn("123 Main St");
        when(mockPersonAddress.getCityVillage()).thenReturn("Accra");
        when(mockPersonAddress.getCountyDistrict()).thenReturn("Accra Metro");
        when(mockPersonAddress.getStateProvince()).thenReturn("Greater Accra");
        when(mockPersonAddress.getCountry()).thenReturn("GH");
    }
}
