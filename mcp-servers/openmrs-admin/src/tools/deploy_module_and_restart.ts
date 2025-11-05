import { z } from 'zod';
import { dockerCp, dockerRestart } from '../utils/docker.js';
import { clearModuleCache } from './helpers.js';

export const DeployModuleAndRestartSchema = z.object({
  localPath: z.string().optional(),
  base64: z.string().optional(),
  filename: z.string().optional(),
  clearCache: z.boolean().default(true),
  waitSeconds: z.number().int().min(0).max(600).default(150),
});

export type DeployModuleAndRestartInput = z.infer<typeof DeployModuleAndRestartSchema>;

export async function deployModuleAndRestart(input: DeployModuleAndRestartInput) {
  const MODULES_DIR = process.env.OPENMRS_MODULES_DIR || '/usr/local/tomcat/.OpenMRS/modules';
  const OPENMRS_CONTAINER = process.env.OPENMRS_CONTAINER || 'medreg-openmrs';

  let filename = input.filename;

  if (input.localPath) {
    const dest = `${OPENMRS_CONTAINER}:${MODULES_DIR}/`;
    await dockerCp(input.localPath, dest);
    filename = input.localPath.split(/[/\\]/).pop();
  } else if (input.base64 && input.filename) {
    // Write base64 to a temp file path and docker cp
    const fs = await import('fs');
    const path = await import('path');
    const tmpPath = path.join(process.cwd(), `.tmp_${Date.now()}_${input.filename}`);
    fs.writeFileSync(tmpPath, Buffer.from(input.base64, 'base64'));
    try {
      await dockerCp(tmpPath, `${OPENMRS_CONTAINER}:${MODULES_DIR}/${input.filename}`);
    } finally {
      fs.unlinkSync(tmpPath);
    }
    filename = input.filename;
  } else {
    throw new Error('Provide either localPath or (base64 + filename)');
  }

  if (input.clearCache) {
    await clearModuleCache({ moduleId: 'ghanaemr' });
  }

  await dockerRestart(OPENMRS_CONTAINER);

  return {
    copied: true,
    cacheCleared: input.clearCache,
    restarted: true,
    moduleFile: filename,
    waited: input.waitSeconds,
  };
}

