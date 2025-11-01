# OpenMRS Platform: Development Patterns and Best Practices

## Overview

OpenMRS has unique architectural patterns that differ from standard Spring Boot applications. This document captures critical patterns that developers (including AI coding assistants) must follow to generate correct OpenMRS code.

**Purpose**: Prevent common mistakes by documenting OpenMRS-specific conventions, quirks, and best practices.

---

## Core Architecture Patterns

### Context-Based Service Access (NOT Dependency Injection)

**CRITICAL DIFFERENCE**: OpenMRS uses `Context` pattern instead of standard Spring `@Autowired` dependency injection.

**Why?**
- Runtime privilege checking
- Session management
- Module dependency injection at runtime
- Consistent API across versions

**Pattern: Service Access**

Always use:
```
PatientService patientService = Context.getPatientService();
```

Never use:
```
@Autowired
private PatientService patientService;  // This will NOT work in OpenMRS modules
```

**Service Access Methods**
- `Context.getPatientService()` - Patient operations
- `Context.getEncounterService()` - Encounter operations
- `Context.getObsService()` - Observation operations
- `Context.getConceptService()` - Concept dictionary operations
- `Context.getLocationService()` - Location/facility operations
- `Context.getUserService()` - User and role operations
- `Context.getAdministrationService()` - Configuration, global properties
- `Context.getPersonService()` - Person (demographics) operations

**In Controllers**
```
@Controller
public class GhanaPatientController {
    
    @RequestMapping("/patient/{uuid}")
    public String getPatient(@PathVariable String uuid) {
        // Get service from Context
        PatientService ps = Context.getPatientService();
        Patient patient = ps.getPatientByUuid(uuid);
        
        return "patientView";
    }
}
```

**In Custom Services**
```
public class GhanaNHIEIntegrationService {
    
    public void submitEncounter(Integer encounterId) {
        // Get required services
        EncounterService es = Context.getEncounterService();
        PatientService ps = Context.getPatientService();
        
        Encounter encounter = es.getEncounter(encounterId);
        Patient patient = ps.getPatient(encounter.getPatient().getPatientId());
        
        // Business logic here
    }
}
```

---

## Privilege and Security System

### Privilege Checking

**Always check privileges before sensitive operations**

**Pattern: Check Privilege**
```
if (!Context.hasPrivilege("View Patients")) {
    throw new APIAuthenticationException("User lacks privilege to view patients");
}
```

**Common Privileges**
- `View Patients` - Read patient data
- `Add Patients` - Create new patients
- `Edit Patients` - Modify patient data
- `Delete Patients` - Delete patients
- `View Encounters` - Read encounters
- `Add Encounters` - Create encounters
- `Edit Encounters` - Modify encounters
- `View Observations` - Read obs data
- `Add Observations` - Create obs
- `Manage Concepts` - Edit concept dictionary
- `View Navigation Menu` - Access specific UI sections

**Annotating Methods with Privileges**
```
@Authorized({"View Patients", "View Encounters"})
public Patient getPatientWithEncounters(Integer patientId) {
    // Method requires both privileges
}
```

### User Context

**Getting Current User**
```
User currentUser = Context.getAuthenticatedUser();
```

**Getting Current User's Roles**
```
Set<Role> roles = currentUser.getAllRoles();
for (Role role : roles) {
    // Check role permissions
}
```

**Common Roles**
- `System Developer` - Full system access
- `Provider` - Clinical staff
- `Data Clerk` - Registration, data entry
- `Nurse` - Nursing workflows
- `Pharmacist` - Pharmacy operations
- Custom roles per implementation

---

## Data Model Fundamentals

### Base Classes

**BaseOpenmrsData** (for auditable domain objects)
- Extends: `BaseOpenmrsObject`
- Adds: `creator`, `dateCreated`, `changedBy`, `dateChanged`, `voided`, `dateVoided`, `voidedBy`, `voidReason`
- Use for: Entities that should be soft-deleted (voided, not hard deleted)
- Examples: Patient, Encounter, Obs, Order

**BaseOpenmrsMetadata** (for reference data)
- Extends: `BaseOpenmrsData`
- Adds: `name`, `description`, `retired`, `dateRetired`, `retiredBy`, `retireReason`
- Use for: Master data, configuration entities
- Examples: Concept, Location, EncounterType, VisitType

**BaseOpenmrsObject** (minimal base)
- Only has: `id`, `uuid`
- Use for: Very simple domain objects

