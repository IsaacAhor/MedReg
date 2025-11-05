import { dockerExec } from './docker.js';

export interface MySQLConfig {
  container: string;
  database: string;
  user: string;
  password: string;
}

const READONLY_REGEX = /^(\s*)(select|show|describe|explain)\b/i;

export async function mysqlQuery(cfg: MySQLConfig, sql: string): Promise<string> {
  if (!READONLY_REGEX.test(sql)) {
    throw new Error('Only read-only queries (SELECT/SHOW/DESCRIBE/EXPLAIN) are allowed');
  }
  // Use -N for raw output, and set DB via -D
  const cmd = `mysql -u ${cfg.user} -p${cfg.password} -D ${cfg.database} -N -e ${JSON.stringify(sql)}`;
  const { stdout } = await dockerExec(cfg.container, cmd, 60000);
  return stdout;
}

