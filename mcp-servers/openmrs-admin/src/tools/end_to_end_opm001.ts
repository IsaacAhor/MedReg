import { z } from 'zod';
import { deployModuleAndRestart, DeployModuleAndRestartSchema } from './deploy_module_and_restart.js';
import { waitForStartup, WaitForStartupSchema } from './helpers.js';
import { verifyModuleLoaded } from './verify_module_loaded.js';
import { verifyQueueSchema } from './verify_queue_schema.js';

export const EndToEndOpm001Schema = DeployModuleAndRestartSchema.extend({ clearCache: z.boolean().default(true), waitSeconds: z.number().default(150) });

export type EndToEndOpm001Input = z.infer<typeof EndToEndOpm001Schema>;

export async function endToEndOpm001(input: EndToEndOpm001Input) {
  const deploy = await deployModuleAndRestart(input);
  const waited = await waitForStartup({ timeoutSeconds: input.waitSeconds, match: 'Started OpenMRS' });
  const moduleStatus = await verifyModuleLoaded({ moduleId: 'ghanaemr' });
  const schema = await verifyQueueSchema();
  return { deploy, waited, moduleStatus, schema };
}

