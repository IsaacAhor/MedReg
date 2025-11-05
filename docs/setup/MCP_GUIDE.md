# Model Context Protocol (MCP) – MedReg Guide

Audience: All workers (FE, BE, DevOps). This is the single source of truth for using MCP with MedReg.

Goals
- Standardize how we use MCP to accelerate backend and runtime tasks.
- Document the two MCP servers we ship: application-level (OpenMRS REST) and infra-level (OpenMRS Admin).
- Provide copy‑paste recipes for common tasks (e.g., OPM‑001 deploy + verify).

Contents
- Servers and capabilities
- Setup and configuration
- Tool catalog (names, purpose, inputs)
- Safety/guardrails
- Common workflows and examples
- Troubleshooting

---

## Servers

1) OpenMRS (Application MCP)
- Path: `mcp-servers/openmrs`
- Purpose: High‑level REST operations (patients, visits, encounters, vitals, consultation notes), discovery (concepts, locations), env updates.
- When to use: Feature work, e2e flows after OpenMRS is running.

2) openmrs-admin (Infra MCP)
- Path: `mcp-servers/openmrs-admin`
- Purpose: Deploy `.omod`, clear module cache, restart OpenMRS, tail logs, verify module loaded, read‑only DB checks, orchestrated deploy+verify.
- When to use: Backend platform tasks (e.g., OPM‑001 Liquibase schema), prod‑safe inspections.

---

## Setup

Prereqs
- Docker CLI access to `medreg-openmrs` and `medreg-mysql` containers.
- MySQL user with read access to `openmrs` schema (default: root/root_password in dev).
- OpenMRS admin credentials for REST (default: admin/Admin123 in dev).

Environment
- OpenMRS (REST MCP): see `mcp-servers/openmrs/.env.example`
- openmrs-admin (infra MCP): copy & edit `mcp-servers/openmrs-admin/.env.example`

Install & build
```
# OpenMRS (REST)
cd mcp-servers/openmrs
npm i && npm run build

# Admin (infra)
cd ../openmrs-admin
npm i && npm run build
```

Run
```
# Start each as a separate MCP server (stdio)
npm start
```

Client integration
- Claude Desktop / Codex CLI: register both servers by command path.
- VS Code agents: map each server to a name (e.g., "openmrs", "openmrs-admin").

Codex CLI (config.toml)
- Location: `C:\Users\<you>\.codex\config.toml`
- Confirm existing content (often only a `trust_level` entry). Add a project section for this repo plus MCP servers.

Example (WSL path):
```
[projects."/mnt/c/temp/AI/MedReg"]
trust_level = "trusted"

[projects."/mnt/c/temp/AI/MedReg".mcp_servers.openmrs]
command = "node"
args = ["mcp-servers/openmrs/dist/index.js"]
cwd = "/mnt/c/temp/AI/MedReg/mcp-servers/openmrs"

[projects."/mnt/c/temp/AI/MedReg".mcp_servers.openmrs-admin]
command = "node"
args = ["mcp-servers/openmrs-admin/dist/index.js"]
cwd = "/mnt/c/temp/AI/MedReg/mcp-servers/openmrs-admin"

# Environment (dev defaults). Prefer .env files for secrets; these are safe dev values.
[projects."/mnt/c/temp/AI/MedReg".mcp_servers.openmrs-admin.env]
OPENMRS_CONTAINER = "medreg-openmrs"
MYSQL_CONTAINER   = "medreg-mysql"
OPENMRS_BASE_URL  = "http://localhost:8080/openmrs/ws/rest/v1"
OPENMRS_USERNAME  = "admin"
OPENMRS_PASSWORD  = "Admin123"
OPENMRS_MODULES_DIR = "/usr/local/tomcat/.OpenMRS/modules"
OPENMRS_APPDATA_DIR = "/usr/local/tomcat/.OpenMRS"
MYSQL_DB          = "openmrs"
MYSQL_USER        = "root"
MYSQL_PASSWORD    = "root_password"
```

Notes:
- Use your actual repo path key in `projects."..."` (WSL vs Windows path). The example matches this workspace.
- Ensure both servers are built (`npm run build`) before Codex tries to run them.
- If your client does not support per-project MCP blocks, add a top-level `mcpServers` equivalent according to your client’s schema.

