# User Journey Implementation Plan - MedReg EMR System

**Document Version:** 1.0
**Date:** November 3, 2025
**Status:** Ready for Implementation
**Estimated Total Time:** 12-15 hours (3 sprints)

---

## Executive Summary

This document outlines a comprehensive plan to align MedReg's user journey with EMR industry standards based on insights from UgandaEMR+ (1,700+ facilities), OpenMRS 3.x, and Bahmni EMR implementations. The plan addresses critical navigation gaps, implements queue-based clinical workflows, and ensures a seamless user experience for all healthcare worker roles.

### Key Insight from UgandaEMR+ O3 Success Story

> "When a patient arrives at a facility, they are first registered into the queuing system at the reception. Triage nurses then log into the system to record the patient's vital signs, which are automatically forwarded to the appropriate clinician or lab technician based on the patient's needs."

**MedReg's Current Gap:** No queue system, manual UUID entry required, no automatic patient routing.

---

## Core Principles from Research

### 1. Clinical EMRs Use Direct Login (Not Marketing Homepages)
- **UgandaEMR:** Direct login → Role-based dashboard
- **OpenMRS 3.x:** `/openmrs/spa/login` → Home module
- **Bahmni:** Direct login → Clinical applications dashboard
- **MedReg Current:** Marketing homepage → Login → Empty dashboard ❌

### 2. Queue-First Workflow Management
- **Industry Standard:** Patients flow through queues (Reception → Triage → Consultation → Pharmacy)
- **UgandaEMR+:** "Improved appointment and service queues" with automated routing
- **MedReg Current:** Manual UUID entry, no queue visibility ❌

### 3. Role-Based Landing Pages
- **Industry Standard:** Each role sees relevant queue/tasks on landing page
- **UgandaEMR+:** Reception sees registration queue, Nurses see triage queue, Doctors see consultation queue
- **MedReg Current:** All roles see same stats dashboard ❌

### 4. Automated Workflow Routing
- **UgandaEMR+:** "Vital signs automatically forwarded to appropriate clinician"
- **Industry Standard:** Patient advances through stations without manual intervention
- **MedReg Current:** No automatic routing, manual tracking required ❌

---

## Implementation Overview

### Phase 1: Fix Entry Point & Core Navigation (Sprint 1 - 4 hours)
**Goal:** Remove marketing homepage, implement direct login, fix global navigation

### Phase 2: Queue Management System (Sprint 2 - 5-6 hours)
**Goal:** Implement patient queues, automatic routing, role-based dashboards

### Phase 3: Enhanced UX & Polish (Sprint 3 - 3-4 hours)
**Goal:** Add breadcrumbs, patient search, standardized feedback patterns

---

## Phase 1: Fix Entry Point & Core Navigation

**Duration:** 4 hours
**Priority:** CRITICAL (Blocking issue)
**Dependencies:** None

### 1.1 Remove Marketing Homepage

**Problem:**
- Current `frontend/src/app/page.tsx` shows public marketing content
- Exposes clinical workflows without authentication
- Not aligned with EMR industry standards

**Solution:**
```typescript
// frontend/src/app/page.tsx - Complete replacement
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default function HomePage() {
  const sessionCookie = cookies().get('omrsSession');

  if (sessionCookie) {
    // User is authenticated → Go to dashboard
    redirect('/dashboard');
  } else {
    // User not authenticated → Go to login
    redirect('/login');
  }
}
```

**Files to Modify:**
- `frontend/src/app/page.tsx` (lines 1-105) - Replace entire content

**Testing:**
- ✓ Visit `/` without login → Redirects to `/login`
- ✓ Visit `/` with active session → Redirects to `/dashboard`
- ✓ No marketing content visible

**Time:** 30 minutes

---

### 1.2 Add Global Patient Search to Header

**Problem:**
- Patient search requires navigating to separate `/patients` page
- UgandaEMR+ has patient search always accessible
- OpenMRS 3.x prominently displays search on home screen

**Solution:**
Create reusable patient search component in header navigation

