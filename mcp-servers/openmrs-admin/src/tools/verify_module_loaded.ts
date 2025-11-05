import { z } from 'zod';
import { getModules, OpenMRSRestConfig } from '../utils/http.js';
import { dockerExec } from '../utils/docker.js';

export const VerifyModuleLoadedSchema = z.object({ moduleId: z.string().default('ghanaemr') });
export type VerifyModuleLoadedInput = z.infer<typeof VerifyModuleLoadedSchema>;

export async function verifyModuleLoaded(input: VerifyModuleLoadedInput) {
  const cfg: OpenMRSRestConfig = {
    baseUrl: process.env.OPENMRS_BASE_URL || 'http://localhost:8080/openmrs/ws/rest/v1',
    username: process.env.OPENMRS_USERNAME || 'admin',
    password: process.env.OPENMRS_PASSWORD || 'Admin123',
  };
  try {
    const data = await getModules(cfg);
    const modules = (data?.results || data?.modules || []) as any[];
    const found = modules.find((m) => m.moduleId === input.moduleId || m.id === input.moduleId || m.package?.includes(input.moduleId));
    return found ? { loaded: true, started: !!found.started, version: found.version || found.packageVersion || 'unknown' } : { loaded: false };
  } catch (e: any) {
    // Fallback: query from inside the OpenMRS container using curl (avoids host networking issues)
    const container = process.env.OPENMRS_CONTAINER || 'medreg-openmrs';
    const url = 'http://localhost:8080/openmrs/ws/rest/v1/module?v=full';
    const user = process.env.OPENMRS_USERNAME || 'admin';
    const pass = process.env.OPENMRS_PASSWORD || 'Admin123';
    try {
      const { stdout } = await dockerExec(container, `curl -s -u ${user}:${pass} ${url}`);
      const data = JSON.parse(stdout);
      const modules = (data?.results || data?.modules || []) as any[];
      const found = modules.find((m) => m.moduleId === input.moduleId || m.id === input.moduleId || m.package?.includes(input.moduleId));
      return found ? { loaded: true, started: !!found.started, version: found.version || found.packageVersion || 'unknown' } : { loaded: false };
    } catch (inner: any) {
      return { loaded: false, error: `REST failed (${e?.message}). Container fallback failed (${inner?.message}).` } as any;
    }
  }
}