**Pattern: Extend Correct Base Class**
```
// Transactional data (can be voided)
public class NHIETransaction extends BaseOpenmrsData {
    // Your fields here
}

// Master data (can be retired)
public class GhanaFacility extends BaseOpenmrsMetadata {
    // Your fields here
}
```

### Voiding vs Retiring vs Deleting

**Voiding** (soft delete for transactional data)
- Used for: Patient, Encounter, Obs, Order
- Reason: Preserve audit trail
- Method: `voidedService.voidPatient(patient, "duplicate record")`
- Result: Record marked `voided=true`, still in database, not returned in normal queries

**Retiring** (soft delete for master data)
- Used for: Concept, Location, EncounterType
- Reason: Data referenced elsewhere
- Method: `conceptService.retireConcept(concept, "no longer used")`
- Result: Record marked `retired=true`, still in database, not shown in UI dropdowns

**Deleting** (hard delete - rare)
- Used for: Test data, true duplicates
- Method: `patientService.purgePatient(patient)`
- Result: Record permanently removed from database
- WARNING: Use sparingly, breaks audit trail

---

## Concept Dictionary System

### Concept Fundamentals

**Concept**: Central to OpenMRS data model
- All clinical observations reference Concepts

---

## External References

- UgandaEMR – Guidelines for Customizing: https://mets-programme.gitbook.io/ugandaemr-technical-guide/guidelines-for-customizing-ugandaemr
  - Feature toggles, permission restrictions, custom modules. Do not modify core; extend via modules/config.
  - Document only Ghana-specific deltas; link for general patterns.

- UgandaEMR – Metadata Management: https://mets-programme.gitbook.io/ugandaemr-technical-guide/metadata-management
  - Use packaging/versioning for concepts, identifier types, locations, programs. Avoid ad‑hoc SQL; ship metadata via modules.

- UgandaEMR – Form Management: https://mets-programme.gitbook.io/ugandaemr-technical-guide/form-management
  - Follow form lifecycle and versioning; reuse framework guidance. Ghana docs should focus on Ghana‑specific forms/validation.

- UgandaEMR – Report Development Guidelines: https://mets-programme.gitbook.io/ugandaemr-technical-guide/report-development-guidelines
  - Adopt Reporting module patterns (datasets/indicators/parameters). Keep Ghana docs to Ghana reports only.

- UgandaEMR – Creating a Custom Module: https://mets-programme.gitbook.io/ugandaemr-technical-guide/creating-a-custom-module
  - Scaffold, dependencies, packaging. Apply for Ghana modules.

- UgandaEMR – Releasing: https://mets-programme.gitbook.io/ugandaemr-technical-guide/releasing
  - Align release/versioning/tagging; add Ghana NHIE/NHIS config where needed.
- Concepts define: Diagnoses, tests, drugs, questions, answers
- Concepts have datatype and class

**Concept Datatypes**
- `Numeric` - Numbers with units (e.g., weight in kg, BP in mmHg)
- `Coded` - Multiple choice from predefined answers (e.g., blood type: A, B, AB, O)
- `Text` - Free text (e.g., clinical notes)
- `Boolean` - Yes/No (e.g., HIV positive?)
- `Date` - Date value (e.g., onset date)
- `Time` - Time value
- `Datetime` - Date and time
- `Complex` - Binary data (images, documents)

**Concept Classes**
- `Question` - A question in a form
- `Diagnosis` - A diagnosis (usually ICD-coded)
- `Test` - A lab test or procedure
- `Drug` - A medication
- `Procedure` - A medical procedure
- `Finding` - A clinical finding
- `Misc` - Miscellaneous

### Querying Concepts

**By Name or ID**
```
ConceptService cs = Context.getConceptService();

// By concept ID
Concept weightConcept = cs.getConcept(5089);  // CIEL concept for Weight (kg)

// By name
Concept bpConcept = cs.getConceptByName("Blood Pressure");

// By UUID (preferred for interoperability)
Concept malariaConcept = cs.getConceptByUuid("116128AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
```

**By Mapping (CIEL, ICD-10, LOINC, SNOMED)**
```
// Get concept mapped to ICD-10 code
Concept malaria = cs.getConceptByMapping("B54", "ICD-10-WHO");

// Get concept mapped to LOINC code
Concept hemoglobin = cs.getConceptByMapping("718-7", "LOINC");
```