**Files to Create:**
```typescript
// frontend/src/components/patient/patient-search-header.tsx
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface PatientSearchResult {
  uuid: string;
  display: string;
  identifiers: Array<{
    identifier: string;
    identifierType: { display: string };
  }>;
}

export function PatientSearchHeader() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  const { data: patients, isLoading } = useQuery<PatientSearchResult[]>({
    queryKey: ['patientSearch', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const response = await fetch(`/api/patients?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to search patients');
      const data = await response.json();
      return data.results || [];
    },
    enabled: query.length >= 2,
  });

  const selectPatient = (patientUuid: string) => {
    setOpen(false);
    setQuery('');
    router.push(`/patients/${patientUuid}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-64 justify-start text-left font-normal">
          <Search className="mr-2 h-4 w-4" />
          <span className="text-gray-500">Search patients...</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Ghana Card, Folder #, or Name"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {isLoading && <div className="p-4 text-sm text-gray-500">Searching...</div>}
            {!isLoading && query.length >= 2 && patients?.length === 0 && (
              <CommandEmpty>No patients found.</CommandEmpty>
            )}
            <CommandGroup>
              {patients?.map((patient) => {
                const ghanaCard = patient.identifiers.find(id =>
                  id.identifierType.display.toLowerCase().includes('ghana card')
                )?.identifier;
                const folderNumber = patient.identifiers.find(id =>
                  id.identifierType.display.toLowerCase().includes('folder')
                )?.identifier;

                return (
                  <CommandItem
                    key={patient.uuid}
                    onSelect={() => selectPatient(patient.uuid)}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{patient.display}</span>
                      <span className="text-xs text-gray-500">
                        {folderNumber && `Folder: ${folderNumber}`}
                        {ghanaCard && ` • Ghana Card: ${ghanaCard.slice(0, 8)}...`}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

**Files to Modify:**
```typescript
// frontend/src/app/layout.tsx (around line 30-42)
import { PatientSearchHeader } from '@/components/patient/patient-search-header';

// Replace existing nav with:
<header className="bg-white border-b border-gray-200">
  <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
    <div className="flex items-center gap-4">
      <Link href="/dashboard" className="text-sm text-gray-800 font-semibold">
        MedReg
      </Link>

      {/* NEW: Global Patient Search */}
      <PatientSearchHeader />
    </div>

    <nav className="flex items-center gap-4 text-sm text-gray-600">
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/patients">Patients</Link> {/* NEW */}
      <Link href="/reports">Reports</Link>
      {canTriage && <Link href="/opd/triage-queue">Triage Queue</Link>} {/* CHANGED */}
      {canConsult && <Link href="/opd/consultation-queue">Consult Queue</Link>} {/* CHANGED */}
      {canDispense && <Link href="/opd/pharmacy-queue">Pharmacy Queue</Link>} {/* CHANGED */}
      {isAdmin && <Link href="/admin/nhie-queue">NHIE Queue</Link>}

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            {user?.display || 'User'} ▼
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => logout.mutate()}>
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  </div>
</header>
```

**Files to Create:**
- `frontend/src/components/patient/patient-search-header.tsx` (new file)

**Files to Modify:**
- `frontend/src/app/layout.tsx` (lines 30-42)

**Testing:**
- ✓ Patient search visible in header on all authenticated pages
- ✓ Search by Ghana Card returns results
- ✓ Search by folder number returns results
- ✓ Search by name returns results
- ✓ Selecting patient navigates to patient detail page
- ✓ "Patients" link added to nav bar
- ✓ Queue links updated (Triage Queue, Consult Queue, Pharmacy Queue)

**Time:** 1.5 hours

---

### 1.3 Add Cancel Buttons to All OPD Forms

**Problem:**
- No way to exit forms without saving
- Users must use browser back button
- Inconsistent with UX best practices

**Solution:**
Add cancel buttons that use router.back() or navigate to queue

**Files to Modify:**

1. **frontend/src/app/opd/triage/page.tsx** (around line 180)
```typescript
// Add cancel button before submit button
<div className="flex items-center gap-3">
  <Button
    type="button"
    variant="outline"
    onClick={() => router.push('/opd/triage-queue')}
  >
    Cancel
  </Button>
  <Button onClick={submit} disabled={!allowed || submitting}>
    {submitting ? 'Saving...' : 'Save Triage'}
  </Button>
</div>
```

2. **frontend/src/app/opd/consultation/page.tsx** (around line 182)
```typescript
<div className="flex items-center gap-3">
  <Button
    type="button"
    variant="outline"
    onClick={() => router.push('/opd/consultation-queue')}
  >
    Cancel
  </Button>
  <Button type="submit" disabled={!allowed || mutation.isPending}>
    {mutation.isPending ? 'Saving…' : 'Save Consultation'}
  </Button>
</div>
```

3. **frontend/src/app/opd/dispense/page.tsx** (similar pattern)

**Files to Modify:**
- `frontend/src/app/opd/triage/page.tsx` (line ~180)
- `frontend/src/app/opd/consultation/page.tsx` (line ~182)
- `frontend/src/app/opd/dispense/page.tsx` (line ~similar location)

**Testing:**
- ✓ Cancel button visible on all OPD forms
- ✓ Clicking Cancel navigates back to appropriate queue
- ✓ Cancel does not save data

**Time:** 30 minutes

---

### 1.4 Add User Profile Menu with Logout

**Problem:**
- Logout button only visible on dashboard page
- No user profile access
- Inconsistent with modern web app patterns

**Solution:**
Add dropdown menu in header (already shown in 1.2 above)

**Files to Modify:**
- `frontend/src/app/layout.tsx` (included in section 1.2)

**Testing:**
- ✓ User menu visible in header on all pages
- ✓ Shows current user's name
- ✓ Logout option available
- ✓ Clicking logout redirects to login page

**Time:** 30 minutes

---

### Phase 1 Summary

**Total Time:** 4 hours
**Files Created:** 1 (patient-search-header.tsx)
**Files Modified:** 5 (page.tsx, layout.tsx, 3 OPD pages)

**Deliverables:**
- ✓ Marketing homepage removed, direct login implemented
- ✓ Global patient search in header
- ✓ "Patients" link added to nav
- ✓ Queue navigation links updated
- ✓ Cancel buttons on all forms
- ✓ User profile menu with logout

**Testing Checklist:**
```
[ ] Homepage redirects to login when not authenticated
[ ] Homepage redirects to dashboard when authenticated
[ ] Patient search finds patients by Ghana Card
[ ] Patient search finds patients by folder number
[ ] Patient search finds patients by name
[ ] Clicking patient in search navigates to patient detail page
[ ] "Patients" link in nav goes to patient list
[ ] Cancel buttons work on all OPD forms
[ ] User menu shows current user name
[ ] Logout button works and redirects to login
```

---

## Phase 2: Queue Management System

**Duration:** 5-6 hours
**Priority:** HIGH (Core clinical workflow)
**Dependencies:** Phase 1 must be completed

### 2.1 Database Schema for Patient Queue

**Based on UgandaEMR pattern:** Patients flow through queues with status tracking

**Files to Create:**

```sql
-- backend/openmrs-module-ghanaemr/api/src/main/resources/liquibase-queue-management.xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
    http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-3.8.xsd">

    <changeSet id="ghanaemr-queue-1" author="medreg">
        <preConditions onFail="MARK_RAN">
            <not>
                <tableExists tableName="ghanaemr_patient_queue"/>
            </not>
        </preConditions>

        <createTable tableName="ghanaemr_patient_queue">
            <column name="queue_id" type="int" autoIncrement="true">
                <constraints primaryKey="true" nullable="false"/>
            </column>
            <column name="uuid" type="char(38)">
                <constraints nullable="false" unique="true"/>
            </column>
            <column name="patient_id" type="int">
                <constraints nullable="false"/>
            </column>
            <column name="visit_id" type="int">
                <constraints nullable="false"/>
            </column>
            <column name="location_from_id" type="int">
                <constraints nullable="true"/>
            </column>
            <column name="location_to_id" type="int">
                <constraints nullable="false"/>
            </column>
            <column name="provider_id" type="int">
                <constraints nullable="true"/>
            </column>
            <column name="status" type="varchar(50)" defaultValue="PENDING">
                <constraints nullable="false"/>
            </column>
            <column name="priority" type="int" defaultValue="5">
                <constraints nullable="false"/>
            </column>
            <column name="queue_number" type="varchar(20)">
                <constraints nullable="true"/>
            </column>
            <column name="comment" type="text">
                <constraints nullable="true"/>
            </column>
            <column name="date_created" type="datetime">
                <constraints nullable="false"/>
            </column>
            <column name="date_changed" type="datetime">
                <constraints nullable="true"/>
            </column>
            <column name="creator" type="int">
                <constraints nullable="false"/>
            </column>
            <column name="changed_by" type="int">
                <constraints nullable="true"/>
            </column>
            <column name="voided" type="boolean" defaultValueBoolean="false">
                <constraints nullable="false"/>
            </column>
            <column name="voided_by" type="int">
                <constraints nullable="true"/>
            </column>
            <column name="date_voided" type="datetime">
                <constraints nullable="true"/>
            </column>
            <column name="void_reason" type="varchar(255)">
                <constraints nullable="true"/>
            </column>
        </createTable>

        <addForeignKeyConstraint
            constraintName="ghanaemr_queue_patient_fk"
            baseTableName="ghanaemr_patient_queue" baseColumnNames="patient_id"
            referencedTableName="patient" referencedColumnNames="patient_id"/>

        <addForeignKeyConstraint
            constraintName="ghanaemr_queue_visit_fk"
            baseTableName="ghanaemr_patient_queue" baseColumnNames="visit_id"
            referencedTableName="visit" referencedColumnNames="visit_id"/>

        <addForeignKeyConstraint
            constraintName="ghanaemr_queue_location_from_fk"
            baseTableName="ghanaemr_patient_queue" baseColumnNames="location_from_id"
            referencedTableName="location" referencedColumnNames="location_id"/>

        <addForeignKeyConstraint
            constraintName="ghanaemr_queue_location_to_fk"
            baseTableName="ghanaemr_patient_queue" baseColumnNames="location_to_id"
            referencedTableName="location" referencedColumnNames="location_id"/>

        <addForeignKeyConstraint
            constraintName="ghanaemr_queue_provider_fk"
            baseTableName="ghanaemr_patient_queue" baseColumnNames="provider_id"
            referencedTableName="provider" referencedColumnNames="provider_id"/>

        <addForeignKeyConstraint
            constraintName="ghanaemr_queue_creator_fk"
            baseTableName="ghanaemr_patient_queue" baseColumnNames="creator"
            referencedTableName="users" referencedColumnNames="user_id"/>

        <createIndex tableName="ghanaemr_patient_queue" indexName="idx_queue_status_location">
            <column name="status"/>
            <column name="location_to_id"/>
            <column name="date_created"/>
        </createIndex>

        <createIndex tableName="ghanaemr_patient_queue" indexName="idx_queue_patient_visit">
            <column name="patient_id"/>
            <column name="visit_id"/>
        </createIndex>
    </changeSet>

</databaseChangeLog>
```

**Files to Modify:**
```xml
<!-- backend/openmrs-module-ghanaemr/api/src/main/resources/liquibase.xml -->
<!-- Add this line before closing </databaseChangeLog> tag -->
<include file="liquibase-queue-management.xml"/>
```

**Time:** 1 hour

---

### 2.2 Backend Queue Service

**Files to Create:**

```java
// backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/queue/PatientQueueService.java
package org.openmrs.module.ghanaemr.api.queue;

import org.openmrs.Location;
import org.openmrs.Patient;
import org.openmrs.Visit;
import org.openmrs.annotation.Authorized;
import org.openmrs.api.OpenmrsService;
import org.openmrs.module.ghanaemr.api.queue.model.PatientQueue;
import org.openmrs.module.ghanaemr.api.queue.model.QueueStatus;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface PatientQueueService extends OpenmrsService {

    /**
     * Add patient to queue at specified location
     * @param patient The patient to queue
     * @param visit The active visit
     * @param toLocation The location/station patient is queued for
     * @param priority Priority level (1-10, default 5)
     * @return Created queue entry
     */
    @Authorized({"Register Patient Queue"})
    @Transactional
    PatientQueue addToQueue(Patient patient, Visit visit, Location toLocation, Integer priority);

    /**
     * Get all patients in queue for a specific location with given status
     * @param location The location to check
     * @param status The queue status (PENDING, IN_PROGRESS, COMPLETED)
     * @return List of queue entries
     */
    @Authorized({"View Patient Queue"})
    @Transactional(readOnly = true)
    List<PatientQueue> getQueueByLocationAndStatus(Location location, QueueStatus status);

    /**
     * Update queue status (e.g., from PENDING to IN_PROGRESS)
     * @param queueEntry The queue entry to update
     * @param newStatus The new status
     * @return Updated queue entry
     */
    @Authorized({"Update Patient Queue"})
    @Transactional
    PatientQueue updateQueueStatus(PatientQueue queueEntry, QueueStatus newStatus);

    /**
     * Move patient to next station in workflow (Triage → Consultation → Pharmacy)
     * @param currentQueue The current queue entry
     * @param nextLocation The next location in workflow
     * @return New queue entry for next station
     */
    @Authorized({"Move Patient Queue"})
    @Transactional
    PatientQueue moveToNextStation(PatientQueue currentQueue, Location nextLocation);

    /**
     * Get queue entry for patient at location
     * @param patient The patient
     * @param location The location
     * @return Active queue entry or null
     */
    @Transactional(readOnly = true)
    PatientQueue getActiveQueueEntry(Patient patient, Location location);

    /**
     * Complete queue entry (mark as COMPLETED)
     * @param queueEntry The queue entry to complete
     */
    @Authorized({"Complete Patient Queue"})
    @Transactional
    void completeQueueEntry(PatientQueue queueEntry);
}
```

```java
// backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/queue/model/PatientQueue.java
package org.openmrs.module.ghanaemr.api.queue.model;

import org.openmrs.BaseOpenmrsData;
import org.openmrs.Location;
import org.openmrs.Patient;
import org.openmrs.Provider;
import org.openmrs.Visit;

import javax.persistence.*;
import java.util.Date;

@Entity
@Table(name = "ghanaemr_patient_queue")
public class PatientQueue extends BaseOpenmrsData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "queue_id")
    private Integer queueId;

    @ManyToOne(optional = false)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @ManyToOne(optional = false)
    @JoinColumn(name = "visit_id")
    private Visit visit;

    @ManyToOne
    @JoinColumn(name = "location_from_id")
    private Location locationFrom;

    @ManyToOne(optional = false)
    @JoinColumn(name = "location_to_id")
    private Location locationTo;

    @ManyToOne
    @JoinColumn(name = "provider_id")
    private Provider provider;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private QueueStatus status = QueueStatus.PENDING;

    @Column(name = "priority")
    private Integer priority = 5;

    @Column(name = "queue_number")
    private String queueNumber;

    @Column(name = "comment")
    private String comment;

    @Column(name = "date_created", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date dateCreated;

    // Getters and setters omitted for brevity

    @Override
    public Integer getId() {
        return queueId;
    }

    @Override
    public void setId(Integer id) {
        this.queueId = id;
    }
}
```

```java
// backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/queue/model/QueueStatus.java
package org.openmrs.module.ghanaemr.api.queue.model;

public enum QueueStatus {
    PENDING,      // Patient waiting in queue
    IN_PROGRESS,  // Patient being attended to
    COMPLETED,    // Service completed, ready for next station
    CANCELLED     // Queue entry cancelled
}
```

**Implementation class** (similar to existing service implementations in the codebase):

```java
// backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/queue/impl/PatientQueueServiceImpl.java
package org.openmrs.module.ghanaemr.api.queue.impl;

import org.openmrs.Location;
import org.openmrs.Patient;
import org.openmrs.Visit;
import org.openmrs.api.context.Context;
import org.openmrs.api.impl.BaseOpenmrsService;
import org.openmrs.module.ghanaemr.api.queue.PatientQueueService;
import org.openmrs.module.ghanaemr.api.queue.db.PatientQueueDAO;
import org.openmrs.module.ghanaemr.api.queue.model.PatientQueue;
import org.openmrs.module.ghanaemr.api.queue.model.QueueStatus;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.UUID;

public class PatientQueueServiceImpl extends BaseOpenmrsService implements PatientQueueService {

    private PatientQueueDAO dao;

    public void setDao(PatientQueueDAO dao) {
        this.dao = dao;
    }

