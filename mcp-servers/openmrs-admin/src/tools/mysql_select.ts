import { z } from 'zod';
import { mysqlQuery } from '../utils/mysql.js';

export const MySQLSelectSchema = z.object({ database: z.string().default(process.env.MYSQL_DB || 'openmrs'), sql: z.string() });
export type MySQLSelectInput = z.infer<typeof MySQLSelectSchema>;

export async function mysqlSelect(input: MySQLSelectInput) {
  const cfg = {
    container: process.env.MYSQL_CONTAINER || 'medreg-mysql',
    database: input.database,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'root_password',
  };
  const stdout = await mysqlQuery(cfg, input.sql);
  return { raw: stdout };
}