### Creating Observations with Concepts

**Numeric Observation**
```
ObsService os = Context.getObsService();

Obs weightObs = new Obs();
weightObs.setPerson(patient);
weightObs.setEncounter(encounter);
weightObs.setConcept(cs.getConcept(5089));  // Weight concept
weightObs.setValueNumeric(65.5);  // 65.5 kg
weightObs.setObsDatetime(new Date());
weightObs.setLocation(encounter.getLocation());

os.saveObs(weightObs, null);
```

**Coded Observation (Multiple Choice)**
```
Concept bloodTypeQuestion = cs.getConcept(1000);  // Blood Type question
Concept bloodTypeA = cs.getConcept(1001);  // Answer: Blood Type A

Obs bloodTypeObs = new Obs();
bloodTypeObs.setPerson(patient);
bloodTypeObs.setEncounter(encounter);
bloodTypeObs.setConcept(bloodTypeQuestion);
bloodTypeObs.setValueCoded(bloodTypeA);  // Answer
bloodTypeObs.setObsDatetime(new Date());
bloodTypeObs.setLocation(encounter.getLocation());

os.saveObs(bloodTypeObs, null);
```

**Text Observation**
```
Concept clinicalNotesQuestion = cs.getConcept(1002);

Obs notesObs = new Obs();
notesObs.setPerson(patient);
notesObs.setEncounter(encounter);
notesObs.setConcept(clinicalNotesQuestion);
notesObs.setValueText("Patient complains of fever and headache for 3 days");
notesObs.setObsDatetime(new Date());

os.saveObs(notesObs, null);
```

### Concept Sets (Grouping Concepts)

**Use Case**: Group related concepts (e.g., vital signs, lab panel)

**Example: Vital Signs Concept Set**
- Vital Signs (set)
  - Weight
  - Height
  - Temperature
  - Blood Pressure
  - Heart Rate

**Querying Concept Set Members**
```
Concept vitalSignsSet = cs.getConcept(5000);
List<Concept> vitalSignsConcepts = cs.getConceptsByConceptSet(vitalSignsSet);
// Returns: [Weight, Height, Temperature, BP, HR]
```

---

## Patient Identifiers System

### Identifier Types

**PatientIdentifierType**: Defines types of IDs (Ghana Card, NHIS, Folder Number)

**Creating Identifier Types**
```
PatientService ps = Context.getPatientService();

PatientIdentifierType ghanaCardType = new PatientIdentifierType();
ghanaCardType.setName("Ghana Card");
ghanaCardType.setDescription("National Identification Number");
ghanaCardType.setFormat("GHA-\\d{9}-\\d");  // Regex format
ghanaCardType.setRequired(true);  // Required for new patients
ghanaCardType.setCheckDigit(false);

ps.savePatientIdentifierType(ghanaCardType);
```

### Assigning Identifiers to Patients

**Pattern: Add Identifier**
```
Patient patient = new Patient();
// Set patient demographics...

// Ghana Card identifier
PatientIdentifierType ghanaCardType = ps.getPatientIdentifierTypeByName("Ghana Card");
PatientIdentifier ghanaCardId = new PatientIdentifier();
ghanaCardId.setIdentifierType(ghanaCardType);
ghanaCardId.setIdentifier("GHA-123456789-1");
ghanaCardId.setLocation(location);
ghanaCardId.setPreferred(true);  // Primary identifier
patient.addIdentifier(ghanaCardId);

// NHIS identifier
PatientIdentifierType nhisType = ps.getPatientIdentifierTypeByName("NHIS Number");
PatientIdentifier nhisId = new PatientIdentifier();
nhisId.setIdentifierType(nhisType);
nhisId.setIdentifier("GA01-1234567");
nhisId.setLocation(location);
patient.addIdentifier(nhisId);

ps.savePatient(patient);
```

### Searching Patients by Identifier

**Pattern: Find by Identifier**
```
List<Patient> patients = ps.getPatients(
    null,                    // name
    "GHA-123456789-1",      // identifier
    null,                    // identifier type
    true                     // match identifier exactly
);
```

---

## Encounter and Visit System

### Encounter Structure

**Encounter**: A clinical interaction between patient and provider
- Has: Patient, EncounterType, Location, EncounterDatetime, Provider(s), Observations

**EncounterType**: Categorizes encounters
- Examples: OPD Consultation, Admission, Discharge, Lab Visit, Pharmacy Visit