---

## Tool Catalog

OpenMRS (REST)
- Session/Config: `verify_session`, `update_env`
- Patients: `create_patient`, `search_patient`, `get_patient`, `update_patient`
- Visits: `find_active_visit`, `create_visit`, `close_visit`
- Encounters: `create_encounter`
- Discovery: `list_encounter_types`, `list_visit_types`, `list_locations`, `list_providers`, `list_identifier_types`, `list_person_attribute_types`, `list_encounter_roles`, `list_concepts`
- Opinionated OPD: `record_triage_vitals`, `record_consultation_notes`

openmrs-admin (Infra)
- Runtime: `restart_openmrs`, `wait_for_startup`, `tail_openmrs_logs`, `clear_module_cache`
- Deploy: `deploy_module_and_restart`
- DB (read‑only): `mysql_select`, `verify_queue_schema`
- REST introspection: `verify_module_loaded`
- Orchestration: `end_to_end_opm001` (deploy → wait → verify module + queue schema)

Inputs follow JSON schema (zod) – see server `src/tools/*.ts` for details.

---

## Safety & Guardrails
- DB queries are enforced read‑only (SELECT/SHOW/DESCRIBE/EXPLAIN). DDL/DML are rejected.
- Docker scope limited to `medreg-openmrs` and `medreg-mysql`.
- File writes restricted to OpenMRS modules dir inside container.
- Credentials passed via env; never echoed in outputs.
- PII masking handled in REST MCP; admin MCP avoids patient data entirely.

---

## Common Workflows

OPM‑001 (Queue Schema) – End‑to‑End (preferred)
```
end_to_end_opm001 {
  "localPath": "backend/openmrs-module-ghanaemr/omod/target/openmrs-module-ghanaemr-0.1.0-SNAPSHOT.omod",
  "clearCache": true,
  "waitSeconds": 180
}
```
Returns:
```
{
  "deploy": { "copied": true, "cacheCleared": true, "restarted": true },
  "waited": { "found": true, "elapsed": 92 },
  "moduleStatus": { "loaded": true, "started": true, "version": "0.1.0-SNAPSHOT" },
  "schema": {
    "tableExists": true,
    "columns": "DESCRIBE output...",
    "indexes": "SHOW INDEX output...",
    "foreignKeys": "INFORMATION_SCHEMA output...",
    "changelog": "liquibasechangelog rows..."
  }
}
```

Quick checks
- Module loaded: `verify_module_loaded { "moduleId": "ghanaemr" }`
- Table exists: `mysql_select { "sql": "SHOW TABLES LIKE 'ghanaemr_patient_queue';" }`
- Describe: `mysql_select { "sql": "DESCRIBE ghanaemr_patient_queue;" }`
- Indexes: `mysql_select { "sql": "SHOW INDEX FROM ghanaemr_patient_queue;" }`
- FKs: `mysql_select { "database": "information_schema", "sql": "SELECT CONSTRAINT_NAME,..." }`
- Logs: `tail_openmrs_logs { "grep": "liquibase|ghanaemr" }`

---

## Troubleshooting
- Module not loading:
  - Ensure OMOD has `config.xml` and `/lib/<api-jar>`.
  - Clear cache: `clear_module_cache { "moduleId": "ghanaemr" }`, then `restart_openmrs`.
  - Inspect logs: `tail_openmrs_logs { "grep": "module|error|liquibase" }`
- Liquibase not running:
  - `config.xml` must contain `<updateToLatest/>` (camelCase).
  - Verify API jar contains `liquibase.xml` and includes your changeset.
- SQL errors:
  - Ensure `database` is `openmrs` for tables, `information_schema` for FKs.
  - Only read‑only statements allowed.

---

## Contributing New Tools
- Follow patterns in `mcp-servers/*/src/tools`.
- Keep input schemas strict and self‑documenting.
- Enforce least privilege (container scope, read‑only where possible).
- Update this guide and `docs/DOCUMENTATION_STRUCTURE.md` when adding server‑level capabilities.
