import { mysqlQuery, MySQLConfig } from '../utils/mysql.js';

export async function verifyQueueSchema() {
  const cfg: MySQLConfig = {
    container: process.env.MYSQL_CONTAINER || 'medreg-mysql',
    database: process.env.MYSQL_DB || 'openmrs',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'root_password',
  };

  const exists = await mysqlQuery(cfg, "SHOW TABLES LIKE 'ghanaemr_patient_queue';");
  const tableExists = exists && exists.includes('ghanaemr_patient_queue');

  let columns = '', indexes = '', foreignKeys = '', changelog = '';
  if (tableExists) {
    columns = await mysqlQuery(cfg, 'DESCRIBE ghanaemr_patient_queue;');
    indexes = await mysqlQuery(cfg, 'SHOW INDEX FROM ghanaemr_patient_queue;');
    foreignKeys = await mysqlQuery(
      { ...cfg, database: 'information_schema' },
      "SELECT CONSTRAINT_NAME,TABLE_NAME,COLUMN_NAME,REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME FROM KEY_COLUMN_USAGE WHERE TABLE_SCHEMA='openmrs' AND TABLE_NAME='ghanaemr_patient_queue' AND REFERENCED_TABLE_NAME IS NOT NULL;"
    );
  }
  // Liquibase changelog table in OpenMRS is `liquibasechangelog`
  changelog = await mysqlQuery(
    cfg,
    "SELECT ID, AUTHOR, FILENAME, DATEEXECUTED, EXECTYPE FROM liquibasechangelog WHERE FILENAME LIKE '%queue-management%' OR ID LIKE 'ghanaemr-queue-%' ORDER BY DATEEXECUTED DESC;"
  );

  return { tableExists, columns, indexes, foreignKeys, changelog };
}

