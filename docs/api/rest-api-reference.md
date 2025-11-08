# REST API Reference Guide

This document provides a comprehensive reference for all custom REST endpoints in the Ghana EMR module.

## Authentication

All requests to these endpoints must be authenticated using the same session as the OpenMRS platform. The frontend BFF (Backend-for-Frontend) handles authentication; direct calls should include the JSESSIONID cookie.

---

## Endpoints

### Patient Management

#### `POST /ws/rest/v1/ghana/patients`

- **Description:** Registers a new patient.
- **Request Body:** See `GhanaPatientDTO` in the backend source.
- **Success Response:** `201 Created` with patient object.
- **Error Responses:** `400 Bad Request`, `409 Conflict`.

#### `POST /ws/rest/v1/ghana/patients/{uuid}/sync-nhie`

- **Description:** Triggers an asynchronous sync of the patient's data to the NHIE.
- **Request Body:** None.
- **Success Response:** `200 OK`.

### Consultation

#### `POST /ws/rest/v1/ghana/consultations`

- **Description:** Creates a new consultation encounter, including diagnoses, prescriptions, and lab orders.
- **Request Body:** TBD.
- **Success Response:** `201 Created`.
- **Error Responses:** `400 Bad Request`.

### Queue Management

#### `GET /ws/rest/v1/ghana/queue`

- **Description:** Retrieves the current patient queue for a given location.
- **Query Parameters:** `location_uuid`, `status`.
- **Success Response:** `200 OK` with a list of queue entries.

*(This document will be updated as new endpoints are added.)*