**Visit**: Groups related encounters
- Example: Hospital admission (one visit) with multiple encounters (admission note, daily rounds, discharge)

### Creating Encounters

**Pattern: Create OPD Encounter**
```
EncounterService es = Context.getEncounterService();
LocationService ls = Context.getLocationService();

Encounter opdEncounter = new Encounter();
opdEncounter.setPatient(patient);
opdEncounter.setEncounterType(es.getEncounterTypeByName("OPD Consultation"));
opdEncounter.setLocation(ls.getLocation("Korle Bu Teaching Hospital"));
opdEncounter.setEncounterDatetime(new Date());

// Add provider
Provider provider = Context.getProviderService().getProvider(1);
EncounterProvider ep = new EncounterProvider();
ep.setEncounter(opdEncounter);
ep.setProvider(provider);
ep.setEncounterRole(es.getEncounterRole(1));  // e.g., "Clinician"
opdEncounter.addProvider(ep);

// Save encounter
es.saveEncounter(opdEncounter);
```

### Adding Observations to Encounter

**Pattern: Batch Observations**
```
// Create encounter
Encounter enc = new Encounter();
// ... set encounter properties ...

// Add observations
ObsService os = Context.getObsService();

// Weight
Obs weight = new Obs();
weight.setConcept(cs.getConcept(5089));
weight.setValueNumeric(65.5);
weight.setObsDatetime(enc.getEncounterDatetime());
weight.setLocation(enc.getLocation());
enc.addObs(weight);

// Temperature
Obs temp = new Obs();
temp.setConcept(cs.getConcept(5088));
temp.setValueNumeric(38.5);
temp.setObsDatetime(enc.getEncounterDatetime());
temp.setLocation(enc.getLocation());
enc.addObs(temp);

// Save encounter (saves observations too)
es.saveEncounter(enc);
```

---

## Orders System

### Order Types

**Order**: Represents a clinical order (drug prescription, lab test, imaging)

**OrderType**:
- Drug Order - Medications
- Test Order - Lab tests, imaging
- Other - Procedures, referrals

### Creating Drug Orders

**Pattern: Prescribe Medication**
```
OrderService orderService = Context.getOrderService();

DrugOrder drugOrder = new DrugOrder();
drugOrder.setPatient(patient);
drugOrder.setEncounter(encounter);
drugOrder.setOrderType(orderService.getOrderTypeByName("Drug Order"));
drugOrder.setConcept(cs.getConceptByName("Artemether-Lumefantrine"));
drugOrder.setDrug(conceptService.getDrugByName("Artemether-Lumefantrine 20/120mg"));
drugOrder.setDose(4.0);  // 4 tablets
drugOrder.setDoseUnits(cs.getConcept(1513));  // "tablets"
drugOrder.setFrequency(orderService.getOrderFrequencyByName("Twice daily"));
drugOrder.setRoute(cs.getConcept(1540));  // "Oral"
drugOrder.setDuration(3);  // 3 days
drugOrder.setDurationUnits(cs.getConcept(1072));  // "days"
drugOrder.setOrderer(Context.getProviderService().getProvider(1));
drugOrder.setDateActivated(new Date());

orderService.saveOrder(drugOrder, null);
```

### Creating Test Orders

**Pattern: Order Lab Test**
```
TestOrder labOrder = new TestOrder();
labOrder.setPatient(patient);
labOrder.setEncounter(encounter);
labOrder.setOrderType(orderService.getOrderTypeByName("Test Order"));
labOrder.setConcept(cs.getConceptByName("Hemoglobin"));
labOrder.setOrderer(Context.getProviderService().getProvider(1));
labOrder.setDateActivated(new Date());
labOrder.setUrgency(Order.Urgency.ROUTINE);

orderService.saveOrder(labOrder, null);
```

---

## Location and Facility System

### Location Hierarchy

**Location**: Represents physical places
- Country (Ghana)
  - Region (Greater Accra)
    - District (Accra Metropolitan)
      - Facility (Korle Bu Teaching Hospital)
        - Building (OPD Block)
          - Room (Consultation Room 1)

### Working with Locations

**Pattern: Get Facility Location**
```
LocationService ls = Context.getLocationService();

Location facility = ls.getLocation("Korle Bu Teaching Hospital");
```

