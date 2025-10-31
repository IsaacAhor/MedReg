# Ghana EMR Project: Team Structure and Roles

## Overview

Building a production-ready OpenMRS-based EMR for Ghana requires a multidisciplinary team with specific expertise. This document defines optimal team composition, roles, responsibilities, and hiring criteria.

**Project Scope**: NHIE-compliant EMR for 10-50 facilities over 12-18 months
**Development Approach**: Agile with AI-assisted development
**Team Philosophy**: Lean but expert, quality over quantity

---

## Core Team Structure (Minimum Viable Team)

### Team Size Options

**Option A: Minimal Team (6 people) - Bootstrap Phase**
- Best for: Pilot facilities, proof of concept, initial 6 months
- Budget: ~$50,000 for 6 months
- Risk: Limited capacity, dependency on key people
- Timeline: 6-7 months for MVP

**Option B: Optimal Team (8-11 people) - Scale Phase**
- Best for: 10+ facilities, production deployment
- Budget: ~$80,000 for 6 months
- Risk: Moderate, some redundancy
- Timeline: 4-6 months for MVP

**Option C: Full Team (12-15 people) - Rapid Scale**
- Best for: National deployment, 50+ facilities
- Budget: ~$120,000+ for 6 months
- Risk: Low, full redundancy, faster delivery
- Timeline: 3-4 months for MVP

---

## Role Definitions and Responsibilities

### 1. Technical Lead / OpenMRS Architect

**Criticality**: MANDATORY - Make or break role
**Experience Required**: 5+ years OpenMRS development, 3+ healthcare projects
**Location**: Can be remote initially, relocate to Ghana for deployment

**Responsibilities**
- Overall technical architecture and design decisions
- OpenMRS platform expertise and module development
- NHIE integration design and implementation
- Code review and quality assurance
- Mentoring junior developers
- Technical documentation
- Vendor relationship with OpenMRS community

**Key Skills**
- Expert-level Java (Spring, Hibernate)
- Deep OpenMRS platform knowledge (Context pattern, concept dictionary, data model)
- HL7 FHIR R4 implementation experience
- Healthcare interoperability (IHE profiles, HIE architecture)
- HAPI FHIR library
- REST API design
- Database optimization (MySQL)
- Git version control

**Desired Background**
- Previous work on Kenya HIE, Rwanda OpenMRS, or similar African implementations
- OpenHIE architecture familiarity
- OpenMRS community contributions (GitHub, JIRA, Talk forum)
- Experience with large-scale (100,000+ patient) OpenMRS deployments

**Salary Range**: $3,000-$5,000/month (depends on location, experience)

**Hiring Strategy**
- Network through OpenMRS community (talk.openmrs.org)
- Contact Kenya HIE implementers (Palladium, IntraHealth)
- LinkedIn search: "OpenMRS" + "FHIR" + "Kenya OR Rwanda"
- Post on OpenMRS Jobs board

---

### 2. Backend Developers (2-3 people)

**Criticality**: HIGH - Core development capacity
**Experience Required**: 3+ years Java/Spring, 1+ year OpenMRS (or willing to learn)
**Location**: Ghana preferred (local talent development)

**Responsibilities**
- Implement NHIE adapter module (OAuth, FHIR conversion, retry logic)
- Ghana-specific module development (NHIS integration, folder number generation, Ghana Card validation)
- Custom OpenMRS services and APIs
- Database schema extensions (Liquibase migrations)
- Unit and integration testing
- Bug fixing and maintenance

**Key Skills**
- Strong Java (Spring Boot, Hibernate/JPA)
- REST API development
- JSON/XML processing
- SQL and database design (MySQL/PostgreSQL)
- Git version control
- JUnit testing
- Maven/Gradle build tools

**Nice to Have**
- Previous OpenMRS exposure
- Healthcare domain knowledge
- FHIR resource experience
- Message queue systems (RabbitMQ, Kafka)

**Salary Range**: $1,200-$2,000/month (Ghana market rate)

**Hiring Strategy**
- Ghana tech hubs (Accra, Kumasi)
- Universities (KNUST, University of Ghana computer science graduates)
- Local job boards (JobSearch Ghana, Tonaton Jobs)
- Developer meetups and communities

---

### 3. Frontend Developer (1 person)

**Criticality**: MEDIUM-HIGH - User experience critical for adoption
**Experience Required**: 3+ years React, 1+ year healthcare or complex domain
**Location**: Ghana or remote

