import { z } from 'zod';
import { getModules, OpenMRSRestConfig } from '../utils/http.js';
import { dockerExec } from '../utils/docker.js';
import { mysqlQuery } from '../utils/mysql.js';

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
    const found = modules.find(
      (m) => m.moduleId === input.moduleId || m.id === input.moduleId || (typeof m.package === 'string' && m.package.indexOf(input.moduleId) !== -1)
    );
    if (found) {
      return { loaded: true, started: !!found.started, version: found.version || found.packageVersion || 'unknown' };
    }
    return { loaded: false };
  } catch (e: any) {
    const container = process.env.OPENMRS_CONTAINER || 'medreg-openmrs';
    const user = process.env.OPENMRS_USERNAME || 'admin';
    const pass = process.env.OPENMRS_PASSWORD || 'Admin123';

    // 1) Container REST fallback with stricter headers and dual paths
    const restCandidates = [
      'http://localhost:8080/openmrs/ws/rest/v1/module?v=full',
      'http://localhost:8080/ws/rest/v1/module?v=full',
    ];
    for (const url of restCandidates) {
      try {
        const { stdout } = await dockerExec(
          container,
          `curl -s -H "Accept: application/json" -u ${user}:${pass} ${url}`,
          30000
        );
        // Ensure we received JSON before parsing
        if (stdout && stdout.trim().startsWith('{')) {
          const data = JSON.parse(stdout);
          const modules = (data?.results || data?.modules || []) as any[];
          const found = modules.find(
            (m: any) => m.moduleId === input.moduleId || m.id === input.moduleId || (typeof m.package === 'string' && m.package.indexOf(input.moduleId) !== -1)
          );
          if (found) {
            return { loaded: true, started: !!found.started, version: found.version || found.packageVersion || 'unknown' };
          }
        }
      } catch (inner) {
        // try next candidate
      }
    }

    // 2) DB fallback: read global properties for module status
    try {
      const mysqlCfg = {
        container: process.env.MYSQL_CONTAINER || 'medreg-mysql',
        database: process.env.MYSQL_DB || 'openmrs',
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || 'root_password',
      };
      const startedSql = `SELECT property_value FROM global_property WHERE property = '${input.moduleId}.started'`;
      const startedOut = await mysqlQuery(mysqlCfg, startedSql);
      const started = /\btrue\b/i.test(startedOut);

      // Best-effort version detection: inspect modules directory for OMOD filename
      let version = 'unknown';
      try {
        const modulesDir = process.env.OPENMRS_MODULES_DIR || '/usr/local/tomcat/.OpenMRS/modules';
        const { stdout: lsOut } = await dockerExec(container, `ls -1 ${modulesDir} | grep -E '^openmrs-module-${input.moduleId}-.*\\.omod$' || true`);
        const line = (lsOut || '').split('\n').find((l) => l.trim().length > 0);
        if (line) {
          const m = line.match(new RegExp(`^openmrs-module-${input.moduleId}-(.+)\\.omod$`));
          if (m && m[1]) version = m[1];
        }
      } catch (_) {
        // ignore version detection errors
      }

      return { loaded: started, started, version } as any;
    } catch (dbErr: any) {
      // Final fallback: report the original and fallback errors succinctly
      return { loaded: false, error: `REST failed (${e?.message}). Container/DB fallbacks unavailable (${dbErr?.message || 'unknown error'}).` } as any;
    }
  }
}
