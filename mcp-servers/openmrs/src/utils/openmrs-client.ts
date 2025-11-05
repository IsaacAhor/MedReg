/**
 * OpenMRS REST API Client
 * 
 * Handles authentication and API calls to OpenMRS
 * Base URL: http://localhost:8080/openmrs/ws/rest/v1
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// Inline PII masking (from shared)
function maskPII(text: string): string {
  return text
    .replace(/(GHA-\d{4})\d{5}-\d/g, '$1****-*')
    .replace(/(\d{4})\d{6}/g, '$1****');
}

export interface OpenMRSConfig {
  baseUrl: string;
  username: string;
  password: string;
}

export interface OpenMRSSession {
  authenticated: boolean;
  sessionId?: string;
  user?: {
    uuid: string;
    username: string;
    systemId: string;
    display: string;
  };
}

export interface OpenMRSError {
  message: string;
  code?: string;
  globalErrors?: Array<{ message: string; code: string }>;
  fieldErrors?: Record<string, Array<{ message: string; code: string }>>;
}

/**
 * OpenMRS REST API client with session management
 */
export class OpenMRSClient {
  private client: AxiosInstance;
  private config: OpenMRSConfig;
  private session?: OpenMRSSession;

  constructor(config: OpenMRSConfig) {
    this.config = config;
    
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      // Enable cookies for session management
      withCredentials: true,
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        return Promise.reject(this.formatError(error));
      }
    );
  }

  /**
   * Authenticate with OpenMRS and create session
   */
  async authenticate(): Promise<OpenMRSSession> {
    const allowFallback = (process.env.OPENMRS_ALLOW_BASEURL_FALLBACK || 'false').toLowerCase() === 'true';

    // First try configured base URL (fail fast if fallback disabled)
    try {
      const response = await axios.get(this.config.baseUrl + '/session', {
        auth: { username: this.config.username, password: this.config.password },
        timeout: 15000,
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });
      this.client.defaults.baseURL = this.config.baseUrl;
      this.session = response.data;
      return this.session;
    } catch (primaryErr: any) {
      if (!allowFallback) {
        throw new Error(`OpenMRS authentication failed at configured base URL (${this.config.baseUrl}): ${primaryErr?.message || primaryErr}`);
      }
    }

    // Dev-mode convenience: try localhost fallbacks
    const candidates = [
      'http://localhost:8080/openmrs/ws/rest/v1',
      'http://127.0.0.1:8080/openmrs/ws/rest/v1',
    ];
    const errors: string[] = [];
    for (const base of candidates) {
      try {
        const response = await axios.get(base + '/session', {
          auth: { username: this.config.username, password: this.config.password },
          timeout: 15000,
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        });
        this.client.defaults.baseURL = base;
        this.session = response.data;
        return this.session;
      } catch (e: any) {
        errors.push(`${base}: ${e?.message || 'unknown error'}`);
      }
    }
    throw new Error(`OpenMRS authentication failed. Primary=${this.config.baseUrl}. Fallbacks tried -> ${errors.join(' | ')}`);
  }

  /**
   * Get current session (authenticate if needed)
   */
  async getSession(): Promise<OpenMRSSession> {
    if (!this.session || !this.session.authenticated) {
      return await this.authenticate();
    }
    return this.session;
  }

  /**
   * Make authenticated GET request
   */
  async get<T = any>(path: string, params?: Record<string, any>): Promise<T> {
    await this.getSession();
    const response = await this.client.get(path, { params });
    return response.data;
  }

  /**
   * Make authenticated POST request
   */
  async post<T = any>(path: string, data: any): Promise<T> {
    await this.getSession();
    const response = await this.client.post(path, data);
    return response.data;
  }

  /**
   * Make authenticated PUT request
   */
  async put<T = any>(path: string, data: any): Promise<T> {
    await this.getSession();
    const response = await this.client.put(path, data);
    return response.data;
  }

  /**
   * Make authenticated DELETE request
   */
  async delete<T = any>(path: string): Promise<T> {
    await this.getSession();
    const response = await this.client.delete(path);
    return response.data;
  }

  /**
   * Search patients by Ghana Card, NHIS, name, etc.
   */
  async searchPatients(query: string): Promise<any[]> {
    const result = await this.get('/patient', { q: query, v: 'full' });
    return result.results || [];
  }

  /**
   * Get patient by UUID
   */
  async getPatient(uuid: string): Promise<any> {
    return await this.get(`/patient/${uuid}`, { v: 'full' });
  }

  /**
   * Create new patient
   */
  async createPatient(patientData: any): Promise<any> {
    return await this.post('/patient', patientData);
  }

  /**
   * Update patient
   */
  async updatePatient(uuid: string, patientData: any): Promise<any> {
    return await this.post(`/patient/${uuid}`, patientData);
  }

  /**
   * Visits API
   */
  async findActiveVisit(patientUuid: string): Promise<any | null> {
    const result = await this.get('/visit', { patient: patientUuid, includeInactive: false, v: 'full' });
    const visits = result.results || [];
    return visits.length ? visits[0] : null;
  }

  async createVisit(patientUuid: string, visitTypeUuid: string, locationUuid: string, startDatetime?: string): Promise<any> {
    const payload = {
      patient: patientUuid,
      visitType: visitTypeUuid,
      location: locationUuid,
      startDatetime: startDatetime || new Date().toISOString(),
    };
    return await this.post('/visit', payload);
  }

  async closeVisit(visitUuid: string, stopDatetime?: string): Promise<any> {
    const payload = { stopDatetime: stopDatetime || new Date().toISOString() } as any;
    return await this.post(`/visit/${visitUuid}`, payload);
  }

  /**
   * Get patient identifier types (Ghana Card, NHIS, Folder Number)
   */
  async getIdentifierTypes(): Promise<any[]> {
    const result = await this.get('/patientidentifiertype', { v: 'full' });
    return result.results || [];
  }

  /**
   * Get person attribute types (for NHIS number, phone, etc.)
   */
  async getPersonAttributeTypes(): Promise<any[]> {
    const result = await this.get('/personattributetype', { v: 'full' });
    return result.results || [];
  }

  /**
   * List encounter types (uuid, name, display)
   */
  async listEncounterTypes(): Promise<Array<{ uuid: string; name: string; display?: string }>> {
    const result = await this.get('/encountertype', { v: 'custom:(uuid,name,display)' });
    return (result.results || []).map((r: any) => ({ uuid: r.uuid, name: r.name, display: r.display }));
  }

  /**
   * List visit types (uuid, name, display)
   */
  async listVisitTypes(): Promise<Array<{ uuid: string; name: string; display?: string }>> {
    const result = await this.get('/visittype', { v: 'custom:(uuid,name,display)' });
    return (result.results || []).map((r: any) => ({ uuid: r.uuid, name: r.name, display: r.display }));
  }

  /**
   * List locations (uuid, name, display)
   */
  async listLocations(): Promise<Array<{ uuid: string; name: string; display?: string }>> {
    const result = await this.get('/location', { v: 'custom:(uuid,name,display)' });
    return (result.results || []).map((r: any) => ({ uuid: r.uuid, name: r.name, display: r.display }));
  }

  /**
   * List providers (uuid, identifier, person display)
   */
  async listProviders(): Promise<Array<{ uuid: string; identifier?: string; display?: string }>> {
    const result = await this.get('/provider', { v: 'custom:(uuid,identifier,display,person:(uuid,display))' });
    return (result.results || []).map((r: any) => ({ uuid: r.uuid, identifier: r.identifier, display: r.display || r.person?.display }));
  }

  /**
   * Search concepts by name/code
   */
  async listConcepts(query: string): Promise<Array<{ uuid: string; display: string; datatype?: string; conceptClass?: string }>> {
    const result = await this.get('/concept', { q: query, v: 'custom:(uuid,display,datatype:(display),conceptClass:(display))' });
    return (result.results || []).map((r: any) => ({ uuid: r.uuid, display: r.display, datatype: r.datatype?.display, conceptClass: r.conceptClass?.display }));
  }

  /**
   * List encounter roles
   */
  async listEncounterRoles(): Promise<Array<{ uuid: string; name: string; display?: string }>> {
    const result = await this.get('/encounterrole', { v: 'custom:(uuid,name,display)' });
    return (result.results || []).map((r: any) => ({ uuid: r.uuid, name: r.name, display: r.display }));
  }

  /**
   * Create encounter (basic)
   */
  async createEncounter(payload: any): Promise<any> {
    return await this.post('/encounter', payload);
  }

  /**
   * Format OpenMRS error
   */
  private formatError(error: AxiosError): Error {
    if (error.response?.data) {
      const openmrsError = error.response.data as OpenMRSError;
      
      let message = openmrsError.message || 'OpenMRS API error';
      
      if (openmrsError.globalErrors && openmrsError.globalErrors.length > 0) {
        message += '\n' + openmrsError.globalErrors.map((e: any) => e.message).join('\n');
      }
      
      if (openmrsError.fieldErrors) {
        const fieldErrorMessages = Object.entries(openmrsError.fieldErrors)
          .map(([field, errors]: [string, any]) => `${field}: ${errors.map((e: any) => e.message).join(', ')}`)
          .join('\n');
        message += '\n' + fieldErrorMessages;
      }
      
      // Mask any PII in final message
      return new Error(maskPII(message));
    }
    
    return error;
  }
}

/**
 * Create OpenMRS client from environment variables
 */
export function createOpenMRSClient(): OpenMRSClient {
  const config: OpenMRSConfig = {
    baseUrl: process.env.OPENMRS_BASE_URL || 'http://localhost:8080/openmrs/ws/rest/v1',
    username: process.env.OPENMRS_USERNAME || 'admin',
    password: process.env.OPENMRS_PASSWORD || 'Admin123',
  };

  return new OpenMRSClient(config);
}
