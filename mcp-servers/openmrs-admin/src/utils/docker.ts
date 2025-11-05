import { sh } from './shell.js';

const DOCKER = process.env.DOCKER_BIN || 'docker';

export async function dockerExec(container: string, cmd: string, timeoutMs = 60000) {
  return await sh(`${DOCKER} exec ${container} sh -lc ${JSON.stringify(cmd)}`, timeoutMs);
}

export async function dockerCp(src: string, destSpec: string) {
  return await sh(`${DOCKER} cp ${JSON.stringify(src)} ${JSON.stringify(destSpec)}`);
}

export async function dockerRestart(container: string) {
  return await sh(`${DOCKER} restart ${container}`);
}

export async function dockerLogs(container: string, tail = 2000) {
  return await sh(`${DOCKER} logs --tail ${tail} ${container}`);
}