    @Override
    @Transactional
    public PatientQueue addToQueue(Patient patient, Visit visit, Location toLocation, Integer priority) {
        PatientQueue queue = new PatientQueue();
        queue.setUuid(UUID.randomUUID().toString());
        queue.setPatient(patient);
        queue.setVisit(visit);
        queue.setLocationTo(toLocation);
        queue.setPriority(priority != null ? priority : 5);
        queue.setStatus(QueueStatus.PENDING);
        queue.setDateCreated(new Date());
        queue.setCreator(Context.getAuthenticatedUser());

        // Generate queue number (e.g., "TR001" for Triage, "CN001" for Consultation)
        String prefix = generateQueuePrefix(toLocation);
        int nextNumber = dao.getNextQueueNumber(toLocation, new Date());
        queue.setQueueNumber(String.format("%s%03d", prefix, nextNumber));

        return dao.save(queue);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PatientQueue> getQueueByLocationAndStatus(Location location, QueueStatus status) {
        return dao.getQueueByLocationAndStatus(location, status);
    }

    @Override
    @Transactional
    public PatientQueue updateQueueStatus(PatientQueue queueEntry, QueueStatus newStatus) {
        queueEntry.setStatus(newStatus);
        queueEntry.setDateChanged(new Date());
        queueEntry.setChangedBy(Context.getAuthenticatedUser());
        return dao.save(queueEntry);
    }

    @Override
    @Transactional
    public PatientQueue moveToNextStation(PatientQueue currentQueue, Location nextLocation) {
        // Complete current queue entry
        completeQueueEntry(currentQueue);

        // Create new queue entry for next station
        return addToQueue(
            currentQueue.getPatient(),
            currentQueue.getVisit(),
            nextLocation,
            currentQueue.getPriority()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PatientQueue getActiveQueueEntry(Patient patient, Location location) {
        return dao.getActiveQueueEntry(patient, location);
    }

    @Override
    @Transactional
    public void completeQueueEntry(PatientQueue queueEntry) {
        queueEntry.setStatus(QueueStatus.COMPLETED);
        queueEntry.setDateChanged(new Date());
        queueEntry.setChangedBy(Context.getAuthenticatedUser());
        dao.save(queueEntry);
    }

    private String generateQueuePrefix(Location location) {
        String locationName = location.getName().toLowerCase();
        if (locationName.contains("triage")) return "TR";
        if (locationName.contains("consultation") || locationName.contains("opd")) return "CN";
        if (locationName.contains("pharmacy")) return "PH";
        return "QU";
    }
}
```

**Files to Create:**
- `backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/queue/PatientQueueService.java`
- `backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/queue/model/PatientQueue.java`
- `backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/queue/model/QueueStatus.java`
- `backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/queue/impl/PatientQueueServiceImpl.java`
- `backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/queue/db/PatientQueueDAO.java` (DAO interface)
- `backend/openmrs-module-ghanaemr/api/src/main/java/org/openmrs/module/ghanaemr/api/queue/db/hibernate/HibernatePatientQueueDAO.java` (DAO implementation)

**Files to Modify:**
- `backend/openmrs-module-ghanaemr/api/src/main/resources/moduleApplicationContext.xml` (register service bean)

**Time:** 2 hours

---

### 2.3 Frontend Queue API Routes

**Files to Create:**

```typescript
// frontend/src/app/api/opd/queue/[location]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const OPENMRS_BASE_URL = process.env.OPENMRS_BASE_URL;
const OPENMRS_USERNAME = process.env.OPENMRS_USERNAME;
const OPENMRS_PASSWORD = process.env.OPENMRS_PASSWORD;

interface QueueEntry {
  uuid: string;
  patient: {
    uuid: string;
    display: string;
    identifiers: Array<{
      identifier: string;
      identifierType: { display: string };
    }>;
  };
  queueNumber: string;
  status: string;
  priority: number;
  dateCreated: string;
  waitTime?: number; // calculated in minutes
}

export async function GET(
  request: NextRequest,
  { params }: { params: { location: string } }
) {
  try {
    const { location } = params;
    const status = request.nextUrl.searchParams.get('status') || 'PENDING';

    const response = await axios.get(
      `${OPENMRS_BASE_URL}/ghanaemr/queue`,
      {
        params: {
          location,
          status,
          v: 'full',
        },
        auth: {
          username: OPENMRS_USERNAME!,
          password: OPENMRS_PASSWORD!,
        },
      }
    );

    // Calculate wait times
    const now = new Date().getTime();
    const queueWithWaitTimes = response.data.results.map((entry: any) => {
      const createdTime = new Date(entry.dateCreated).getTime();
      const waitTime = Math.floor((now - createdTime) / 60000); // minutes
      return {
        ...entry,
        waitTime,
      };
    });

    return NextResponse.json({
      results: queueWithWaitTimes,
      total: response.data.results.length,
    });
  } catch (error: any) {
    console.error('Failed to fetch queue:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch queue data' },
      { status: 500 }
    );
  }
}
```

```typescript
// frontend/src/app/api/opd/queue/move/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const OPENMRS_BASE_URL = process.env.OPENMRS_BASE_URL;
const OPENMRS_USERNAME = process.env.OPENMRS_USERNAME;
const OPENMRS_PASSWORD = process.env.OPENMRS_PASSWORD;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { queueUuid, nextLocationUuid, currentStatus } = body;

    // Update current queue entry to COMPLETED
    await axios.post(
      `${OPENMRS_BASE_URL}/ghanaemr/queue/${queueUuid}`,
      {
        status: 'COMPLETED',
      },
      {
        auth: {
          username: OPENMRS_USERNAME!,
          password: OPENMRS_PASSWORD!,
        },
      }
    );

    // Create new queue entry for next station
    const response = await axios.post(
      `${OPENMRS_BASE_URL}/ghanaemr/queue`,
      {
        patientUuid: body.patientUuid,
        visitUuid: body.visitUuid,
        locationToUuid: nextLocationUuid,
        priority: body.priority || 5,
        status: 'PENDING',
      },
      {
        auth: {
          username: OPENMRS_USERNAME!,
          password: OPENMRS_PASSWORD!,
        },
      }
    );

    return NextResponse.json({
      success: true,
      newQueueEntry: response.data,
    });
  } catch (error: any) {
    console.error('Failed to move patient in queue:', error.message);
    return NextResponse.json(
      { error: 'Failed to move patient to next station' },
      { status: 500 }
    );
  }
}
```

**Files to Create:**
- `frontend/src/app/api/opd/queue/[location]/route.ts`
- `frontend/src/app/api/opd/queue/move/route.ts`

**Time:** 1 hour

---

### 2.4 Frontend Queue List Pages

**Files to Create:**

```typescript
// frontend/src/app/opd/triage-queue/page.tsx
"use client";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, UserPlus } from 'lucide-react';

interface QueuePatient {
  uuid: string;
  patient: {
    uuid: string;
    display: string;
    identifiers: Array<{
      identifier: string;
      identifierType: { display: string };
    }>;
  };
  queueNumber: string;
  priority: number;
  dateCreated: string;
  waitTime: number;
}