**Pattern: Create Location Hierarchy**
```
// Region
Location region = new Location();
region.setName("Greater Accra Region");
region.setDescription("Greater Accra Region of Ghana");
ls.saveLocation(region);

// Facility
Location facility = new Location();
facility.setName("Korle Bu Teaching Hospital");
facility.setParentLocation(region);
facility.setAddress1("Korle Bu");
facility.setStateProvince("Greater Accra");
facility.setCountry("Ghana");
ls.saveLocation(facility);
```

---

## Person Attributes System

### Custom Patient Data

**PersonAttribute**: Extends patient/person data beyond standard fields

**Use Cases**:
- NHIS number
- Ghana Card number
- Ethnicity
- Occupation
- Next of kin
- Phone number

### Working with Person Attributes

**Pattern: Create Attribute Type**
```
PersonService personService = Context.getPersonService();

PersonAttributeType nhisAttributeType = new PersonAttributeType();
nhisAttributeType.setName("NHIS Number");
nhisAttributeType.setDescription("National Health Insurance Scheme Number");
nhisAttributeType.setFormat("java.lang.String");
nhisAttributeType.setSearchable(true);

personService.savePersonAttributeType(nhisAttributeType);
```

**Pattern: Add Attribute to Patient**
```
Patient patient = ps.getPatient(123);

PersonAttributeType nhisType = personService.getPersonAttributeTypeByName("NHIS Number");
PersonAttribute nhisAttribute = new PersonAttribute();
nhisAttribute.setAttributeType(nhisType);
nhisAttribute.setValue("GA01-1234567");

patient.addAttribute(nhisAttribute);
ps.savePatient(patient);
```

**Pattern: Query Attribute Value**
```
Patient patient = ps.getPatient(123);
PersonAttribute nhisAttr = patient.getAttribute("NHIS Number");
if (nhisAttr != null) {
    String nhisNumber = nhisAttr.getValue();
}
```

---

## Form Engine (HTML Form Entry)

### HTML Form Entry Module

**Purpose**: Create data entry forms using XML with HTML-like syntax

**Pattern: Basic Form Structure**
```xml
<htmlform>
    <section>
        <h3>Vital Signs</h3>
        <table>
            <tr>
                <td>Weight (kg):</td>
                <td><obs conceptId="5089" /></td>
            </tr>
            <tr>
                <td>Height (cm):</td>
                <td><obs conceptId="5090" /></td>
            </tr>
            <tr>
                <td>Temperature (°C):</td>
                <td><obs conceptId="5088" /></td>
            </tr>
            <tr>
                <td>Blood Pressure:</td>
                <td><obs conceptId="5085" /> / <obs conceptId="5086" /> mmHg</td>
            </tr>
        </table>
    </section>
    
    <section>
        <h3>Diagnosis</h3>
        <obs conceptId="1284" answerConceptIds="116128,160148,117399" style="dropdown" />
    </section>
    
    <submit />
</htmlform>
```

**Key Tags**:
- `<obs>` - Observation field
- `<encounterDate>` - Encounter date
- `<encounterLocation>` - Location dropdown
- `<encounterProvider>` - Provider dropdown
- `<submit>` - Save button

---

## Event Listener System

### Event-Driven Architecture

**Use Case**: Trigger actions when data changes (e.g., submit to NHIE when encounter saved)

**Pattern: Encounter Created Listener**
```
@Component
public class NHIEEncounterListener implements ApplicationEventListener {
    
    @Override
    public void onApplicationEvent(ApplicationEvent event) {
        if (event instanceof EncounterCreatedEvent) {
            EncounterCreatedEvent encounterEvent = (EncounterCreatedEvent) event;
            Encounter encounter = encounterEvent.getEncounter();
            
            // Submit to NHIE
            submitEncounterToNHIE(encounter);
        }
    }
    
    private void submitEncounterToNHIE(Encounter encounter) {
        // NHIE submission logic
    }
}
```

---

## Module Development

### Module Structure

**Required Files**:
- `config.xml` - Module metadata
- `moduleApplicationContext.xml` - Spring bean configuration
- `liquibase.xml` - Database schema changes

**Pattern: config.xml**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<module configVersion="1.2">
    <id>ghana-nhie-integration</id>
    <name>Ghana NHIE Integration</name>
    <version>1.0.0</version>
    <package>org.openmrs.module.ghananhie</package>
    <author>Your Name</author>
    <description>NHIE integration for Ghana EMR</description>
    
    <require_modules>
        <require_module version="2.0.0">org.openmrs.module.fhir2</require_module>
    </require_modules>
    
    <privileges>
        <privilege>
            <name>Submit NHIE Transactions</name>
            <description>Ability to submit data to NHIE</description>
        </privilege>
    </privileges>
