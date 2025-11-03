# MySQL MCP Server

**Safe database operations for Ghana EMR MVP development**

## Purpose

Allows AI agents to inspect and query the OpenMRS database safely:
- [DONE] Read-only queries (SELECT) by default
- [DONE] Schema inspection (DESCRIBE, SHOW)
- [DONE] Gated migrations (propose -> approve -> apply)
- [DONE] Automatic backups before critical operations
- [DONE] SQL validation (blocks dangerous operations)
- [DONE] PII masking in query results

## Tools

### 1. `query`
Execute read-only SQL query (SELECT only)

**Example:**
```sql
SELECT * FROM patient WHERE patient_id = 1;
```

**Restrictions:**
- No INSERT, UPDATE, DELETE, DROP, TRUNCATE
- No DDL operations (CREATE, ALTER)
- Results automatically PII-masked

---

### 2. `read_schema`
Get table structure (columns, types, indexes)

**Example:**
```typescript
read_schema({ table: 'patient' })
```

**Returns:**
- Column names and types
- Primary keys
- Foreign keys
- Indexes

---

### 3. `propose_migration`
Propose new database migration (creates GitHub issue for approval)

**Example:**
```typescript
propose_migration({
  name: 'add_nhie_transaction_log',
  sql: 'CREATE TABLE nhie_transaction_log (...)',
  description: 'Track NHIE API calls for retry logic'
})
```

**Workflow:**
1. AI proposes migration
2. Creates GitHub issue with SQL and impact analysis
3. Human reviews and approves
4. AI applies migration using `apply_migration`

---

### 4. `apply_migration`
Apply approved migration (requires approval ID from GitHub issue)

**Safety:**
1. Creates automatic backup before migration
2. Runs migration in transaction
3. On error, provides rollback instructions
4. Logs to audit trail

---

## Configuration

**Environment Variables (.env):**
```bash
# MySQL connection
MYSQL_HOST=localhost
MYSQL_PORT=3307
MYSQL_USER=openmrs_user
MYSQL_PASSWORD=openmrs_password
MYSQL_DATABASE=openmrs

# Safety settings
MYSQL_READ_ONLY=true  # Force read-only mode
MYSQL_BACKUP_DIR=./backups
```

## Safety Features

### SQL Validation
- Blocks: INSERT, UPDATE, DELETE, DROP, TRUNCATE, ALTER
- Allows: SELECT, DESCRIBE, SHOW
- Detects SQL injection attempts

### PII Masking
All query results automatically mask:
- Ghana Card numbers -> `GHA-1234****-*`
- NHIS numbers -> `0123****`
- Phone numbers -> `+233244****`
- Patient names (in results) -> `K***e M****h`

### Backup & Rollback
Before every migration:
1. Creates timestamped backup: `backup_YYYYMMDD_HHMMSS.sql`
2. Stores in `./backups/` directory
3. On failure, provides rollback command

---

## Usage

### Claude Desktop Configuration
Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mysql": {
      "command": "node",
      "args": ["c:/temp/AI/MedReg/mcp-servers/mysql/dist/index.js"],
      "env": {
        "MYSQL_HOST": "localhost",
        "MYSQL_PORT": "3307",
        "MYSQL_USER": "openmrs_user",
        "MYSQL_PASSWORD": "openmrs_password",
        "MYSQL_DATABASE": "openmrs"
      }
    }
  }
}
```

### Development
```powershell
# Install dependencies
npm install

# Build
npm run build

# Run in dev mode
npm run dev

# Run tests
npm test
```

---

## Common Queries

### Inspect OpenMRS Schema
```sql
-- List all tables
SHOW TABLES;

-- Describe patient table
DESCRIBE patient;

-- Show patient identifiers
SELECT * FROM patient_identifier_type;

-- Count patients
SELECT COUNT(*) FROM patient WHERE voided = 0;
```

### Check Ghana Card Configuration
```sql
-- Check if Ghana Card identifier type exists
SELECT * FROM patient_identifier_type 
WHERE name = 'Ghana Card' OR name LIKE '%Ghana%';

-- Check person attribute types for NHIS
SELECT * FROM person_attribute_type 
WHERE name LIKE '%NHIS%';
```

---

## Troubleshooting

### Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:3307
```

**Fix:** Ensure MySQL is running
```powershell
docker-compose up -d mysql
```

### Permission Denied
```
Error: Access denied for user 'openmrs_user'@'localhost'
```

**Fix:** Check credentials in `.env` match `docker-compose.yml`

### Read-Only Mode
```
Error: Cannot execute INSERT in read-only mode
```

**Expected:** Use `propose_migration` for DDL/DML operations

---

## Security

1. **No Direct Write Access:** All write operations gated through approval
2. **PII Protection:** Automatic masking in all outputs
3. **Audit Trail:** All operations logged with timestamp, user, query
4. **Connection Pooling:** Max 5 connections, prevents resource exhaustion
5. **Timeout:** 30s query timeout prevents runaway queries

---

## Development Roadmap

- [x] SQL validator (block dangerous operations)
- [x] Read-only query tool
- [x] Schema inspection tool
- [x] Propose migration workflow
- [ ] Apply migration with backup
- [ ] GitHub issue integration for approvals
- [ ] Rollback automation
- [ ] Query performance analysis
- [ ] Index recommendations
