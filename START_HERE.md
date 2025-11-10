# [WARNING] START HERE - MANDATORY FOR ALL WORKERS [WARNING]

**Before doing ANYTHING in this project:**

## Step 1: Read the Blueprint

**Read [AGENTS.md](AGENTS.md) completely**

This file contains:
- Non-negotiable technology constraints (Java 8, MySQL 5.7, OpenMRS 2.4.0)
- Critical architecture decisions
- OpenMRS config.xml structure requirements
- Known issues and their solutions
- Project timeline and goals

## Step 2: Verify You Understood

Answer these questions:
- **What Java version MUST be used?**
- **What OpenMRS Platform version is required?**
- **What MySQL version is compatible?**
- **What is the config.xml structure requirement?**

If you cannot answer these, **re-read [AGENTS.md](AGENTS.md)**.

## Step 3: Check Current Status

- **[IMPLEMENTATION_TRACKER.md](IMPLEMENTATION_TRACKER.md)** - Current sprint status and progress
- **[PROMPT_QUEUE.md](PROMPT_QUEUE.md)** - Full task queue

## Step 3.5: [URGENT] Check for Active Incidents

**🚨 ACTIVE INCIDENT (November 10, 2025):**
- Ghana EMR module fails to load (missing Spring beans)
- OpenMRS REST API unavailable (HTTP 500)
- **Fix ready:** [docs/runbooks/GHANAEMR_MODULE_SPRING_BEAN_FIX.md](docs/runbooks/GHANAEMR_MODULE_SPRING_BEAN_FIX.md)
- **Estimated fix time:** 15-30 minutes
- **Priority:** CRITICAL - blocks all development

**Before starting ANY other work, check if this needs to be fixed first.**

## Step 4: Proceed to Your Task

### For OpenMRS Backend Work:
→ **[OPENMRS_PROMPT_GUIDE.md](OPENMRS_PROMPT_GUIDE.md)** - OpenMRS-specific tasks

### For Frontend Work:
→ **[PROMPT_QUEUE.md](PROMPT_QUEUE.md)** - Filter by FE-* tasks

### For Documentation/Process:
→ **[docs/](docs/)** - Project documentation

---

## 🚨 Why This Matters

**Real incident (November 4-5, 2025):**
- Module failed to load for 6+ hours
- Root cause: Not understanding OpenMRS config.xml requirements
- Solution documented in AGENTS.md but not read

**Reading AGENTS.md prevents:**
- Version mismatches (Java, MySQL, OpenMRS)
- Breaking changes that delay MVP
- Repeating solved problems

---

**No exceptions. Read [AGENTS.md](AGENTS.md) first.**
