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
    try {
      const response = await this.client.get('/session', {
        auth: {
          username: this.config.username,
          password: this.config.password,
        },
      });

      this.session = response.data;
      return this.session;
    } catch (error) {
      throw new Error(`OpenMRS authentication failed: ${error}`);
    }
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
