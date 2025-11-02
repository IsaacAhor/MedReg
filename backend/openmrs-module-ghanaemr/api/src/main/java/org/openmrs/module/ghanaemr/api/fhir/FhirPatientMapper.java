package org.openmrs.module.ghanaemr.api.fhir;

import ca.uhn.fhir.context.FhirContext;
import org.hl7.fhir.r4.model.*;
import org.hl7.fhir.r4.model.Enumerations.AdministrativeGender;
import org.openmrs.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Date;
import java.util.Set;

/**
 * FHIR R4 Patient Mapper for NHIE Integration
 * 
 * Converts OpenMRS Patient objects to FHIR R4 Patient resources
 * per Ghana NHIE specifications.
 * 
 * Reference: AGENTS.md lines 490-550
 * 
 * Key Features:
 * - Maps Ghana Card, NHIS, and Folder Number identifiers
 * - Converts demographics (name, DOB, gender, phone, address)
 * - Follows canonical FHIR identifier system URIs
 * - Handles optional fields (phone, address)
 * 
 * @author MedReg Development Team
 * @version 0.1.0
 */
public class FhirPatientMapper {
    
    private static final Logger log = LoggerFactory.getLogger(FhirPatientMapper.class);
    
    // Canonical FHIR Identifier System URIs (DO NOT CHANGE)
    public static final String GHANA_CARD_SYSTEM = "http://moh.gov.gh/fhir/identifier/ghana-card";
    public static final String NHIS_SYSTEM = "http://moh.gov.gh/fhir/identifier/nhis";
    public static final String FOLDER_NUMBER_SYSTEM = "http://moh.gov.gh/fhir/identifier/folder-number";
    
    // OpenMRS Identifier Type Names
    private static final String GHANA_CARD_TYPE_NAME = "Ghana Card";
    private static final String FOLDER_NUMBER_TYPE_NAME = "Folder Number";
    
    // OpenMRS Person Attribute Type Names
    private static final String NHIS_ATTRIBUTE_TYPE_NAME = "NHIS Number";
    
    private final FhirContext fhirContext;
    
    /**
     * Constructor
     */
    public FhirPatientMapper() {
        this.fhirContext = FhirContext.forR4();
    }
    
    /**
     * Convert OpenMRS Patient to FHIR R4 Patient resource
     * 
     * @param patient OpenMRS patient object
     * @return FHIR R4 Patient resource
     * @throws IllegalArgumentException if patient is null or missing required data
     */
    public Patient toFhirPatient(org.openmrs.Patient patient) {
        if (patient == null) {
            throw new IllegalArgumentException("Patient cannot be null");
        }
        
        Person person = patient.getPerson();
        if (person == null) {
            throw new IllegalArgumentException("Patient must have associated Person");
        }
        
        Patient fhirPatient = new Patient();
        
        // Map identifiers
        mapIdentifiers(patient, fhirPatient);
        
        // Map name
        mapName(person, fhirPatient);
        
        // Map gender
        mapGender(person, fhirPatient);
        
        // Map birth date
        mapBirthDate(person, fhirPatient);
        
        // Map telecom (phone)
        mapTelecom(person, fhirPatient);
        
        // Map address
        mapAddress(person, fhirPatient);
        
        log.debug("Mapped OpenMRS Patient {} to FHIR Patient", patient.getUuid());
        
        return fhirPatient;
    }
    