</module>
```

---

## Common Pitfalls and Solutions

### Pitfall 1: Using @Autowired Instead of Context

**Problem**: Service is null
**Solution**: Use `Context.getService()` pattern

### Pitfall 2: Not Checking Voided/Retired Status

**Problem**: Deleted data appearing in queries
**Solution**: Use `includeVoided=false` parameter in service calls

### Pitfall 3: Forgetting to Set Required Fields

**Problem**: Hibernate validation errors
**Required fields**:
- Encounter: patient, encounterType, encounterDatetime, location
- Obs: person, concept, obsDatetime, location
- Patient: gender, at least one name, at least one identifier

### Pitfall 4: Not Setting Location on Observations

**Problem**: Observations fail to save
**Solution**: Always set `obs.setLocation(encounter.getLocation())`

### Pitfall 5: Concept Not Found

**Problem**: Concept by name returns null
**Solution**: Use concept UUIDs (stable across systems) or concept IDs from CIEL

---

## Testing Patterns

### Unit Testing Services

**Pattern: Test with Context Mock**
```java
@Test
public void shouldSubmitEncounterToNHIE() {
    // Arrange
    Encounter encounter = new Encounter();
    // ... set up encounter ...
    
    // Mock Context
    PowerMockito.mockStatic(Context.class);
    when(Context.getEncounterService()).thenReturn(mockEncounterService);
    
    // Act
    nhieService.submitEncounter(encounter);
    
    // Assert
    verify(mockNHIEClient).post(any());
}
```

### Integration Testing

**Pattern: Use OpenMRS Test Framework**
```java
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = {"classpath:applicationContext-service.xml"})
public class GhanaNHIEServiceIntegrationTest extends BaseModuleContextSensitiveTest {
    
    @Test
    public void shouldCreatePatientInNHIE() {
        // Test with real OpenMRS services
        PatientService ps = Context.getPatientService();
        Patient patient = ps.getPatient(2);
        
        // Test NHIE integration
        String nhieId = ghanaService.registerPatient(patient);
        assertNotNull(nhieId);
    }
}
```

---

## Performance Optimization

### Lazy Loading and Hibernate Sessions

**Problem**: LazyInitializationException
**Solution**: Open session in view pattern or eager fetch

**Pattern: Eager Fetch**
```
Patient patient = ps.getPatient(123);
Hibernate.initialize(patient.getIdentifiers());
Hibernate.initialize(patient.getAttributes());
```

### Batch Operations

**Pattern: Batch Save Observations**
```
List<Obs> obsList = new ArrayList<>();
// Add observations to list...

for (Obs obs : obsList) {
    os.saveObs(obs, null);
}

// Or use batch save if available
```

---

## Configuration and Global Properties

### Global Properties

**Purpose**: Store configuration values

**Pattern: Set Global Property**
```
AdministrationService as = Context.getAdministrationService();
as.setGlobalProperty("ghana.nhie.endpoint", "https://nhie.moh.gov.gh/fhir");
```

**Pattern: Get Global Property**
```
String nhieEndpoint = as.getGlobalProperty("ghana.nhie.endpoint");
```

---

## Summary for Developers

**Critical Patterns to Remember**:
1. Always use `Context.getService()` instead of `@Autowired`
2. Check privileges before sensitive operations
3. Extend correct base class (BaseOpenmrsData vs BaseOpenmrsMetadata)
4. Use voiding/retiring instead of hard deletes
5. Always set required fields (location, datetime, etc.)
6. Use Concept UUIDs for portability
7. Person attributes for custom patient data
8. Event listeners for integration triggers
9. HTML Form Entry for data capture forms
10. Global properties for configuration

**OpenMRS is NOT**:
- Standard Spring Boot (uses Context, not DI)
- Standard JPA (uses Hibernate directly with custom patterns)
- Stateless REST API (has session and transaction management)

**OpenMRS IS**:
- Domain-driven (Patient, Encounter, Obs, Concept as core)
- Event-driven (listeners for integration)
- Modular (extend via modules, not core modifications)
- Privilege-based (always check permissions)
- Concept-centric (everything references Concept dictionary)