**Responsibilities**
- OpenMRS 3 (O3) microfrontend development
- Ghana-specific UI modules (patient registration, NHIS verification, claims submission)
- Responsive design for tablets and desktops
- Offline-capable UI (service workers, local storage)
- Localization (English, Twi, Ga, Ewe)
- Accessibility compliance (WCAG 2.1)
- User acceptance testing support

**Key Skills**
- Expert React (hooks, context, state management)
- TypeScript
- OpenMRS 3 framework (if available, or willing to learn)
- CSS/Sass (responsive design)
- REST API consumption
- Progressive Web Apps (PWA)
- Git version control

**Nice to Have**
- OpenMRS O3 experience
- Healthcare UI/UX patterns
- Internationalization (i18n)
- Webpack/Vite build tools

**Salary Range**: $1,500-$2,500/month

**Hiring Strategy**
- Ghana frontend developer communities
- Remote hiring (international if needed)
- Freelance platforms (Upwork, Toptal) for short-term if budget constrained

---

### 4. DevOps Engineer (1 person)

**Criticality**: HIGH - Infrastructure and deployment automation
**Experience Required**: 3+ years DevOps, cloud infrastructure, CI/CD
**Location**: Ghana or remote

**Responsibilities**
- Infrastructure as code (Terraform, Ansible)
- CI/CD pipeline setup (Jenkins, GitLab CI, GitHub Actions)
- Container orchestration (Docker, Kubernetes)
- Server provisioning and configuration (Ubuntu, MySQL, Nginx/Apache)
- Backup and disaster recovery automation
- Monitoring and alerting (Prometheus, Grafana, ELK stack)
- Security hardening (firewall, SSL/TLS, intrusion detection)
- Offline sync infrastructure
- Performance tuning

**Key Skills**
- Linux system administration (Ubuntu Server preferred)
- Docker and Kubernetes
- CI/CD tools (Jenkins, GitLab CI)
- Infrastructure as code (Terraform, Ansible)
- Cloud platforms (AWS, Azure, Google Cloud)
- Database administration (MySQL)
- Nginx/Apache configuration
- Bash/Python scripting
- Git version control

**Nice to Have**
- OpenMRS deployment experience
- Healthcare system security standards
- Multi-site deployment at scale
- Low-bandwidth optimization

**Salary Range**: $1,500-$2,500/month

---

### 5. QA Engineer / Test Automation Specialist (1 person)

**Criticality**: MEDIUM-HIGH - Quality gate before deployment
**Experience Required**: 3+ years QA, 2+ years test automation
**Location**: Ghana preferred

**Responsibilities**
- Test plan development (unit, integration, system, acceptance)
- Manual testing (functional, usability, regression)
- Test automation (Selenium, Cypress, JUnit)
- NHIE conformance testing (sandbox test scenarios)
- Performance testing (load, stress testing with JMeter)
- Bug tracking and reporting (JIRA)
- User acceptance testing coordination with facilities
- Test data management
- Documentation testing (user manuals, training materials)

**Key Skills**
- Manual testing methodologies
- Test automation frameworks (Selenium WebDriver, Cypress, REST Assured)
- Bug tracking tools (JIRA, Bugzilla)
- Test case management
- Basic SQL (data validation)
- API testing (Postman, REST Assured)
- Performance testing tools (JMeter, Gatling)

**Nice to Have**
- Healthcare system testing experience
- FHIR resource validation
- Accessibility testing
- Mobile testing

**Salary Range**: $1,000-$1,800/month

---

### 6. Clinical Informaticist (1 person, can be part-time)

**Criticality**: CRITICAL - Domain expertise essential
**Experience Required**: 5+ years clinical practice + 2+ years health IT
**Location**: Ghana REQUIRED (must understand local context)

**Responsibilities**
- Ghana clinical workflow analysis and documentation
- OpenMRS concept dictionary curation (Ghana-specific concepts)
- Form design (OPD, IPD, ANC, immunization forms)
- Clinical protocol documentation (Ghana STG integration)
- User requirements gathering from clinicians
- Clinical data validation rules
- NHIS business rules documentation
- Training content development for clinical users
- User acceptance testing from clinical perspective
- Bridge between IT and clinical staff

**Key Skills**
- Clinical background (doctor, nurse, pharmacist)
- Healthcare IT exposure (EMR, HMIS experience)
- Understanding of Ghana healthcare system (NHIS, referral pathways, reporting)
- ICD-10 coding knowledge
- Clinical documentation standards
- Training and capacity building
- Communication skills (translate clinical needs to technical specs)