    /**
     * Map patient identifiers (Ghana Card, NHIS, Folder Number)
     */
    private void mapIdentifiers(org.openmrs.Patient patient, Patient fhirPatient) {
        Set<PatientIdentifier> identifiers = patient.getIdentifiers();
        
        for (PatientIdentifier identifier : identifiers) {
            PatientIdentifierType type = identifier.getIdentifierType();
            String typeName = type.getName();
            String value = identifier.getIdentifier();
            
            if (value == null || value.trim().isEmpty()) {
                continue;
            }
            
            Identifier fhirIdentifier = new Identifier();
            
            // Map to appropriate FHIR system URI
            if (GHANA_CARD_TYPE_NAME.equalsIgnoreCase(typeName)) {
                fhirIdentifier.setSystem(GHANA_CARD_SYSTEM);
                fhirIdentifier.setValue(value);
                fhirPatient.addIdentifier(fhirIdentifier);
                log.debug("Mapped Ghana Card: {}", maskIdentifier(value));
            } else if (FOLDER_NUMBER_TYPE_NAME.equalsIgnoreCase(typeName)) {
                fhirIdentifier.setSystem(FOLDER_NUMBER_SYSTEM);
                fhirIdentifier.setValue(value);
                fhirPatient.addIdentifier(fhirIdentifier);
                log.debug("Mapped Folder Number: {}", value);
            }
        }
        
        // Map NHIS number from person attributes
        Person person = patient.getPerson();
        Set<PersonAttribute> attributes = person.getAttributes();
        
        for (PersonAttribute attribute : attributes) {
            PersonAttributeType attrType = attribute.getAttributeType();
            if (NHIS_ATTRIBUTE_TYPE_NAME.equalsIgnoreCase(attrType.getName())) {
                String nhisNumber = attribute.getValue();
                if (nhisNumber != null && !nhisNumber.trim().isEmpty()) {
                    Identifier nhisIdentifier = new Identifier();
                    nhisIdentifier.setSystem(NHIS_SYSTEM);
                    nhisIdentifier.setValue(nhisNumber);
                    fhirPatient.addIdentifier(nhisIdentifier);
                    log.debug("Mapped NHIS Number: {}", maskIdentifier(nhisNumber));
                }
                break;
            }
        }
        
        // Validate at least Ghana Card is present (required)
        boolean hasGhanaCard = fhirPatient.getIdentifier().stream()
            .anyMatch(id -> GHANA_CARD_SYSTEM.equals(id.getSystem()));
        
        if (!hasGhanaCard) {
            log.warn("Patient {} missing Ghana Card identifier", patient.getUuid());
        }
    }
    
    /**
     * Map person name to FHIR HumanName
     */
    private void mapName(Person person, Patient fhirPatient) {
        PersonName personName = person.getPersonName();
        
        if (personName == null) {
            log.warn("Person {} has no name", person.getUuid());
            return;
        }
        
        HumanName fhirName = new HumanName();
        fhirName.setUse(HumanName.NameUse.OFFICIAL);
        
        // Family name (last name)
        if (personName.getFamilyName() != null) {
            fhirName.setFamily(personName.getFamilyName());
        }
        
        // Given names (first name + middle name)
        if (personName.getGivenName() != null) {
            fhirName.addGiven(personName.getGivenName());
        }
        if (personName.getMiddleName() != null) {
            fhirName.addGiven(personName.getMiddleName());
        }
        
        fhirPatient.addName(fhirName);
        log.debug("Mapped name: {} {}", personName.getGivenName(), personName.getFamilyName());
    }
    
    /**
     * Map gender from OpenMRS to FHIR
     * 
     * Mapping:
     * - M → male
     * - F → female
     * - O → other
     * - U → unknown
     */
    private void mapGender(Person person, Patient fhirPatient) {
        String gender = person.getGender();
        
        if (gender == null) {
            fhirPatient.setGender(AdministrativeGender.UNKNOWN);
            return;
        }
        
        switch (gender.toUpperCase()) {
            case "M":
                fhirPatient.setGender(AdministrativeGender.MALE);
                break;
            case "F":
                fhirPatient.setGender(AdministrativeGender.FEMALE);
                break;
            case "O":
                fhirPatient.setGender(AdministrativeGender.OTHER);
                break;
            case "U":
            default:
                fhirPatient.setGender(AdministrativeGender.UNKNOWN);
                break;
        }
        
        log.debug("Mapped gender: {} → {}", gender, fhirPatient.getGender());
    }
    
    /**
     * Map birth date
     */
    private void mapBirthDate(Person person, Patient fhirPatient) {
        Date birthdate = person.getBirthdate();
        
        if (birthdate != null) {
            fhirPatient.setBirthDate(birthdate);
            log.debug("Mapped birthdate: {}", birthdate);
        } else {
            log.warn("Person {} has no birthdate", person.getUuid());
        }
    }
    
    /**
     * Map telecom (phone number) from person attributes
     */
    private void mapTelecom(Person person, Patient fhirPatient) {
        Set<PersonAttribute> attributes = person.getAttributes();
        
        for (PersonAttribute attribute : attributes) {
            PersonAttributeType attrType = attribute.getAttributeType();
            String attrName = attrType.getName();
            
            // Look for phone number attributes (common names)
            if (attrName != null && (
                attrName.equalsIgnoreCase("Phone Number") ||
                attrName.equalsIgnoreCase("Telephone Number") ||
                attrName.equalsIgnoreCase("Mobile Number") ||
                attrName.equalsIgnoreCase("Contact Number")
            )) {
                String phone = attribute.getValue();
                if (phone != null && !phone.trim().isEmpty()) {
                    ContactPoint contactPoint = new ContactPoint();
                    contactPoint.setSystem(ContactPoint.ContactPointSystem.PHONE);
                    contactPoint.setValue(phone);
                    contactPoint.setUse(ContactPoint.ContactPointUse.MOBILE);
                    fhirPatient.addTelecom(contactPoint);
                    log.debug("Mapped phone: {}", maskPhone(phone));
                    break; // Use first phone found
                }
            }
        }
    }
    
