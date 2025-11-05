import { dockerExec } from '../utils/docker.js';
import { z } from 'zod';

export const RestartOpenMRSSchema = z.object({ waitSeconds: z.number().int().min(0).max(600).default(150) });
export type RestartOpenMRSInput = z.infer<typeof RestartOpenMRSSchema>;

export async function restartOpenMRS(_: RestartOpenMRSInput) {
  const { dockerRestart } = await import('../utils/docker.js');
  const OPENMRS_CONTAINER = process.env.OPENMRS_CONTAINER || 'medreg-openmrs';
  await dockerRestart(OPENMRS_CONTAINER);
  return { restarted: true };
}

export const WaitForStartupSchema = z.object({ timeoutSeconds: z.number().int().min(1).max(600).default(180), match: z.string().default('Started OpenMRS') });
export type WaitForStartupInput = z.infer<typeof WaitForStartupSchema>;

export async function waitForStartup(input: WaitForStartupInput) {
  const OPENMRS_CONTAINER = process.env.OPENMRS_CONTAINER || 'medreg-openmrs';
  const APPDATA_DIR = process.env.OPENMRS_APPDATA_DIR || '/usr/local/tomcat/.OpenMRS';
  const start = Date.now();
  while ((Date.now() - start) / 1000 < input.timeoutSeconds) {
    const { stdout } = await dockerExec(OPENMRS_CONTAINER, `grep -i ${JSON.stringify(input.match)} ${APPDATA_DIR}/openmrs.log || true`);
    if (stdout && stdout.trim().length > 0) {
      return { found: true, elapsed: Math.round((Date.now() - start) / 1000) };
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  return { found: false, elapsed: input.timeoutSeconds };
}

export const TailLogsSchema = z.object({ lines: z.number().int().min(1).max(2000).default(400), grep: z.string().optional(), caseInsensitive: z.boolean().default(true) });
export type TailLogsInput = z.infer<typeof TailLogsSchema>;

export async function tailOpenMRSLogs(input: TailLogsInput) {
  const OPENMRS_CONTAINER = process.env.OPENMRS_CONTAINER || 'medreg-openmrs';
  const APPDATA_DIR = process.env.OPENMRS_APPDATA_DIR || '/usr/local/tomcat/.OpenMRS';
  const { stdout } = await dockerExec(OPENMRS_CONTAINER, `tail -n ${input.lines} ${APPDATA_DIR}/openmrs.log`);
  if (input.grep) {
    const flags = input.caseInsensitive ? 'i' : '';
    const re = new RegExp(input.grep, flags);
    return stdout.split('\n').filter((l) => re.test(l)).join('\n');
  }
  return stdout;
}

export const ClearModuleCacheSchema = z.object({ moduleId: z.string() });
export type ClearModuleCacheInput = z.infer<typeof ClearModuleCacheSchema>;

export async function clearModuleCache(input: ClearModuleCacheInput) {
  const OPENMRS_CONTAINER = process.env.OPENMRS_CONTAINER || 'medreg-openmrs';
  const APPDATA_DIR = process.env.OPENMRS_APPDATA_DIR || '/usr/local/tomcat/.OpenMRS';
  await dockerExec(OPENMRS_CONTAINER, `rm -rf ${APPDATA_DIR}/.openmrs-lib-cache/*${input.moduleId}* || true`);
  return { cleared: true };
}