**Nice to Have**
- Previous EMR implementation experience
- Public health background
- Master's in Health Informatics
- OpenMRS concept dictionary experience

**Salary Range**: $2,000-$3,500/month (clinical + IT premium)

**Hiring Strategy**
- Ghana Medical Association network
- Teaching hospitals (Korle Bu, Komfo Anokye) - clinical staff with IT interest
- Ghana Health Service digital health unit
- Health informaticist training programs (WACCI, UG School of Public Health)

---

### 7. Project Manager (1 person)

**Criticality**: MEDIUM-HIGH - Coordination and stakeholder management
**Experience Required**: 5+ years project management, 2+ years health IT
**Location**: Ghana REQUIRED (government relationship critical)

**Responsibilities**
- Project planning and timeline management
- Resource allocation and budget tracking
- Risk management and mitigation
- Stakeholder communication (MoH, facilities, vendors)
- Vendor coordination (if using external consultants)
- Progress reporting (weekly team, monthly steering committee)
- Issue escalation and resolution
- Contract management (facility agreements, vendor contracts)
- Change management and user adoption strategy
- Documentation of lessons learned

**Key Skills**
- Project management methodologies (Agile, Scrum, Waterfall hybrid)
- Stakeholder management (government, healthcare providers)
- Budget and financial management
- Risk management
- Communication and presentation skills
- MS Project, JIRA, or similar tools
- Contract negotiation

**Nice to Have**
- PMP or Prince2 certification
- Health IT project experience
- Government procurement understanding (Ghana public sector)
- OpenMRS implementation experience

**Salary Range**: $2,000-$3,000/month

**Hiring Strategy**
- Ghana project management professionals
- Health IT consultancies
- Former MoH or Ghana Health Service staff with project experience

---

### 8. Business Analyst (1 person, can be part-time)

**Criticality**: MEDIUM - Requirements and process documentation
**Experience Required**: 3+ years business analysis, healthcare domain preferred
**Location**: Ghana preferred

**Responsibilities**
- Requirements gathering and documentation
- User story creation (Agile format)
- Process mapping (current state vs future state workflows)
- Gap analysis (OpenMRS capabilities vs Ghana requirements)
- Acceptance criteria definition
- User acceptance testing coordination
- Training materials development (user manuals, quick reference guides)
- Stakeholder interviews (facility staff, MoH officials)
- NHIS claims process documentation

**Key Skills**
- Requirements elicitation techniques
- Business process modeling (BPMN, flowcharts)
- User story writing (Agile format)
- Documentation skills (MS Word, Confluence)
- Stakeholder interviewing
- Analytical thinking
- Basic SQL (data analysis)

**Nice to Have**
- Healthcare workflow knowledge
- OpenMRS experience
- CBAP certification
- UX research background

**Salary Range**: $1,200-$2,000/month

---

### 9. Database Administrator (0.5-1 person, can be shared with DevOps)

**Criticality**: MEDIUM - Performance and data integrity
**Experience Required**: 3+ years database administration, MySQL preferred
**Location**: Ghana or remote

**Responsibilities**
- Database design and optimization
- Query performance tuning
- Backup and recovery procedures
- Data migration (if existing systems)
- Database security (user permissions, encryption)
- Monitoring and alerting (slow queries, disk space)
- Replication setup (for NHIE sync)
- Archival strategy (old records)

**Key Skills**
- MySQL administration (or PostgreSQL)
- SQL query optimization
- Database backup strategies
- Replication and clustering
- Database security
- Linux command line

**Salary Range**: $1,200-$2,000/month (or shared with DevOps at higher rate)

---

## Extended Team (Scale Phase Only)

### 10. UI/UX Designer (0.5 person, consultant)

**When Needed**: If custom UI required, mobile app development
**Responsibilities**: User research, wireframes, prototypes, visual design
**Salary Range**: $1,500-$2,500/month (part-time or contract)

### 11. Technical Writer (0.5 person, consultant)

**When Needed**: Documentation-heavy phase (user manuals, API docs)
**Responsibilities**: User manuals, API documentation, training materials, SOPs
**Salary Range**: $800-$1,500/month (part-time or contract)

### 12. Security Specialist (consultant, as-needed)

