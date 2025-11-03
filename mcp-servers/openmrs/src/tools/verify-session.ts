/**
 * Verify OpenMRS Session MCP Tool
 */

import { z } from 'zod';
import { OpenMRSClient } from '../utils/openmrs-client.js';

export const VerifySessionSchema = z.object({});

export interface VerifySessionResult {
  success: boolean;
  authenticated?: boolean;
  user?: { uuid: string; username: string; display: string };
  error?: string;
}

export async function verifySession(
  _input: unknown,
  client: OpenMRSClient
): Promise<VerifySessionResult> {
  try {
    const session = await client.getSession();
    return {
      success: true,
      authenticated: session.authenticated,
      user: session.user ? { uuid: session.user.uuid, username: session.user.username, display: session.user.display } : undefined,
    };
  } catch (error: any) {
    return { success: false, error: `Failed to verify session: ${error.message}` };
  }
}

