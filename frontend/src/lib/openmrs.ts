import axios from 'axios';

// Dedicated client for OpenMRS REST endpoints
const openmrs = axios.create({
  baseURL: process.env.NEXT_PUBLIC_OPENMRS_API_URL || 'http://localhost:8080/openmrs/ws/rest/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  withCredentials: true,
});

export default openmrs;