**When Needed**: Security audit, penetration testing before production
**Responsibilities**: Security assessment, penetration testing, compliance audit
**Salary Range**: $2,000-$4,000 (one-time engagement)

### 13. Training Coordinator (1 person, deployment phase)

**When Needed**: Facility rollout phase
**Responsibilities**: Training schedule, trainer-of-trainers, facility onboarding
**Salary Range**: $1,000-$1,800/month

---

## Team Working Model

### Agile Methodology (Scrum)

**Sprint Duration**: 2 weeks

**Sprint Ceremonies**
- Sprint Planning (Monday, 2 hours): Plan sprint backlog
- Daily Standup (15 minutes): Progress updates, blockers
- Sprint Review (Friday, 1 hour): Demo completed work
- Sprint Retrospective (Friday, 30 minutes): Process improvement

**Roles in Scrum**
- Product Owner: Project Manager or Business Analyst
- Scrum Master: Technical Lead (initially)
- Development Team: All developers, QA, DevOps

### Communication Tools

**Daily Communication**
- Slack or Microsoft Teams
- Daily standup (video call or async)

**Project Management**
- JIRA or GitHub Projects (user stories, bugs, tasks)
- Confluence or Notion (documentation)

**Code Collaboration**
- GitHub or GitLab (version control)
- Pull requests for code review
- CI/CD integration

**Design Collaboration**
- Figma or Adobe XD (UI/UX)
- Miro or Mural (workshops, brainstorming)

---

## Team Location Strategy

### Hybrid Model (Recommended)

**On-Site (Ghana-based)**
- Project Manager (government relationships)
- Clinical Informaticist (clinical workflows)
- QA Engineer (user acceptance testing at facilities)
- 1-2 Backend Developers (local talent development)
- Training Coordinator (deployment phase)

**Remote (Initially, relocate later)**
- Technical Lead (can be remote for first 3 months, then relocate)
- DevOps Engineer (can be remote)
- Frontend Developer (can be remote)

**Hybrid/Consultant**
- Business Analyst (part-time on-site)
- UI/UX Designer (contract)
- Security Specialist (as-needed)

### Office Setup

**Physical Office (Accra preferred)**
- Co-working space initially (cheaper, flexible)
- Dedicated office after 10+ team members
- Requirements: High-speed internet, backup power (UPS/generator), meeting rooms

**Equipment per Person**
- Laptop (developer-grade: 16GB RAM, SSD)
- External monitor
- UPS (power backup)
- Mobile phone (for 2FA, testing)
- Internet allowance (backup mobile data)

**Budget**: ~$2,000 per person (equipment) + $500/month office rent (co-working)

---

## Hiring Timeline

### Phase 1: Core Team (Month 1-2)
1. **Week 1-2**: Technical Lead (CRITICAL - hire first)
2. **Week 2-4**: Clinical Informaticist (domain expert)
3. **Week 3-5**: Project Manager (coordination)
4. **Week 4-6**: Backend Developer 1 (implementation starts)
5. **Week 5-7**: DevOps Engineer (infrastructure setup)

### Phase 2: Extended Team (Month 2-3)
6. **Week 6-8**: Backend Developer 2
7. **Week 7-9**: Frontend Developer
8. **Week 8-10**: QA Engineer
9. **Week 9-11**: Business Analyst (part-time initially)

### Phase 3: Scale Team (Month 6+)
10. **As needed**: Backend Developer 3, Training Coordinator, additional QA

---

## Budget Summary

### Minimal Team (6 people, 6 months)

| Role | Monthly | 6 Months |
|------|---------|----------|
| Technical Lead | $4,000 | $24,000 |
| Backend Dev × 2 | $3,000 | $18,000 |
| Frontend Dev | $2,000 | $12,000 |
| DevOps | $2,000 | $12,000 |
| QA Engineer | $1,500 | $9,000 |
| Clinical Informaticist (0.5) | $1,500 | $9,000 |
| **Subtotal Salaries** | **$14,000** | **$84,000** |
| Equipment & Office | $1,500 | $9,000 |
| Infrastructure (cloud) | $500 | $3,000 |
| Contingency (10%) | - | $9,600 |
| **TOTAL** | - | **$105,600** |

### With AI Productivity Boost (40% reduction in person-months)

**Effective team**: 6 people doing work of ~9 people
**Timeline**: 4-5 months instead of 6 months
**Adjusted Cost**: ~$70,000-$75,000

---

## Hiring Resources

### Ghana-Specific Resources

