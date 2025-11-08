# Developer's Cookbook

This document provides practical, step-by-step recipes for common development tasks in the Ghana EMR project.

---

## <a name="creating-a-new-service"></a>Recipe: Creating a New Service

This recipe shows how to create a new service layer component in the OpenMRS module, following the project's established patterns.

1.  **Define the Interface:**
    -   In `backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/`, create a new Java interface.
    -   Example: `public interface OPDConsultationService extends OpenmrsService { ... }`

2.  **Create the Implementation:**
    -   In `backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/impl/`, create the implementation class.
    -   It should implement your new interface.
    -   Annotate the class with `@Service`.
    -   Example: `@Service("ghanaemr.OPDConsultationService") public class OPDConsultationServiceImpl extends BaseOpenmrsService implements OPDConsultationService { ... }`

3.  **Add to `moduleApplicationContext.xml`:**
    -   In `omod/src/main/resources/moduleApplicationContext.xml`, register your new service so Spring can manage it.
    -   `<bean id="ghanaemr.OPDConsultationService" class="org.openmrs.module.ghanaemr.api.impl.OPDConsultationServiceImpl" />`

4.  **Use the Service:**
    -   In your controllers or other services, inject the service using `@Autowired` and `@Qualifier`.
    -   `@Autowired @Qualifier("ghanaemr.OPDConsultationService") private OPDConsultationService consultationService;`

---

## Recipe: Adding a new Report

*(To be added)*

---

## Recipe: Extending a Form

*(To be added)*

*(This document will be updated with more recipes as patterns emerge.)*
