OpenMRS Admin MCP Server

Purpose
- Infra-level MCP to deploy OpenMRS modules, control runtime, and verify database schema (read-only).

Capabilities
- Deploy `.omod` into `medreg-openmrs` container.
- Clear `.openmrs-lib-cache` for targeted modules.
- Restart OpenMRS container and wait for startup.
- Tail OpenMRS logs with optional filtering.
- Verify module loaded via REST.
- Run read-only MySQL queries in `medreg-mysql` against the `openmrs` schema.
- High-level helpers to deploy-and-verify (e.g., OPM-001).

Safety
- DB queries restricted to SELECT/SHOW/DESCRIBE/EXPLAIN.
- File writes limited to OpenMRS modules directory inside container.
- Container names and credentials provided via env.

Configuration
Create `.env` from `.env.example` and adjust as needed.

Running
```
pnpm i # or npm i
pnpm start # or npm start
```