export default function TriageQueuePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Get user's current location from cookie
  const locationUuid = typeof window !== 'undefined'
    ? getCookie('omrsLocationUuid')
    : '';

  const { data: queue, isLoading, refetch } = useQuery<{ results: QueuePatient[] }>({
    queryKey: ['triageQueue', locationUuid],
    queryFn: async () => {
      const response = await fetch(`/api/opd/queue/${locationUuid}?status=PENDING`);
      if (!response.ok) throw new Error('Failed to fetch queue');
      return response.json();
    },
    refetchInterval: 10000, // Poll every 10 seconds
    enabled: !!locationUuid,
  });

  const startTriage = (patientUuid: string, queueUuid: string) => {
    router.push(`/opd/triage?patientUuid=${patientUuid}&queueUuid=${queueUuid}`);
  };

  const getWaitTimeColor = (minutes: number) => {
    if (minutes < 15) return 'bg-green-500';
    if (minutes < 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const findIdentifier = (identifiers: any[], type: string) => {
    return identifiers.find(id =>
      id.identifierType.display.toLowerCase().includes(type.toLowerCase())
    )?.identifier || 'N/A';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Triage Queue</h1>
          <p className="text-sm text-gray-600 mt-1">
            {queue?.results.length || 0} patient{queue?.results.length !== 1 ? 's' : ''} waiting
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
          <Button onClick={() => router.push('/patients/register')}>
            <UserPlus className="h-4 w-4 mr-2" />
            Register New Patient
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Waiting Patients</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : queue?.results.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No patients in queue</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Queue #</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Folder Number</TableHead>
                  <TableHead>Ghana Card</TableHead>
                  <TableHead>Wait Time</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue?.results.map((entry) => (
                  <TableRow key={entry.uuid}>
                    <TableCell className="font-mono font-medium">
                      {entry.queueNumber}
                    </TableCell>
                    <TableCell>{entry.patient.display}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {findIdentifier(entry.patient.identifiers, 'folder')}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {findIdentifier(entry.patient.identifiers, 'ghana').slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${getWaitTimeColor(entry.waitTime)}`}
                        />
                        <span className="text-sm">{entry.waitTime} min</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {entry.priority === 1 ? (
                        <Badge variant="destructive">Urgent</Badge>
                      ) : entry.priority <= 3 ? (
                        <Badge variant="secondary">High</Badge>
                      ) : (
                        <Badge variant="outline">Normal</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => startTriage(entry.patient.uuid, entry.uuid)}
                      >
                        Start Triage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getCookie(name: string): string {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
  return '';
}
```

**Similar structure for:**
- `frontend/src/app/opd/consultation-queue/page.tsx` (for doctors)
- `frontend/src/app/opd/pharmacy-queue/page.tsx` (for pharmacists)

**Files to Create:**
- `frontend/src/app/opd/triage-queue/page.tsx`
- `frontend/src/app/opd/consultation-queue/page.tsx`
- `frontend/src/app/opd/pharmacy-queue/page.tsx`

**Time:** 2 hours

---

### 2.5 Update Dashboard with Role-Based Queue Widgets

**Files to Modify:**

```typescript
// frontend/src/app/dashboard/page.tsx - Add queue widgets

"use client";
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

export default function DashboardPage() {
  const router = useRouter();

  // Get user role and location from cookies
  const userRole = getCookie('omrsRole');
  const locationUuid = getCookie('omrsLocationUuid');

  const isNurse = userRole.toLowerCase().includes('nurse');
  const isDoctor = userRole.toLowerCase().includes('doctor');
  const isPharmacist = userRole.toLowerCase().includes('pharmacist');

  // Existing OPD metrics query
  const { data: opd } = useQuery({
    queryKey: ['opdMetrics'],
    queryFn: async () => {
      const response = await fetch('/api/opd/metrics');
      if (!response.ok) throw new Error('Failed to fetch OPD metrics');
      return response.json();
    },
  });

  // NEW: Queue data for current user's station
  const { data: myQueue } = useQuery({
    queryKey: ['myQueue', locationUuid],
    queryFn: async () => {
      const response = await fetch(`/api/opd/queue/${locationUuid}?status=PENDING`);
      if (!response.ok) throw new Error('Failed to fetch queue');
      return response.json();
    },
    enabled: !!(isNurse || isDoctor || isPharmacist) && !!locationUuid,
    refetchInterval: 10000, // Poll every 10 seconds
  });

  const queueLink = isNurse
    ? '/opd/triage-queue'
    : isDoctor
    ? '/opd/consultation-queue'
    : '/opd/pharmacy-queue';

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Existing Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              OPD Encounters Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {opd?.opdEncountersToday ?? '—'}
            </div>
          </CardContent>
        </Card>

        {/* Other existing cards... */}
      </div>

      {/* NEW: Role-Based Queue Widget */}
      {(isNurse || isDoctor || isPharmacist) && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                {isNurse && 'My Triage Queue'}
                {isDoctor && 'My Consultation Queue'}
                {isPharmacist && 'My Pharmacy Queue'}
              </CardTitle>
              <Button variant="outline" onClick={() => router.push(queueLink)}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {myQueue?.results.length === 0 ? (
              <p className="text-sm text-gray-500">No patients waiting</p>
            ) : (
              <>
                <div className="text-3xl font-bold mb-4">
                  {myQueue?.results.length || 0}
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    patient{myQueue?.results.length !== 1 ? 's' : ''} waiting
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Next patients:</p>
                  <Table>
                    <TableBody>
                      {myQueue?.results.slice(0, 3).map((entry: any) => (
                        <TableRow key={entry.uuid}>
                          <TableCell className="font-mono text-sm">
                            {entry.queueNumber}
                          </TableCell>
                          <TableCell>{entry.patient.display}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {entry.waitTime} min wait
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => router.push(
                                `${queueLink.replace('-queue', '')}?patientUuid=${entry.patient.uuid}&queueUuid=${entry.uuid}`
                              )}
                            >
                              Start
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Existing CSV downloads section... */}
    </div>
  );
}

function getCookie(name: string): string {
  if (typeof window === 'undefined') return '';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
  return '';
}
```

**Files to Modify:**
- `frontend/src/app/dashboard/page.tsx`

**Time:** 1 hour

---

### 2.6 Update OPD Forms with Queue Integration

**Pattern:** After saving triage/consultation/dispense, automatically move patient to next station

**Files to Modify:**

```typescript
// frontend/src/app/opd/triage/page.tsx - Add queue integration

// Add to component state
const searchParams = useSearchParams();
const queueUuid = searchParams.get('queueUuid');

// Modify submit function
const submit = async () => {
  if (!allowed || submitting) return;
  setSubmitting(true);

  try {
    // Save vitals (existing logic)
    const response = await fetch('/api/opd/triage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientUuid,
        // ... vitals data
      }),
    });

    if (!response.ok) throw new Error('Failed to save triage');

    // NEW: Move patient to consultation queue
    if (queueUuid) {
      await fetch('/api/opd/queue/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queueUuid,
          patientUuid,
          visitUuid: visit.uuid,
          nextLocationUuid: process.env.NEXT_PUBLIC_CONSULTATION_LOCATION_UUID,
        }),
      });
    }

    setStatus('✓ Triage saved. Patient sent to consultation queue.');

    // Redirect back to triage queue after 2 seconds
    setTimeout(() => {
      router.push('/opd/triage-queue');
    }, 2000);

  } catch (error: any) {
    setStatus(`✗ Error: ${error.message}`);
  } finally {
    setSubmitting(false);
  }
};
```

**Similar changes for:**
- `frontend/src/app/opd/consultation/page.tsx` (move to pharmacy queue after consultation)
- `frontend/src/app/opd/dispense/page.tsx` (complete visit after dispensing)

**Files to Modify:**
- `frontend/src/app/opd/triage/page.tsx`
- `frontend/src/app/opd/consultation/page.tsx`
- `frontend/src/app/opd/dispense/page.tsx`

**Time:** 1 hour

---

### Phase 2 Summary

**Total Time:** 5-6 hours
**Files Created:** 12 (backend + frontend)
**Files Modified:** 5 (liquibase.xml, moduleApplicationContext.xml, 3 OPD forms, dashboard)

**Deliverables:**
- ✓ Patient queue database schema
- ✓ Backend queue service (Java)
- ✓ Frontend queue API routes
- ✓ Triage queue page
- ✓ Consultation queue page
- ✓ Pharmacy queue page
- ✓ Dashboard queue widgets (role-based)
- ✓ Automatic patient routing between stations

**Testing Checklist:**
```
[ ] Register new patient
[ ] Patient appears in triage queue
[ ] Nurse can see triage queue on dashboard
[ ] Nurse selects patient from queue
[ ] Triage form opens with patient UUID pre-filled
[ ] Save triage → Patient moves to consultation queue
[ ] Doctor sees patient in consultation queue
[ ] Doctor completes consultation → Patient moves to pharmacy queue
[ ] Pharmacist sees patient in pharmacy queue
[ ] Pharmacist dispenses → Visit marked complete
[ ] Queue counts update in real-time (10-second polling)
[ ] Wait times calculated correctly
[ ] Priority patients shown first (urgent > high > normal)
[ ] Queue numbers generated correctly (TR001, CN001, PH001)
```

---

## Phase 3: Enhanced UX & Polish

**Duration:** 3-4 hours
**Priority:** MEDIUM (Improves usability)
**Dependencies:** Phase 2 must be completed

### 3.1 Add Breadcrumb Navigation

**Files to Create:**

```typescript
// frontend/src/components/ui/breadcrumb.tsx
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-2">
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-gray-900 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
          {index < items.length - 1 && (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </span>
      ))}
    </nav>
  );
}
```

**Files to Modify (add breadcrumbs to all OPD pages):**

```typescript
// frontend/src/app/opd/triage-queue/page.tsx
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function TriageQueuePage() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <Breadcrumb items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Triage Queue' },
      ]} />

      {/* Rest of page content */}
    </div>
  );
}
```

```typescript
// frontend/src/app/opd/triage/page.tsx
<Breadcrumb items={[
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Triage Queue', href: '/opd/triage-queue' },
  { label: 'Record Vitals' },
]} />
```

**Files to Create:**
- `frontend/src/components/ui/breadcrumb.tsx`

**Files to Modify (add breadcrumbs):**
- `frontend/src/app/opd/triage-queue/page.tsx`
- `frontend/src/app/opd/triage/page.tsx`
- `frontend/src/app/opd/consultation-queue/page.tsx`
- `frontend/src/app/opd/consultation/page.tsx`
- `frontend/src/app/opd/pharmacy-queue/page.tsx`
- `frontend/src/app/opd/dispense/page.tsx`
- `frontend/src/app/patients/page.tsx`
- `frontend/src/app/patients/register/page.tsx`
- `frontend/src/app/patients/[uuid]/page.tsx`

**Time:** 1 hour

---

### 3.2 Standardize Success Feedback (Toast + Redirect)

**Current Issues:**
- Triage: Inline text status
- Consultation: Toast notification but stays on same page
- Dispense: Inline text status

**Solution:**
Use consistent pattern: Toast notification + automatic redirect

**Install toast library** (if not already):
```bash
npm install sonner
```

**Files to Create:**

```typescript
// frontend/src/components/ui/toast-provider.tsx
"use client";
import { Toaster } from 'sonner';

export function ToastProvider() {
  return <Toaster position="top-right" richColors />;
}
```

**Files to Modify:**

```typescript
// frontend/src/app/layout.tsx - Add toast provider
import { ToastProvider } from '@/components/ui/toast-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Existing providers */}
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
```

```typescript
// frontend/src/app/opd/triage/page.tsx - Use toast
import { toast } from 'sonner';

const submit = async () => {
  try {
    // Save logic...

    toast.success('Triage saved successfully', {
      description: 'Patient sent to consultation queue',
    });

    // Redirect after 1.5 seconds
    setTimeout(() => {
      router.push('/opd/triage-queue');
    }, 1500);
  } catch (error: any) {
    toast.error('Failed to save triage', {
      description: error.message,
    });
  }
};
```

**Apply to all OPD forms for consistent UX**

**Files to Create:**
- `frontend/src/components/ui/toast-provider.tsx`

**Files to Modify:**
- `frontend/src/app/layout.tsx`
- `frontend/src/app/opd/triage/page.tsx`
- `frontend/src/app/opd/consultation/page.tsx`
- `frontend/src/app/opd/dispense/page.tsx`

**Time:** 1 hour

---

### 3.3 Create Documentation

**Files to Create:**

```markdown
<!-- docs/UX_PATTERNS.md -->
# MedReg UX Patterns & Design Decisions

## Entry Point: Why No Marketing Homepage?

### Decision
MedReg clinical application (`app.medreg.com.gh`) redirects homepage (`/`) directly to login page (`/login`). No marketing content is shown.

### Rationale
1. **Industry Standard**: Clinical EMR systems (UgandaEMR, OpenMRS 3.x, Bahmni) all use direct login entry points
2. **Security**: Clinical systems should not expose workflows without authentication
3. **Purpose Clarity**: EMRs are operational tools for healthcare workers, not public websites
4. **Regulatory Compliance**: HIPAA, GDPR, Ghana Data Protection Act require access controls
5. **User Expectations**: Clinicians expect direct access to work tools

### Research References
- **UgandaEMR+** (1,700+ facilities): Direct login → Role-based dashboard
- **OpenMRS 3.x**: `/openmrs/spa/login` → Home module
- **Bahmni**: Direct login → Clinical applications dashboard

### What About Marketing Content?
Marketing content belongs on a separate site:
- **Marketing site**: `medreg.com.gh` (for Ghana MoH, funders, potential customers)
- **Clinical app**: `app.medreg.com.gh` (direct to login)
- **Patient portal** (future v2): `patient.medreg.com.gh` (appointment booking)

---

## Navigation Architecture

### Global Navigation Bar
**Location**: Header on all authenticated pages

**Pattern**:
```
[Logo] [Patient Search 🔍] [Dashboard] [Patients] [Queue] [Reports] [Admin] [User ▼]
```

**Role-Based Visibility**:
- Nurses: See "Triage Queue" link
- Doctors: See "Consult Queue" link
- Pharmacists: See "Pharmacy Queue" link
- Admins: See all + "NHIE Queue" link

**Why Top Nav vs Sidebar?**
- Top navigation reduces screen height usage (important for forms)
- Familiar pattern for web applications
- Works well on tablets (UgandaEMR+ optimized for tablets)

---

## Queue-First Workflow

### Decision
Clinical workflows start from **queue lists**, not individual patient search.

### Pattern
```
Dashboard → View Queue → Select Patient from Queue → Complete Workflow → Return to Queue
```

**Example: Triage Workflow**
1. Nurse opens dashboard → Sees triage queue widget (3 patients waiting)
2. Clicks "View All" → Opens triage queue page
3. Selects first patient (queue #TR001) → Opens triage form with patient UUID pre-filled
4. Records vitals → Saves
5. Patient automatically moves to consultation queue
6. Nurse redirected back to triage queue
7. Next patient (#TR002) now at top of list

### Why Queue-First?
**Research from UgandaEMR+ implementation:**
> "Triage nurses then log into the system to record the patient's vital signs, which are automatically forwarded to the appropriate clinician or lab technician based on the patient's needs."

**Benefits**:
1. **Fair patient service**: First-come, first-served visibility
2. **Workflow efficiency**: Staff process patients in order
3. **Status tracking**: Know where patient is in system
4. **Workload management**: See queue depth, assign resources
5. **Prevents missed patients**: Can't forget waiting patients

### When to Use Patient Search?
- Follow-up appointments (patient not in queue)
- Medical records review
- Administrative tasks
- NHIS coverage checks

---

## Role-Based Landing Pages

### Decision
After login, users land on dashboard with **role-specific content**.

### Dashboard Widgets by Role

**Nurse (Triage Station)**:
- Triage queue widget (top patients waiting)
- Today's vitals recorded count
- Average triage time
- Quick action: "Register New Patient"

**Doctor (Consultation Room)**:
- Consultation queue widget (patients with completed triage)
- Today's consultations count
- Pending lab results alerts
- Quick action: "View All Patients"

**Pharmacist (Pharmacy)**:
- Pharmacy queue widget (patients with prescriptions)
- Today's prescriptions dispensed
- Low stock alerts
- Quick action: "Stock Management"

**Admin**:
- System overview (all queues)
- NHIE sync status
- DLQ count (failed syncs)
- User management links

---

## Automatic Workflow Routing

### Decision
When completing a workflow step, patient automatically moves to next queue.

### Flow
```
Patient Registration → Added to Triage Queue (status: PENDING)
Complete Triage → Move to Consultation Queue (complete triage entry, create consultation entry)
Complete Consultation → Move to Pharmacy Queue (if prescriptions exist)
Complete Dispense → Mark visit as COMPLETED
```

### Implementation
**Backend**: `PatientQueueService.moveToNextStation(currentQueue, nextLocation)`
**Frontend**: After save, call `/api/opd/queue/move` with next location UUID

**UgandaEMR+ Reference:**
> "Vital signs automatically forwarded to appropriate clinician based on patient's needs"

---

## Breadcrumb Navigation

### Decision
Show navigation hierarchy on all pages.

### Pattern
```
Dashboard > Consultation Queue > Patient Consultation
```

### Why Breadcrumbs?
1. **Context awareness**: Users know where they are
2. **Easy navigation**: Click any parent level to go back
3. **Discoverability**: New users learn system structure
4. **Accessibility**: Screen readers announce navigation path

---

## Success Feedback Pattern

### Decision
Use **toast notifications + automatic redirect** for all form submissions.

### Pattern
```typescript
// Save successful
toast.success('Triage saved successfully', {
  description: 'Patient sent to consultation queue',
});

// Redirect after 1.5 seconds (gives user time to read toast)
setTimeout(() => {
  router.push('/opd/triage-queue');
}, 1500);
```

### Why Toast + Redirect?
- **Visual feedback**: User knows action succeeded
- **Context**: Description explains what happens next
- **Automatic flow**: Redirects to next logical page
- **Non-blocking**: Toast disappears, doesn't require dismissal

### Error Pattern
```typescript
toast.error('Failed to save triage', {
  description: error.message,
});
// No redirect - keep user on form to retry
```

---

## Patient Search

### Two Access Points

**1. Global Header Search (Quick Access)**
- Always visible in header
- Autocomplete dropdown
- Search by Ghana Card, folder number, or name
- Navigates to patient detail page

**2. Patient List Page (Full Search)**
- `/patients` route
- Advanced filters
- Table view with pagination
- Export to CSV

### Why Two Search Methods?
- **Header search**: Quick lookup during workflow (doctor needs patient history)
- **Patient list**: Comprehensive search for administrative tasks

---

## Mobile & Tablet Optimization

### Decision
Optimize for tablets (10-12 inch screens) as primary device.

### UgandaEMR+ Learning
> "The platform optimizes for small screen sizes, such as tablets, ensuring a smooth user experience"

### Responsive Breakpoints
- Mobile (320px-768px): Single column layout
- Tablet (768px-1024px): Optimized for clinical use
- Desktop (1024px+): Full multi-column layout

### Touch Optimization
- Button min height: 44px (Apple Human Interface Guidelines)
- Adequate spacing between interactive elements
- Large form inputs for easy data entry
- Swipe gestures for queue navigation (future enhancement)

---

## References

### Industry Standards
- **UgandaEMR+**: https://openmrs.org/ugandaemr-o3-success-story/
- **OpenMRS 3.x Design System**: https://om.rs/design
- **Bahmni UX Documentation**: https://bahmni.atlassian.net/wiki/spaces/BAH/overview

### Internal Documents
- `docs/UGANDA_EMR_REFERENCE.md` - UgandaEMR architecture deep dive
- `docs/product/WHITE_LABEL_ARCHITECTURE.md` - White-label strategy
- `UGANDAEMR_MEDREG_COMPARISON_REPORT.md` - Detailed comparison

### Healthcare UX Research
- Apple Human Interface Guidelines (Health Apps)
- NHS Digital Service Manual
- HIMSS Healthcare UX Guidelines

---

**Document Version**: 1.0
**Last Updated**: November 3, 2025
**Maintained By**: MedReg Product Team
```

**Files to Create:**
- `docs/UX_PATTERNS.md`

**Time:** 1 hour

---

### 3.4 Create User Journey Documentation

**Files to Create:**

```markdown
<!-- docs/USER_JOURNEYS.md -->
# MedReg User Journeys

Complete walkthrough of all user workflows in the MedReg system.

## Journey 1: Patient Registration → First Consultation

### Actors
- **Records Officer** (Registration desk)
- **Nurse** (Triage station)
- **Doctor** (Consultation room)
- **Pharmacist** (Pharmacy)

### Complete Flow

#### Step 1: Patient Arrives at Facility
**Actor**: Patient
**Action**: Walks into facility reception

---

#### Step 2: Patient Registration
**Actor**: Records Officer

1. Opens MedReg at `app.medreg.com.gh`
2. Sees login screen (direct entry, no marketing homepage)
3. Enters credentials: `username`, `password`
4. Selects work location: "Reception"
5. Lands on dashboard

**Dashboard View**:
```
┌─────────────────────────────────────┐
│ Dashboard                            │
│                                      │
│ ┌─────────────────┐  ┌────────────┐ │
│ │ OPD Encounters  │  │ Register   │ │
│ │ Today: 23       │  │ Patient    │ │
│ └─────────────────┘  └────────────┘ │
│                                      │
│ Quick Actions:                       │
│ [Register New Patient]               │
└─────────────────────────────────────┘
```

6. Clicks "Register New Patient" button
7. Opens registration form at `/patients/register`

**Registration Form**:
- Ghana Card Number (scans or types)
- Full Name (auto-populates from Ghana Card if integrated)
- Date of Birth
- Gender
- Phone Number
- NHIS Number (optional)
- Address

8. Clicks "Register Patient"
9. System validates data:
   - Ghana Card format (GHA-XXXXXXXXX-X)
   - Duplicate check (no existing patient with same Ghana Card)
   - NHIS format (if provided)
10. **Backend Action**: Creates patient in OpenMRS + Adds to triage queue
11. Redirects to success page showing:
    - Folder Number: `KBH/2025/00142`
    - NHIE Sync Status: "Pending..." (polling)
    - Queue Number: `TR001`

**Success Page Actions**:
- [Print Folder Card] - For physical folder
- [Go to Dashboard] - Return to reception desk
- [Register Another Patient]

**Backend Workflow** (automatic):
```sql
-- OpenMRS creates patient
INSERT INTO patient (patient_id, uuid, ...) VALUES (...);

-- Queue service adds to triage
INSERT INTO ghanaemr_patient_queue (patient_id, visit_id, location_to_id, status, queue_number)
VALUES (patient_id, visit_id, triage_location_id, 'PENDING', 'TR001');

-- NHIE integration (async)
-- Submits patient to Ghana NHIE via FHIR R4 API
POST https://nhie.moh.gov.gh/fhir/Patient
```

---

#### Step 3: Patient Directed to Triage
**Actor**: Records Officer

**Action**: Verbally directs patient to triage station
**Patient receives**: Folder card with number `KBH/2025/00142` and queue number `TR001`

---

#### Step 4: Triage Nurse Sees Queue
**Actor**: Nurse

1. Nurse is already logged in at triage station
2. Dashboard shows **Triage Queue Widget**:

```
┌──────────────────────────────────────┐
│ My Triage Queue                      │
│ 3 patients waiting                   │
│                                      │
│ TR001  Kofi Mensah      5 min  [Start]│
│ TR002  Ama Serwaa      12 min  [Start]│
│ TR003  Kwame Osei      18 min  [Start]│
│                                      │
│ [View All Queue]                     │
└──────────────────────────────────────┘
```

3. Clicks "Start" for TR001 (Kofi Mensah)
4. Opens triage form at `/opd/triage?patientUuid=xxx&queueUuid=yyy`

**Triage Form**:

Breadcrumb: `Dashboard > Triage Queue > Record Vitals`

**Auto-filled**:
- Patient Name: Kofi Mensah
- Folder Number: KBH/2025/00142
- Ghana Card: GHA-******789-2 (masked)

**Nurse Enters**:
- Temperature: 37.2°C
- Weight: 68 kg
- Height: 172 cm
- Blood Pressure: 120/80 mmHg
- Pulse: 72 bpm
- Oxygen Saturation: 98%
- Chief Complaint: "Fever and headache for 3 days"

5. Clicks "Save Triage"

**Backend Workflow**:
```java
// Save vitals as OpenMRS encounter
Encounter triageEncounter = new Encounter();
triageEncounter.setEncounterType(triageEncounterType);
triageEncounter.setPatient(patient);
// ... add obs for each vital sign

// Complete triage queue entry
queueService.updateQueueStatus(triageQueue, QueueStatus.COMPLETED);

// Add patient to consultation queue (automatic routing)
queueService.addToQueue(patient, visit, consultationLocation, 5);
// New queue number: CN001
```

6. Toast notification: "✓ Triage saved. Patient sent to consultation queue."
7. Auto-redirect to `/opd/triage-queue` after 1.5 seconds
8. Next patient (TR002) now at top of queue

---

#### Step 5: Doctor Sees Consultation Queue
**Actor**: Doctor

1. Doctor logged in at consultation room
2. Dashboard shows **Consultation Queue Widget**:

```
┌──────────────────────────────────────┐
│ My Consultation Queue                │
│ 5 patients waiting                   │
│                                      │
│ CN001  Kofi Mensah     2 min  [Start]│
│ CN002  Akua Asante    15 min  [Start]│
│ CN003  Yaw Boateng    23 min  [Start]│
│                                      │
│ [View All Queue]                     │
└──────────────────────────────────────┘
```

3. Clicks "Start" for CN001 (Kofi Mensah)
4. Opens consultation form at `/opd/consultation?patientUuid=xxx&queueUuid=yyy`

**Consultation Form**:

Breadcrumb: `Dashboard > Consultation Queue > Patient Consultation`

**Pre-filled from Triage**:
- Patient: Kofi Mensah, 32M
- Vitals: Temp 37.2°C, BP 120/80, Weight 68kg
- Chief Complaint: "Fever and headache for 3 days"

**Doctor Completes**:

**Clinical Notes**:
```
Patient presents with fever (onset 3 days ago) and frontal headache.
No neck stiffness. No photophobia. Temp 37.2°C (mild pyrexia).
Positive for malaria RDT.
```

**Diagnoses** (quick picks):
- ✓ Malaria, unspecified (B54)

**Prescriptions** (from 50 essential medicines list):
- ✓ Artemether/Lumefantrine 80/480mg - 6 tablets
  - Dosage: 4 tablets stat, then 4 tablets after 8 hours
- ✓ Paracetamol 500mg - 12 tablets
  - Dosage: 2 tablets every 6 hours for pain/fever

**Lab Orders**:
- ✓ Full Blood Count (FBC)
- ✓ Malaria RDT (already done, confirm in lab)

5. Clicks "Save Consultation"

**Backend Workflow**:
```java
// Create consultation encounter
Encounter consultationEncounter = new Encounter();
consultationEncounter.setEncounterType(consultationEncounterType);

// Add diagnoses as obs
Obs diagnosis = new Obs();
diagnosis.setConcept(diagnosisConcept);
diagnosis.setValueCoded(malariaConcept); // B54

// Create drug orders
DrugOrder drugOrder1 = new DrugOrder();
drugOrder1.setDrug(artemether);
drugOrder1.setDose(4.0);
drugOrder1.setDoseUnits(tablets);
drugOrder1.setFrequency(twiceDaily);
drugOrder1.setDuration(1);
drugOrder1.setDurationUnits(days);

// Complete consultation queue
queueService.updateQueueStatus(consultationQueue, QueueStatus.COMPLETED);

// Add to pharmacy queue (automatic routing)
queueService.addToQueue(patient, visit, pharmacyLocation, 5);
// New queue number: PH001
```

6. Toast: "✓ Consultation saved. Patient sent to pharmacy."
7. Auto-redirect to consultation queue

---

#### Step 6: Pharmacy Dispensing
**Actor**: Pharmacist

1. Pharmacist sees **Pharmacy Queue**:

```
┌──────────────────────────────────────┐
│ My Pharmacy Queue                    │
│ 4 patients waiting                   │
│                                      │
│ PH001  Kofi Mensah     1 min  [Start]│
│ PH002  Akua Asante    10 min  [Start]│
└──────────────────────────────────────┘
```

2. Clicks "Start" for PH001
3. Opens dispense form at `/opd/dispense?patientUuid=xxx&queueUuid=yyy`

**Dispense Form**:

**Pre-filled from Consultation**:
- Patient: Kofi Mensah, 32M
- Diagnoses: Malaria (B54)
- Prescriptions:
  1. Artemether/Lumefantrine 80/480mg × 6 tablets
  2. Paracetamol 500mg × 12 tablets

**Pharmacist Actions**:

**Billing Type**:
- ◉ NHIS (Ghana National Health Insurance)
- ○ Cash

**Dispense Items**:
```
Drug                            Qty Prescribed  Qty Dispensed  Stock After
────────────────────────────────────────────────────────────────────────
Artemether/Lumefantrine 80/480   6 tablets      6 tablets      142
Paracetamol 500mg               12 tablets     12 tablets      856
```

4. Clicks "Dispense Drugs"

**Backend Workflow**:
```java
// Create dispense encounter
Encounter dispenseEncounter = new Encounter();

// Update drug order status
drugOrder1.setFulfillerStatus(OrderFulfillerStatus.COMPLETED);

// Update inventory (decrease stock)
inventoryService.adjustStock(artemether, -6, "Dispensed to " + patient.getDisplay());

// Complete pharmacy queue
queueService.completeQueueEntry(pharmacyQueue);

// Mark visit as completed (no more stations)
visit.setStopDatetime(new Date());
```

5. Toast: "✓ Drugs dispensed successfully. Patient visit complete."
6. Prints receipt for patient
7. Redirects to pharmacy queue

---

#### Step 7: Patient Leaves Facility
**Patient receives**:
- Physical drugs (Artemether/Lumefantrine, Paracetamol)
- Printed receipt
- Verbal instructions from pharmacist on drug usage

**System State**:
```
Patient: Kofi Mensah (KBH/2025/00142)
Visit Status: COMPLETED
Encounters Created:
  1. Triage (10:05 AM) - Vitals recorded
  2. OPD Consultation (10:15 AM) - Malaria diagnosed
  3. Pharmacy Dispense (10:30 AM) - Drugs dispensed

NHIE Sync Status: SUCCESS (synced at 10:32 AM)
NHIE Patient ID: GH-PAT-2025-0014892

Queue Journey:
  TR001 (Triage)    → 10 min wait
  CN001 (Consult)   →  2 min wait
  PH001 (Pharmacy)  →  1 min wait
Total time in facility: 35 minutes
```

---

## Journey 2: Follow-Up Visit (Existing Patient)

### Scenario
Patient Kofi Mensah returns 1 week later for follow-up.

### Flow

1. **Reception**: Records officer searches for existing patient
   - Uses global patient search in header
   - Types "KBH/2025/00142" (folder number)
   - Selects patient from dropdown
   - Opens patient detail page

2. **Patient Hub**:
   ```
   ┌────────────────────────────────────────┐
   │ Patient Details                        │
   │ Kofi Mensah, 32M                       │
   │ Folder: KBH/2025/00142                 │
   │ Ghana Card: GHA-******789-2            │
   │ NHIS: 123456789                        │
   │                                        │
   │ Encounter History                      │
   │ • 2025-10-27: OPD Consultation         │
   │   Diagnosis: Malaria (B54)             │
   │   Rx: Artemether/Lumefantrine          │
   │                                        │
   │ OPD Workflow                           │
   │ [Triage] [Consultation] [Dispense]     │
   └────────────────────────────────────────┘
   ```

3. Clicks "Triage" button
4. System creates new visit + adds to triage queue
5. Workflow proceeds same as Journey 1 (Steps 4-7)

**Key Difference**: Patient already exists, no registration needed

---

## Journey 3: Admin Monitors NHIE Sync Issues

### Actor
**Platform Admin**

### Flow

1. Login → Dashboard shows:
   ```
   ┌─────────────────────────────────────┐
   │ System Overview                      │
   │ OPD Encounters Today: 45             │
   │ NHIE Sync Status: Connected          │
   │ DLQ Count: 3 (needs attention)       │
   └─────────────────────────────────────┘
   ```

2. Clicks "DLQ Count: 3"
3. Opens `/admin/nhie-queue`

**NHIE Dead Letter Queue**:
```
Transaction ID  Patient            Error                          Action
─────────────────────────────────────────────────────────────────────────
TXN-001         Akua Asante        Timeout (NHIE server down)     [Requeue]
TXN-005         Yaw Boateng        Invalid Ghana Card format      [Edit] [Requeue]
TXN-012         Ama Serwaa         Duplicate patient in NHIE      [Merge] [Requeue]
```

4. For TXN-001: Clicks "Requeue" (NHIE server is back online)
5. For TXN-005: Clicks "Edit" → Corrects Ghana Card → Requeues
6. For TXN-012: Investigates duplicate → Merges in NHIE → Requeues

**System automatically retries** failed transactions based on retry policy (8 attempts with exponential backoff).

---

## Journey 4: Doctor Views Reports

### Actor
**Doctor or Admin**

### Flow

1. Clicks "Reports" in global nav
2. Opens `/reports`

**Reports Dashboard**:
```
┌─────────────────────────────────────────────────┐
│ Reports & Analytics                             │
│                                                 │
│ Date Range: [2025-10-01] to [2025-10-31]       │
│ Location: [All Locations ▼]  [Reload]          │
│                                                 │
│ NHIS vs Cash                                    │
│ ┌──────────────────┐  ┌─────────────────────┐  │
│ │ NHIS: 234 (78%)  │  │ Cash: 66 (22%)      │  │
│ └──────────────────┘  └─────────────────────┘  │
│                                                 │
│ Top 10 Diagnoses                                │
│ 1. Malaria (B54)                   89 cases    │
│ 2. Upper Respiratory Tract Inf.    67 cases    │
│ 3. Essential Hypertension           45 cases    │
│                                                 │
│ OPD Register (Today)                            │
│ Folder      Name          Diagnosis     Rx      │
│ KBH.../142  Kofi Mensah   Malaria      AL      │
│ KBH.../143  Akua Asante   URTI         Amox    │
│                                                 │
│ Download Reports                                │
│ [OPD Register CSV]  [NHIS/Cash CSV]             │
│ [Top Diagnoses CSV]  [Revenue Report CSV]       │
└─────────────────────────────────────────────────┘
```

3. Selects date range + location filter
4. Clicks "Reload" to update stats
5. Downloads CSV for further analysis in Excel

**Use Cases**:
- Monthly reporting to Ghana MoH
- NHIS claims submission
- Disease surveillance (malaria cases)
- Facility performance monitoring

---

## Navigation Patterns Summary

### Global Navigation (Always Visible)
```
[MedReg Logo] [🔍 Search Patients]
[Dashboard] [Patients] [Queue] [Reports] [Admin] [User ▼]
```

### Breadcrumbs (Context Navigation)
```
Dashboard > Consultation Queue > Patient Consultation
       ↑          ↑                    ↑
    (clickable back navigation)
```

### Role-Based Menu Visibility
- **Nurse**: Dashboard, Triage Queue, Patients, Reports
- **Doctor**: Dashboard, Consultation Queue, Patients, Reports
- **Pharmacist**: Dashboard, Pharmacy Queue, Patients, Reports
- **Admin**: Dashboard, All Queues, Patients, Reports, Admin, NHIE Queue
- **Records Officer**: Dashboard, Patients (Registration), Reports

---

## Key UX Principles Applied

### 1. Queue-First Workflow
Clinicians work from queues (fair, efficient, prevents missed patients)

### 2. Automatic Routing
Patient flows through stations without manual intervention

### 3. Breadcrumb Navigation
Always know where you are, easy to go back

### 4. Toast + Redirect
Clear success feedback, automatic next step

### 5. Role-Based Dashboards
See only what's relevant to your role

### 6. Global Patient Search
Quick access to any patient from header

### 7. Pre-filled Forms
Reduce data entry (vitals flow from triage to consultation)

### 8. Real-Time Queue Updates
Polling every 10 seconds keeps queue fresh

---

**Document Version**: 1.0
**Last Updated**: November 3, 2025
**Based On**: UgandaEMR+ implementation patterns
```

**Files to Create:**
- `docs/USER_JOURNEYS.md`

**Time:** 1 hour

---

### Phase 3 Summary

**Total Time:** 3-4 hours
**Files Created:** 3 (breadcrumb component, 2 documentation files)
**Files Modified:** 13 (add breadcrumbs to 9 pages, toast to 4 pages)

**Deliverables:**
- ✓ Breadcrumb navigation component
- ✓ Breadcrumbs added to all OPD pages
- ✓ Standardized toast notifications
- ✓ Consistent redirect patterns
- ✓ Comprehensive UX patterns documentation
- ✓ Complete user journey documentation

**Testing Checklist:**
```
[ ] Breadcrumbs visible on all pages
[ ] Breadcrumbs clickable (navigate to parent pages)
[ ] Toast notifications appear on success
[ ] Toast notifications appear on error
[ ] Automatic redirect after success (1.5 seconds)
[ ] No redirect after error (allow retry)
[ ] UX patterns documented
[ ] User journeys documented with screenshots
```

---

## Complete Implementation Summary

### Total Effort Estimate
- **Phase 1**: 4 hours
- **Phase 2**: 5-6 hours
- **Phase 3**: 3-4 hours
- **Total**: **12-14 hours** (1.5 - 2 sprints)

### Files Created
**Total: 21 new files**

**Backend (7 files)**:
- liquibase-queue-management.xml
- PatientQueueService.java
- PatientQueue.java (model)
- QueueStatus.java (enum)
- PatientQueueServiceImpl.java
- PatientQueueDAO.java
- HibernatePatientQueueDAO.java

**Frontend (11 files)**:
- patient-search-header.tsx
- triage-queue/page.tsx
- consultation-queue/page.tsx
- pharmacy-queue/page.tsx
- api/opd/queue/[location]/route.ts
- api/opd/queue/move/route.ts
- breadcrumb.tsx
- toast-provider.tsx
- docs/UX_PATTERNS.md
- docs/USER_JOURNEYS.md
- docs/implementation/USER_JOURNEY_IMPLEMENTATION_PLAN.md (this file)

### Files Modified
**Total: 15 files**

**Phase 1 (5 files)**:
- page.tsx (homepage redirect)
- layout.tsx (global nav)
- opd/triage/page.tsx (cancel button)
- opd/consultation/page.tsx (cancel button)
- opd/dispense/page.tsx (cancel button)

**Phase 2 (5 files)**:
- liquibase.xml (include queue schema)
- moduleApplicationContext.xml (register queue service)
- dashboard/page.tsx (queue widgets)
- opd/triage/page.tsx (queue integration)
- opd/consultation/page.tsx (queue integration)
- opd/dispense/page.tsx (queue integration)

**Phase 3 (13 files - add breadcrumbs & toast)**:
- layout.tsx (toast provider)
- 9 pages (add breadcrumbs)
- 3 OPD pages (toast notifications)

---

## Testing Strategy

### Unit Tests
**Backend**:
```java
// backend/.../PatientQueueServiceTest.java
@Test
public void shouldAddPatientToQueue() {
    PatientQueue queue = queueService.addToQueue(patient, visit, triageLocation, 5);
    assertEquals(QueueStatus.PENDING, queue.getStatus());
    assertEquals("TR001", queue.getQueueNumber());
}

@Test
public void shouldMovePatientToNextStation() {
    PatientQueue triageQueue = queueService.addToQueue(patient, visit, triageLocation, 5);
    PatientQueue consultQueue = queueService.moveToNextStation(triageQueue, consultationLocation);

    assertEquals(QueueStatus.COMPLETED, triageQueue.getStatus());
    assertEquals(QueueStatus.PENDING, consultQueue.getStatus());
    assertEquals("CN001", consultQueue.getQueueNumber());
}
```

**Frontend**:
```typescript
// frontend/src/components/patient/__tests__/patient-search-header.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PatientSearchHeader } from '../patient-search-header';

test('searches patients by Ghana Card', async () => {
  render(<PatientSearchHeader />);

  const input = screen.getByPlaceholderText('Ghana Card, Folder #, or Name');
  fireEvent.change(input, { target: { value: 'GHA-123' } });

  await waitFor(() => {
    expect(screen.getByText('Kofi Mensah')).toBeInTheDocument();
  });
});
```

### Integration Tests
**End-to-End Flow**:
```typescript
// frontend/e2e/opd-workflow.spec.ts (Playwright)
test('complete OPD workflow: Registration → Triage → Consultation → Pharmacy', async ({ page }) => {
  // 1. Login as Records Officer
  await page.goto('http://localhost:3001');
  await page.fill('[name="username"]', 'records_officer');
  await page.fill('[name="password"]', 'password');
  await page.click('button:has-text("Sign In")');

  // 2. Register patient
  await page.click('text=Register New Patient');
  await page.fill('[name="ghanaCardNumber"]', 'GHA-123456789-1');
  await page.fill('[name="firstName"]', 'Test');
  await page.fill('[name="lastName"]', 'Patient');
  await page.click('button:has-text("Register Patient")');

  // 3. Verify patient added to triage queue
  await expect(page.locator('text=TR001')).toBeVisible();

  // 4. Login as Nurse
  await page.click('text=User ▼');
  await page.click('text=Logout');
  await page.fill('[name="username"]', 'nurse');
  await page.fill('[name="password"]', 'password');
  await page.click('button:has-text("Sign In")');

  // 5. Start triage from queue
  await page.click('text=View All Queue');
  await page.click('button:has-text("Start Triage")');

  // 6. Record vitals
  await page.fill('[name="temperature"]', '37.2');
  await page.fill('[name="weight"]', '68');
  await page.fill('[name="height"]', '172');
  await page.click('button:has-text("Save Triage")');

  // 7. Verify toast notification
  await expect(page.locator('text=Triage saved successfully')).toBeVisible();

  // 8. Verify redirect to triage queue
  await expect(page).toHaveURL(/\/opd\/triage-queue/);

  // 9. Login as Doctor and continue...
  // (Similar steps for consultation and pharmacy)
});
```

### Manual Testing Checklist
```
□ Phase 1: Entry Point & Navigation
  □ Visit / → Redirects to /login (not authenticated)
  □ Visit / → Redirects to /dashboard (authenticated)
  □ Patient search finds by Ghana Card
  □ Patient search finds by folder number
  □ Patient search finds by name
  □ "Patients" link visible in nav
  □ Cancel buttons work on all OPD forms
  □ User menu shows current user
  □ Logout redirects to login

□ Phase 2: Queue Management
  □ Register patient → Appears in triage queue
  □ Triage queue shows correct wait times
  □ Start triage from queue → Form pre-filled with patient UUID
  □ Save triage → Patient moves to consultation queue
  □ Dashboard shows triage queue widget (nurse)
  □ Dashboard shows consultation queue widget (doctor)
  □ Dashboard shows pharmacy queue widget (pharmacist)
  □ Queue numbers generated correctly (TR001, CN001, PH001)
  □ Priority patients shown first (urgent > high > normal)
  □ Queue polling updates every 10 seconds

□ Phase 3: Enhanced UX
  □ Breadcrumbs visible on all pages
  □ Breadcrumbs clickable
  □ Toast appears on success
  □ Toast appears on error
  □ Auto-redirect after success (1.5 sec)
  □ No redirect after error
```

---

## Environment Variables

### Backend
Add to OpenMRS module configuration:

```properties
# module-config.properties
ghanaemr.triage.location.uuid=<triage-location-uuid>
ghanaemr.consultation.location.uuid=<consultation-location-uuid>
ghanaemr.pharmacy.location.uuid=<pharmacy-location-uuid>
```

### Frontend
Add to `frontend/.env.local`:

```bash
# Queue Management
NEXT_PUBLIC_TRIAGE_LOCATION_UUID=<from-openmrs>
NEXT_PUBLIC_CONSULTATION_LOCATION_UUID=<from-openmrs>
NEXT_PUBLIC_PHARMACY_LOCATION_UUID=<from-openmrs>

# Queue Polling Interval (milliseconds)
NEXT_PUBLIC_QUEUE_POLL_INTERVAL=10000
```

---

## Database Migrations

### Running Liquibase Migrations

**Development**:
```bash
cd backend/openmrs-module-ghanaemr
mvn clean install -DskipTests
```

**Production**:
1. Backup database before migration:
   ```bash
   mysqldump -u root -p openmrs > backup_$(date +%Y%m%d).sql
   ```

2. Deploy new .omod file:
   ```bash
   docker cp openmrs-module-ghanaemr/omod/target/*.omod medreg-openmrs:/root/.OpenMRS/modules/
   docker restart medreg-openmrs
   ```

3. Verify migration:
   ```sql
   -- Check if table was created
   SHOW TABLES LIKE 'ghanaemr_patient_queue';

   -- Check table structure
   DESCRIBE ghanaemr_patient_queue;

   -- Verify liquibase ran
   SELECT * FROM liquibasechangelog
   WHERE id = 'ghanaemr-queue-1'
   ORDER BY dateexecuted DESC LIMIT 1;
   ```

---

## Rollback Plan

### If Issues Arise During Implementation

**Phase 1 Rollback**:
```bash
# Revert homepage redirect
git checkout HEAD -- frontend/src/app/page.tsx

# Revert nav changes
git checkout HEAD -- frontend/src/app/layout.tsx

# Remove patient search component
rm frontend/src/components/patient/patient-search-header.tsx
```

**Phase 2 Rollback**:
```sql
-- Drop queue table
DROP TABLE IF EXISTS ghanaemr_patient_queue;

-- Remove liquibase changeset
DELETE FROM liquibasechangelog WHERE id = 'ghanaemr-queue-1';
```

```bash
# Rebuild without queue module
cd backend/openmrs-module-ghanaemr
git checkout HEAD -- api/src/main/resources/liquibase.xml
mvn clean install -DskipTests
```

**Phase 3 Rollback**:
```bash
# Remove breadcrumbs
rm frontend/src/components/ui/breadcrumb.tsx

# Revert toast changes
git checkout HEAD -- frontend/src/app/layout.tsx
```

---

## Success Criteria

### Phase 1 Success
- [ ] Homepage redirects correctly (authenticated vs not)
- [ ] Global patient search works (3+ search methods)
- [ ] All nav links functional
- [ ] Cancel buttons on all forms
- [ ] User can logout from any page

### Phase 2 Success
- [ ] Patient registration adds to triage queue
- [ ] Nurses see triage queue on dashboard
- [ ] Doctors see consultation queue on dashboard
- [ ] Pharmacists see pharmacy queue on dashboard
- [ ] Completing triage moves patient to consultation queue
- [ ] Completing consultation moves patient to pharmacy queue
- [ ] Completing dispense marks visit complete
- [ ] Queue numbers generate correctly
- [ ] Wait times calculate correctly

### Phase 3 Success
- [ ] Breadcrumbs show on all pages
- [ ] Breadcrumbs navigate correctly
- [ ] Toast notifications consistent across all forms
- [ ] Auto-redirect after success
- [ ] Documentation complete and accurate

---

## Deployment Checklist

### Pre-Deployment
```
□ All unit tests passing
□ All integration tests passing
□ Manual testing complete
□ Database backup taken
□ Environment variables configured
□ Documentation reviewed
□ Rollback plan prepared
```

### Deployment Steps
```
□ 1. Deploy backend module
   □ Build .omod file
   □ Copy to OpenMRS modules directory
   □ Restart OpenMRS
   □ Verify liquibase migration succeeded
   □ Check OpenMRS logs for errors

□ 2. Deploy frontend
   □ Update environment variables
   □ Build Next.js app
   □ Restart frontend service
   □ Clear browser cache
   □ Test homepage redirect

□ 3. Verify deployment
   □ Test patient registration
   □ Test queue visibility
   □ Test complete OPD workflow
   □ Check NHIE integration still works
   □ Monitor logs for errors
```

### Post-Deployment
```
□ Smoke test critical workflows
□ Monitor error logs (first 30 minutes)
□ User acceptance testing (UAT)
□ Document any issues
□ Communicate to stakeholders
```

---

## Known Limitations & Future Enhancements

### Current Limitations
1. **No provider assignment**: Queue entries don't assign specific providers (all doctors see all patients)
2. **No queue prioritization UI**: Priority field exists in database but no UI to set priority
3. **No queue transfer**: Can't move patient to different queue without completing current station
4. **No queue pause/resume**: Can't pause a patient's queue entry (e.g., waiting for lab results)

### Future Enhancements (v2)
1. **Provider-specific queues**: Assign patients to specific doctors
2. **Queue management admin panel**: View all queues across facility, transfer patients
3. **SMS notifications**: Notify patient when queue position approaches
4. **Queue analytics dashboard**: Average wait time, bottlenecks, staff performance
5. **Appointment integration**: Pre-registered appointment patients skip queue or get priority
6. **Queue display screen**: TV display in waiting area showing queue numbers
7. **Mobile app**: Patients check queue status on phone

---

## Support & Maintenance

### Contact Points
- **Technical Lead**: [Contact info]
- **Product Owner**: [Contact info]
- **DevOps**: [Contact info]

### Issue Reporting
- **GitHub Issues**: https://github.com/medreg/medreg-emr/issues
- **Slack Channel**: #medreg-support
- **Email**: support@medreg.com.gh

### Monitoring
- **Application Logs**: `/var/log/medreg/`
- **OpenMRS Logs**: Check via Docker: `docker logs medreg-openmrs`
- **Database**: Monitor `ghanaemr_patient_queue` table size and performance

---

## References

### External Resources
- **UgandaEMR+ Success Story**: https://openmrs.org/ugandaemr-o3-success-story/
- **OpenMRS 3.x Documentation**: https://om.rs/design
- **Bahmni EMR**: https://bahmni.atlassian.net/wiki/spaces/BAH/overview
- **FHIR R4 Specification**: https://www.hl7.org/fhir/R4/

### Internal Documentation
- `docs/UGANDA_EMR_REFERENCE.md` - UgandaEMR architecture analysis
- `docs/product/WHITE_LABEL_ARCHITECTURE.md` - White-label strategy
- `docs/02_NHIE_Integration_Technical_Specifications.md` - NHIE integration specs
- `UGANDAEMR_MEDREG_COMPARISON_REPORT.md` - Detailed comparison

### Design Assets
- Figma Design System: [Link if available]
- Brand Guidelines: [Link if available]
- UI Component Library: shadcn/ui (https://ui.shadcn.com/)

---

**Document Prepared By**: AI Assistant (Claude Code)
**Review Status**: Ready for Team Review
**Approval Required From**:
- [ ] Technical Lead
- [ ] Product Owner
- [ ] UX Designer
- [ ] Security Officer

**Implementation Start Date**: [TBD]
**Target Completion Date**: [TBD]

---

## Appendix A: Code Snippets

### Queue Service Usage Example

```java
// Example: Adding patient to triage queue after registration
@Transactional
public Patient registerNewPatient(GhanaPatientDTO dto) {
    // 1. Create patient
    Patient patient = patientService.savePatient(buildPatient(dto));

    // 2. Create visit
    Visit visit = visitService.saveVisit(createVisit(patient));

    // 3. Add to triage queue
    Location triageLocation = locationService.getLocationByUuid(
        Context.getAdministrationService().getGlobalProperty("ghanaemr.triage.location.uuid")
    );

    PatientQueue queueEntry = patientQueueService.addToQueue(
        patient,
        visit,
        triageLocation,
        5 // Normal priority
    );

    log.info("Patient {} added to triage queue with number {}",
        patient.getUuid(), queueEntry.getQueueNumber());

    return patient;
}
```

### Frontend Queue Hook

```typescript
// hooks/useQueue.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useQueue(locationUuid: string) {
  const queryClient = useQueryClient();

  const queue = useQuery({
    queryKey: ['queue', locationUuid],
    queryFn: async () => {
      const response = await fetch(`/api/opd/queue/${locationUuid}?status=PENDING`);
      if (!response.ok) throw new Error('Failed to fetch queue');
      return response.json();
    },
    refetchInterval: 10000,
  });

  const moveToNext = useMutation({
    mutationFn: async ({ queueUuid, nextLocationUuid }: any) => {
      const response = await fetch('/api/opd/queue/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueUuid, nextLocationUuid }),
      });
      if (!response.ok) throw new Error('Failed to move patient');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
    },
  });

  return { queue, moveToNext };
}
```

---

## Appendix B: Database Schema Details

### Queue Status Flow

```
PENDING
   │
   ├── User selects patient from queue
   │
   ▼
IN_PROGRESS
   │
   ├── User completes workflow step
   │
   ▼
COMPLETED
   │
   ├── System creates new queue entry for next station
   │
   ▼
(New PENDING entry at next station)
```

### Queue Number Generation Logic

```java
private String generateQueuePrefix(Location location) {
    String locationName = location.getName().toLowerCase();
    if (locationName.contains("triage")) return "TR";
    if (locationName.contains("consultation") || locationName.contains("opd")) return "CN";
    if (locationName.contains("pharmacy")) return "PH";
    if (locationName.contains("lab")) return "LB";
    return "QU"; // Generic queue
}

private int getNextQueueNumber(Location location, Date date) {
    // Get count of queue entries created today at this location
    String hql = "SELECT COUNT(*) FROM PatientQueue pq " +
                 "WHERE pq.locationTo = :location " +
                 "AND DATE(pq.dateCreated) = DATE(:date)";

    Long count = (Long) sessionFactory.getCurrentSession()
        .createQuery(hql)
        .setParameter("location", location)
        .setParameter("date", date)
        .uniqueResult();

    return count.intValue() + 1;
}
```

---

**End of Document**