    /**
     * Map person address to FHIR Address
     */
    private void mapAddress(Person person, Patient fhirPatient) {
        PersonAddress personAddress = person.getPersonAddress();
        
        if (personAddress == null) {
            log.debug("Person {} has no address", person.getUuid());
            return;
        }
        
        Address fhirAddress = new Address();
        fhirAddress.setUse(Address.AddressUse.HOME);
        
        // Address line 1
        if (personAddress.getAddress1() != null && !personAddress.getAddress1().trim().isEmpty()) {
            fhirAddress.addLine(personAddress.getAddress1());
        }
        
        // Address line 2
        if (personAddress.getAddress2() != null && !personAddress.getAddress2().trim().isEmpty()) {
            fhirAddress.addLine(personAddress.getAddress2());
        }
        
        // City/Village
        if (personAddress.getCityVillage() != null) {
            fhirAddress.setCity(personAddress.getCityVillage());
        }
        
        // District
        if (personAddress.getCountyDistrict() != null) {
            fhirAddress.setDistrict(personAddress.getCountyDistrict());
        }
        
        // State/Province (Region)
        if (personAddress.getStateProvince() != null) {
            fhirAddress.setState(personAddress.getStateProvince());
        }
        
        // Country
        if (personAddress.getCountry() != null) {
            fhirAddress.setCountry(personAddress.getCountry());
        } else {
            fhirAddress.setCountry("GH"); // Default to Ghana
        }
        
        // Build text representation
        StringBuilder textBuilder = new StringBuilder();
        if (personAddress.getAddress1() != null) textBuilder.append(personAddress.getAddress1());
        if (personAddress.getCityVillage() != null) {
            if (textBuilder.length() > 0) textBuilder.append(", ");
            textBuilder.append(personAddress.getCityVillage());
        }
        if (textBuilder.length() > 0) {
            fhirAddress.setText(textBuilder.toString());
        }
        
        fhirPatient.addAddress(fhirAddress);
        log.debug("Mapped address: {}", fhirAddress.getCity());
    }
    
    /**
     * Serialize FHIR Patient to JSON string
     * 
     * @param patient FHIR Patient resource
     * @return JSON string representation
     */
    public String toJson(Patient patient) {
        return fhirContext.newJsonParser()
            .setPrettyPrint(true)
            .encodeResourceToString(patient);
    }
    
    /**
     * Parse JSON string to FHIR Patient
     * 
     * @param json JSON string
     * @return FHIR Patient resource
     */
    public Patient fromJson(String json) {
        return fhirContext.newJsonParser()
            .parseResource(Patient.class, json);
    }
    
    /**
     * Validate FHIR Patient resource
     * 
     * @param patient FHIR Patient resource
     * @return true if valid, false otherwise
     */
    public boolean validate(Patient patient) {
        if (patient == null) {
            return false;
        }
        
        // Check required fields
        boolean hasIdentifier = patient.hasIdentifier() && !patient.getIdentifier().isEmpty();
        boolean hasName = patient.hasName() && !patient.getName().isEmpty();
        boolean hasGender = patient.hasGender();
        boolean hasBirthDate = patient.hasBirthDate();
        
        boolean isValid = hasIdentifier && hasName && hasGender && hasBirthDate;
        
        if (!isValid) {
            log.warn("FHIR Patient validation failed: hasIdentifier={}, hasName={}, hasGender={}, hasBirthDate={}",
                hasIdentifier, hasName, hasGender, hasBirthDate);
        }
        
        return isValid;
    }
    
    // Utility methods for PII masking in logs
    
    private String maskIdentifier(String identifier) {
        if (identifier == null || identifier.length() < 4) {
            return "****";
        }
        int visibleChars = Math.min(4, identifier.length() / 3);
        String visible = identifier.substring(0, visibleChars);
        return visible + "****";
    }
    
    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 6) {
            return "****";
        }
        String prefix = phone.substring(0, Math.min(4, phone.length() - 3));
        String suffix = phone.substring(phone.length() - 3);
        return prefix + "***" + suffix;
    }
}
