Building a Ghana‑Ready EMR on OpenMRS
This guide collects official documentation and developer resources for building an electronic medical record (EMR) solution on top of OpenMRS. The goal is to help you implement an EMR that meets Ghana’s requirements for interoperability, state control, offline capability, security and customization. Each recommendation is backed by published documentation and includes links for deeper exploration.
1. Overview of OpenMRS
OpenMRS is an open‑source platform and reference application for medical record systems. Its modular architecture allows implementers to add or remove functionality without modifying the core code. OpenMRS can be deployed as a standalone server (with embedded database and web server) or as an enterprise installation (running on Apache Tomcat and MySQL)[1].
•	Open Source Licence: OpenMRS is released under the Mozilla Public Licence (MPL‑2.0). There are no licence fees for the software itself, but you must budget for installation, customization, hosting and support.
•	Modular Design: Core functionality can be extended via modules written in Java. Modules can be added, upgraded or removed without changing the core code.
•	Customization: You can tailor data models, forms, workflows and integrations to local requirements through concept dictionaries, forms and custom modules.
2. Installation and Initial Setup
2.1 Prerequisites
•	Java: You need Java 6 or higher; for OpenMRS Platform 2.0+ (including the community’s Reference Application 2.5+), Java 8 or higher is required[2].
•	Database/Web Server: The standalone distribution includes its own database (H2) and web server. The enterprise distribution requires an external Apache Tomcat server and MySQL database[3].
2.2 Standalone Installation (small facilities)
1.	Download: Obtain the standalone zip file from download.openmrs.org. Decompress it without renaming any files[4].
2.	Launch: Double‑click the openmrs-standalone.jar file or run java -jar openmrs-standalone.jar on the command line[5]. On Linux you may run run-on-linux.sh[6].
3.	Demo Data: During setup you can install a sample concept dictionary and sample patient data[7].
4.	Login: The default username/password is admin/Admin123; you must change this immediately through My Profile → Change Login Info[8].
5.	Ports: The standalone application runs MySQL on port 3316 and Tomcat on port 8081; you can change these ports by editing the openmrs-standalone-runtime.properties file or passing command‑line parameters[9].
2.3 Enterprise Installation (large facilities)
1.	Install Tomcat and MySQL: Set up Apache Tomcat and MySQL before installing OpenMRS[10].
2.	Deploy the WAR: Download openmrs.war from download.openmrs.org. In the Tomcat Web Application Manager (http://localhost:8080/manager/html) upload and deploy the WAR file[11].
3.	Run Setup Wizard: After deployment, access http://localhost:8080/openmrs and follow the setup wizard to configure the database and populate test data[12].
4.	Application Data Directory: Configuration properties are stored under ~/.OpenMRS on Linux/macOS or in the Application Data directory on Windows[13].
3. Data Model and Concept Dictionary
3.1 Concept Dictionary Basics
At the heart of every OpenMRS implementation is a concept dictionary. It defines the medical concepts (questions and answers) used as building blocks for forms, orders, clinical summaries and reports[14]. The concept dictionary must be expandable, because implementers often start with a core set of concepts and add new terms as clinicians document new conditions[15].
•	Fundamental Structure: The concept dictionary defines names, codes and attributes for observations and data, similar to columns in a spreadsheet[16]. Each concept can be a question or an answer[17].
•	Encounters and Observations: Encounters represent specific interactions (e.g., clinic visits). Each encounter can contain many observations, and each observation corresponds to a concept[18]. When designing forms, you will need to define both the questions and possible answers as concepts.
3.2 Managing Concepts
Use the Manage Concept Dictionary tool (under Configure Metadata) to view, search, create and edit concepts[19]. For Ghana‑specific workflows, you should define concepts for NHIS claims, local disease terms and referral workflows. You can import existing concept dictionaries such as the CIEL dictionary or create your own concepts.
4. Form Design and Data Collection
OpenMRS supports several form technologies. The HTML Form Entry module (included in the default distribution) provides a simple way to create data entry forms using HTML tags[20].
4.1 Basic Structure
Every HTML form must include minimal elements such as encounter date, location, provider and observation(s) within <htmlform> tags[21]. It is convenient to place these elements in a reusable header section[22].
4.2 Steps to Build Forms
1.	Identify and Create Concepts: Before building a form you must ensure that all reference concepts exist in the concept dictionary[23].
2.	Create the Form: Navigate to Administration → Manage HTML Forms and choose New Form. Enter a name and basic information, then save the form[24].
3.	Design the Layout: Use standard HTML to structure the form to resemble your paper form[25]. You can use tables, lists or other tags.
4.	Insert Observation Tags: For each question on the form, add an <obs> tag referencing the concept ID[26]. The HTML Form Entry module provides tags for different datatypes (dates, booleans, coded values, multi‑select checkboxes, etc.)[27]. See the HTML Form Entry reference for a complete list of supported tags.
5. User Management and Access Control
OpenMRS uses a role‑based access control (RBAC) system to manage access. Privileges define specific actions (e.g., Edit Patients or Add Users), and roles group one or more privileges together[28]. Roles can inherit privileges from other roles[29].
5.1 Designing Roles and Privileges
•	Define roles for each category of user (e.g., Medical Student, Data Assistant, Data Manager). Assign appropriate privileges such as View Patients, Edit Patients and Add Patients[30].
•	Roles can inherit privileges from other roles; for example, a Data Manager can inherit all privileges of a Data Assistant and add the privilege to add patients[31].
•	Create composite roles (e.g., Patient Data Viewer) when multiple roles share the same privileges[32].
5.2 Built‑in Roles
OpenMRS includes built‑in roles such as Anonymous, Authenticated and System Developer[33]. Privileges granted to Anonymous apply to everyone, so keep them minimal[34]. The System Developer role automatically has full privileges and should only be assigned to system administrators[35].
5.3 Managing Users and Providers
Administrators create roles via Administration → Manage Roles[36] and create users via Administration → Manage Users[37]. Providers (people delivering care) must be explicitly identified via Administration → Providers; every encounter must reference one or more providers[38].
6. Developing Custom Modules
To add Ghana‑specific functionality (e.g., NHIS claims, billing or referral workflows), you can develop custom modules in Java.
6.1 Using the OpenMRS SDK
The OpenMRS SDK provides a Maven archetype for creating modules. Run the following command:
mvn openmrs-sdk:create-project
During the wizard you choose whether to create a platform module (runs on any OpenMRS server) or a Reference Application module (requires the reference application)[39]. You provide the module ID, name, description, groupId, version and platform support[40]. The SDK generates a project with two sub‑modules:
•	api: Non‑web Java classes compiled into a JAR[41].
•	omod: Web layer containing controllers, servlets, JSPs, resources, configuration and metadata. It produces an .omod file[42].
6.2 Building and Deploying
Navigate into the module directory and run:
mvn clean install
This command builds the module, runs unit tests and packages the compiled code into an .omod file[43]. To skip tests use mvn clean install -Dmaven.test.skip=true[44].
To install the module:
1.	Open the OpenMRS administration UI (http://localhost:8080/openmrs/admin/).
2.	Click Manage Modules, then Add or Upgrade Module.
3.	Browse to your .omod file and upload it[45].
4.	Alternatively, copy the .omod file into the ~/.OpenMRS/modules directory and restart OpenMRS[46].
6.3 Customizing Modules
The SDK includes a basic ModuleActivator class. You can add fields, services and controllers to implement your Ghana‑specific features (e.g., NHIS eligibility checks, claims submission or referral management). Follow the developer manual for details on extending data models, updating Hibernate mappings and adding REST endpoints.
7. Interoperability and APIs
7.1 OpenMRS REST API
OpenMRS exposes a comprehensive REST API under /openmrs/ws/rest/v1. The API provides CRUD operations for users, roles, privileges, persons, patients, encounters, observations and more[47]. Key points include:
•	Purpose: The REST API documentation provides new developers with a concise overview and examples to help them onboard[48].
•	Transport: All API access is over HTTPS and uses JSON payloads[49].
•	Authentication: Use Basic authentication or a session token to authenticate. The API includes endpoints for retrieving a session token and logging out.
•	Versioning: By default all requests receive version v1 of the REST API[50]. Swagger documentation is available on the demo server for exploration[51].
The REST API is useful for integrating your EMR with NHIS claim systems, mobile apps or external reporting tools.
7.2 FHIR Integration
OpenMRS supports HL7 FHIR for standardised interoperability. The FHIR2 module was developed to enable export of FHIR resources[52]. According to the FHIR Implementation Guide, the current FHIR2 module supports exporting the following resource types[53]:
•	Patient
•	Person
•	Practitioner
•	Observation
•	Location
•	AllergyIntolerance
•	Condition
•	DiagnosticReport
•	Encounter
•	Medication, MedicationRequest, MedicationDispense
•	ServiceRequest
•	Task
•	Group
•	Immunization
•	RelatedPerson
The FHIR guide notes that FHIR is an HL7 standard for representing healthcare information electronically[54], and OpenMRS uses FHIR to enhance interoperability[55]. The guide provides a summary and links to the full specification and licensing considerations[56].
For Ghana, FHIR integration means you can build a National Health Information Exchange (NHIE) bridge that exposes OpenMRS patient and encounter data via FHIR resources to external systems (e.g., NHIS claims, referral networks). You may need to develop a custom module to convert local concept mappings into FHIR codes (e.g., ICD‑10, SNOMED CT). Always review licensing restrictions for external terminologies[57].
8. Offline and Local Hosting Options
The OpenMRS community recognises that many implementers have unreliable or no internet connectivity. The Offline & Internet Connection FAQ explains that:
•	OpenMRS 3 (O3) can operate without internet when installed on a local device[58]. Implementers often use laptops with their own power source[59].
•	OpenMRS can run on a local area network (LAN) without a cloud connection[60]. Support for handling flaky LAN/WAN connections is being improved for OpenMRS 3.3+[61].
•	The application can be hosted on an intranet, government cloud or commercial cloud[62].
•	When the internet drops, you can switch to a local device and later synchronise back to the central server[63]. This process can be automated, eliminating manual database replication[64].
These capabilities are essential for rural Ghanaian clinics. Design your deployment to include local servers or tablets that sync with a central server once connectivity returns. If you need community outreach capabilities, consider integrating with specialised community health worker (CHW) apps[65].
9. Security and Compliance
OpenMRS provides security features through RBAC and encourages implementers to follow the Minimum Baseline Security Standard (MBSS). The MBSS document outlines core security principles and best practices[66].
•	Scope: The MBSS covers network security, server hardening, data protection, authentication, authorization and application/API security[67].
•	Security Principles: It emphasises confidentiality (protecting sensitive data), integrity (ensuring accuracy and preventing tampering) and availability (ensuring systems are accessible when needed)[68].
•	Areas of Focus: Operating system configurations, system security architecture, accountability, access control, data security/privacy, third‑party security and API security[69].
When implementing your EMR for Ghana, align with these guidelines and Ghana’s Data Protection Act. Use encryption (e.g., HTTPS, database encryption), secure server configurations, strong passwords, regular patching and audit trails. Implement modules such as Data Filter or Audit Log to restrict data by location or track changes.
10. Implementation Tips for Ghana
•	Custom Ghana Modules: Use the OpenMRS SDK to create modules for NHIS eligibility checks, claims submission, referral tracking, and local billing. Map local codes to the concept dictionary and FHIR resources.
•	Interoperability: Leverage the FHIR2 module to connect with Ghana’s NHIE. Build a middleware service that converts OpenMRS data into FHIR resources and integrates with NHIS APIs. Use the REST API for non‑FHIR integrations (e.g., dashboards or mobile apps).
•	Concept Dictionary Management: Start with a core concept dictionary (e.g., CIEL) and expand it for Ghana‑specific terms. Define concepts for NHIS claim types, referral reasons, disease classifications and local language names. Use the Dictionary Manager or Open Concept Lab for collaborative management.
•	Offline Deployment: For rural clinics, deploy OpenMRS on local servers or tablets that can run offline and sync later[70]. Use the offline features in O3 or build a sync module if you are using the reference application.
•	Security Compliance: Follow the MBSS guidelines[66]. Use RBAC to restrict data access[71]; create roles for clinicians, administrators and data clerks; limit anonymous privileges[72]. Encrypt data in transit (HTTPS) and at rest (database encryption) and maintain audit logs.
•	Training and Change Management: Train staff on how to use forms, manage users, and maintain the concept dictionary. Provide documentation for local administrators to modify roles and privileges and to deploy upgrades.
11. Key Links and Resources
Resource	Description
Installation & Setup Guide
Official installation instructions for standalone and enterprise deployments[3].

OpenMRS Developer Manual
Detailed guide on module development, SDK usage and case studies[73].

HTML Form Entry Guide
Instructions for designing data entry forms[74].

Concept Dictionary Basics
Introduction to concepts and metadata[19].

User Management & Access Control
Roles, privileges and user administration[71].

OpenMRS REST API Documentation
Interactive documentation for the REST endpoints[75].

OpenMRS FHIR Implementation Guide
FHIR resources supported by the FHIR2 module[76].

Offline & Connectivity FAQs
Guidance on using OpenMRS offline or on local networks[70].

Minimum Baseline Security Standard
Security best practices and compliance considerations[66].

Conclusion
OpenMRS provides a robust platform for building a Ghana‑compliant EMR. By following the installation instructions, leveraging the concept dictionary, designing HTML forms, implementing role‑based security, developing custom modules and integrating through FHIR/REST, you can build a system that meets national requirements for interoperability, data sovereignty, offline functionality and security. Always refer to the latest documentation and engage with the OpenMRS community to stay up to date and contribute improvements.
________________________________________
[1] [2] [3] [4] [5] [6] [7] [8] [9] [10] [11] [12] [13] Installation and Initial Setup
https://guide.openmrs.org/getting-started/installation-and-initial-setup/
[14] [15] [16] [17] [18] [19] Concept Dictionary Basics - Documentation - OpenMRS Wiki
https://openmrs.atlassian.net/wiki/spaces/docs/pages/25475255/Concept+Dictionary+Basics
[20] [21] [22] [23] [24] [25] [26] [27] [74] HTML Forms
https://guide.openmrs.org/collecting-data/html-forms/
[28] [29] [30] [31] [32] [33] [34] [35] [36] [37] [38] [71] [72] User Management and Access Control
https://guide.openmrs.org/administering-openmrs/user-management-and-access-control/
[39] [40] [41] [42] [43] [44] [45] [46] [73] Creating Your First Module
https://devmanual.openmrs.org/case_study/yourfirstmodule/
[47] [48] [49] [50] [51] [75] OpenMRS Docs
https://rest.openmrs.org/
[52] [53] [54] [55] [56] [57] [76] Home - OpenMRS Core FHIR Implementation Guide v0.1.0
https://fhir.openmrs.org/
[58] [59] [60] [61] [62] [63] [64] [65] [70] Offline and Internet Connection FAQs - Documentation - OpenMRS Wiki
https://openmrs.atlassian.net/wiki/spaces/docs/pages/152731650/Offline+and+Internet+Connection+FAQs
[66] [67] [68] [69] OpenMRS Wiki
https://openmrs.atlassian.net/wiki/spaces/docs/pages/216530945/Minimum+Baseline+Security+Standard+for+OpenMRS+MBSS