**Job Boards**
- JobSearch Ghana (jobsearchghana.com)
- Tonaton Jobs (tonaton.com)
- LinkedIn Ghana

**Tech Communities**
- Ghana Developers Community (Facebook, Telegram)
- DevCongress Ghana
- Google Developer Groups Ghana
- Ghana Java User Group

**Universities**
- KNUST (Kumasi) - Computer Science, Biomedical Engineering
- University of Ghana - Computer Science, Public Health
- GIMPA - IT programs
- Ashesi University - Computer Science

**Healthcare Institutions**
- Korle Bu Teaching Hospital (clinical informaticists)
- Komfo Anokye Teaching Hospital
- Ghana Health Service Digital Health Unit

### International Resources

**OpenMRS Community**
- Talk Forum (talk.openmrs.org)
- OpenMRS Jobs Board
- OpenMRS Slack

**Remote Hiring Platforms**
- Toptal (vetted developers)
- Upwork (freelancers)
- Remote OK
- We Work Remotely

**African Tech Talent**
- Andela (Africa-focused tech talent)
- Africa's Talking Community
- She Code Africa

---

## Retention and Motivation Strategies

### Beyond Salary

**Professional Development**
- OpenMRS certification and training
- Conference attendance (OpenMRS Implementers Meeting, HELINA)
- Online courses (Coursera, Udemy - health IT tracks)
- Mentorship from international OpenMRS experts

**Impact and Mission**
- Emphasize national impact (improving Ghana healthcare)
- Patient stories and success metrics
- Recognition in OpenMRS community

**Equity and Ownership**
- Stock options or profit sharing (if company structure)
- Performance bonuses tied to milestones
- Team retreat after successful milestones

**Work-Life Balance**
- Flexible hours (core hours + flexible)
- Remote work options (post-deployment)
- Paid time off (Ghana labor law minimum + extra)

---

## Team Evolution Over Time

### Month 1-3: Foundation
- Core team: Technical Lead, 1-2 Devs, Clinical Informaticist, PM
- Focus: Architecture, NHIE adapter, Ghana concept dictionary
- Output: MVP technical design, pilot facility requirements

### Month 4-6: Development
- Full team: 6-8 people
- Focus: Full feature development, testing, pilot deployment
- Output: Working system at 1-2 pilot facilities

### Month 7-12: Scale
- Expanded team: 8-11 people (add Training Coordinator)
- Focus: Multi-facility deployment, support, iteration
- Output: 10-20 facilities live

### Month 13-18: Maturity
- Stable team: 10-12 people (some roles shift to support)
- Focus: National scale, training, maintenance, enhancements
- Output: 30-50 facilities, knowledge transfer to Ghana team

---

## Success Metrics for Team Performance

**Development Velocity**
- Sprint velocity: Story points completed per sprint (target: increase 10% per month)
- Deployment frequency: Releases per month (target: weekly after Month 4)

**Quality Metrics**
- Bug escape rate: Production bugs per 1000 lines of code (target: <1)
- Test coverage: Unit test coverage (target: >70%)
- NHIE conformance: Pass rate on test scenarios (target: 100%)

**Adoption Metrics**
- Facility onboarding: Facilities per month (target: 2-3 after Month 6)
- User training: Staff trained per facility (target: 15-20)
- User satisfaction: Post-training survey score (target: >4/5)

**Team Health**
- Retention: Team turnover (target: <10% annually)
- Satisfaction: Team happiness survey (target: >4/5)
- Knowledge sharing: Documentation completeness (target: all modules documented)

---

## Conclusion

**Optimal Starting Team**: 6-8 people
- 1 Technical Lead (OpenMRS expert)
- 2-3 Backend Developers
- 1 Frontend Developer
- 1 DevOps Engineer
- 1 QA Engineer
- 0.5-1 Clinical Informaticist
- 1 Project Manager (can combine with Business Analyst initially)

**Critical Success Factors**
1. Hire experienced Technical Lead first (make or break)
2. Balance local Ghana talent (domain knowledge) with international OpenMRS expertise
3. Invest in training and knowledge transfer (build local capacity)
4. Leverage AI coding assistants to boost productivity 40%+
5. Start lean, scale gradually as contracts secured

**Timeline to Full Team**: 2-3 months
**Cost**: $70,000-$105,000 for 6-month MVP (depending on team size and AI leverage)
**Break-even**: 10-15 facilities deployed (at $15-20K per facility)
