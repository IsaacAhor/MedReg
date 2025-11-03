# MCP Setup Checklist
**Complete setup verification for Codex CLI, GitHub Copilot, and Claude Desktop**

---

## ☑️ Pre-Setup Checklist

Before configuring MCP servers, verify:

- [ ] **Node.js 18+** installed
  ```powershell
  node --version  # Should show v18.x or higher
  ```

- [ ] **Docker + Docker Compose** running
  ```powershell
  docker --version
  docker-compose --version
  docker ps  # Should show running containers
  ```

- [ ] **OpenMRS** accessible
  ```powershell
  curl http://localhost:8080/openmrs
  # Should return HTML (OpenMRS login page)
  ```

- [ ] **MySQL** accessible
  ```powershell
  Test-NetConnection -ComputerName localhost -Port 3307
  # TcpTestSucceeded : True
  ```

- [ ] **MCP servers built**
  ```powershell
  cd c:\temp\AI\MedReg\mcp-servers
  .\scripts\install-all.ps1
  .\scripts\verify-mcp.ps1
  # All checks should pass
  ```

---

## ☑️ Codex CLI Setup (Recommended)

- [ ] **Codex CLI installed**
  ```powershell
  codex --version
  # Should show version number
  ```
  If not installed: `npm install -g @openai/codex`

- [ ] **Existing config backed up**
  ```powershell
  # Backup is automatic when running configure-codex.ps1
  Test-Path "$env:USERPROFILE\.codex\config.toml"
  ```

- [ ] **Run configuration script**
  ```powershell
  cd c:\temp\AI\MedReg\mcp-servers
  .\scripts\configure-codex.ps1
  ```

- [ ] **Merged Ghana EMR sections into Codex config**
  - [ ] Added `[projects.ghana-emr]` section
  - [ ] Added `[mcp_servers.ghana-emr-openmrs]` section
  - [ ] Added `[mcp_servers.ghana-emr-mysql]` section
  - [ ] Saved `~/.codex/config.toml`

- [ ] **Paths use Unix-style forward slashes**
  - [DONE] Correct: `c:/temp/AI/MedReg`
  - [FAILED] Wrong: `c:\temp\AI\MedReg`

- [ ] **Test Codex CLI**
  ```powershell
  cd c:\temp\AI\MedReg
  codex
  ```
  
- [ ] **Verify MCP tools available**
  - In Codex prompt, ask: "What MCP tools do you have?"
  - Expected (minimum): 24 tools listed
    - OpenMRS (20): create_patient, search_patient, get_patient, update_patient, verify_session, list_encounter_types, list_visit_types, list_locations, list_providers, list_identifier_types, list_person_attribute_types, list_encounter_roles, list_concepts, find_active_visit, create_visit, close_visit, create_encounter, record_triage_vitals, record_consultation_notes
    - MySQL (4): query, read_schema, list_tables, propose_migration

- [ ] **Test Ghana Card validation**
  - Ask Codex: "Validate Ghana Card: GHA-123456789-0"
  - Expected: Validation result with checksum verification

- [ ] **Test database query**
  - Ask Codex: "Show me the patient table structure"
  - Expected: Table schema with columns

---

## ☑️ Claude Desktop Setup (Optional)

- [ ] **Claude Desktop installed**
  - Download from: https://claude.ai/download
  - Version: Latest (supports MCP)

- [ ] **Config directory exists**
  ```powershell
  New-Item -ItemType Directory -Force -Path "$env:APPDATA\Claude"
  ```

- [ ] **Copy config file**
  ```powershell
  Copy-Item .\configs\claude-desktop-config.json "$env:APPDATA\Claude\claude_desktop_config.json"
  ```

- [ ] **Paths use Windows-style double backslashes**
  - [DONE] Correct: `c:\\temp\\AI\\MedReg`
  - [FAILED] Wrong: `c:\temp\AI\MedReg` (single backslash)

- [ ] **Restart Claude Desktop**
  - File -> Exit (completely quit)
  - Reopen Claude Desktop

- [ ] **Verify MCP tools available**
  - Ask Claude: "What MCP tools do you have?"
  - Expected (minimum): 24 tools listed (see above)

- [ ] **Test patient creation**
  - Ask Claude: "Create test patient: Kwame Mensah, Ghana Card GHA-123456789-0"
  - Expected: Patient created with UUID

---

## ☑️ GitHub Copilot Setup (Future)

**Status**: MCP support NOT available yet (as of November 2024)

**Current Workaround**:
- [ ] Use **GitHub Copilot** for inline code suggestions in VS Code
- [ ] Use **Codex CLI** for MCP tools (database queries, Ghana Card validation, etc.)

**When MCP Support Added**:
- [ ] Copy VS Code config
  ```powershell
  Copy-Item .\configs\vscode-settings.json ..\.vscode\settings.json
  ```
- [ ] Restart VS Code
- [ ] Test MCP tools in Copilot Chat

---

## ☑️ Verification Tests (All Tools)

### Test 1: Tools Available
- [ ] Ask AI: "What MCP tools do you have?"
- [ ] Expected response:
  ```
  OpenMRS Server:
  - create_patient
  - search_patient
  
  MySQL Server:
  - query
  - read_schema
  - list_tables
  - propose_migration
  ```

### Test 2: Ghana Card Validation
- [ ] Ask AI: "Create patient with Ghana Card GHA-123456789-0"
- [ ] Expected: Patient created (valid checksum)
- [ ] Ask AI: "Create patient with Ghana Card GHA-123456789-5"
- [ ] Expected: Error (invalid checksum)

### Test 3: Database Query
- [ ] Ask AI: "Show me the patient table structure"
- [ ] Expected: Table columns with types
- [ ] Verify PII masking (if Ghana Cards shown, should be masked: `GHA-1234****-*`)

### Test 4: NHIE Enforcement
- [ ] Ask AI: "Generate code to call https://api.nhia.gov.gh/eligibility"
- [ ] Expected: **Error** (NHIE violation detected)
- [ ] Ask AI: "Generate code to call https://nhie.moh.gov.gh/fhir/Coverage"
- [ ] Expected: **Success** (NHIE endpoint allowed)

### Test 5: SQL Safety
- [ ] Ask AI: "Delete all patients from database"
- [ ] Expected: **Error** (SQL safety violation - DELETE blocked)
- [ ] Ask AI: "SELECT * FROM patient LIMIT 10"
- [ ] Expected: **Success** (read-only query allowed)

---

## ☑️ Post-Setup Tasks

- [ ] **Add workspace to Git** (if not already tracked)
  ```powershell
  cd c:\temp\AI\MedReg\mcp-servers
  git status
  git add configs/ scripts/
  git commit -m "Add MCP configuration for Codex CLI, Claude Desktop, and VS Code"
  ```

- [ ] **Document your setup** (optional)
  - Which AI tool(s) you're using
  - Any custom configuration changes
  - Environment-specific settings

- [ ] **Test with real workflow** (Week 1 target)
  - Register test patient via AI tool
  - Query patient database
  - Generate OpenMRS code
  - Validate Ghana domain rules

---

## 🐛 Troubleshooting Checklist

### Issue: "MCP server not found"
- [ ] Check `dist/index.js` exists in both openmrs/ and mysql/ directories
- [ ] Rebuild MCP servers: `.\scripts\install-all.ps1`
- [ ] Verify Node.js 18+: `node --version`

### Issue: "Cannot connect to OpenMRS"
- [ ] Check Docker running: `docker ps`
- [ ] Check OpenMRS accessible: `curl http://localhost:8080/openmrs`
- [ ] Check OpenMRS logs: `docker-compose logs openmrs`

### Issue: "Cannot connect to MySQL"
- [ ] Check MySQL port: `Test-NetConnection -ComputerName localhost -Port 3307`
- [ ] Check credentials in config match `docker-compose.yml`
- [ ] Check MySQL logs: `docker-compose logs mysql`

### Issue: Codex config syntax error
- [ ] Validate TOML syntax: https://www.toml-lint.com/
- [ ] Check paths use forward slashes: `c:/temp/...` not `c:\temp\...`
- [ ] Check environment variables under `[mcp_servers.*.env]`

### Issue: Claude Desktop config not loading
- [ ] Validate JSON syntax: `Get-Content "$env:APPDATA\Claude\claude_desktop_config.json" | ConvertFrom-Json`
- [ ] Check paths use double backslashes: `c:\\temp\\...`
- [ ] Completely restart Claude Desktop (File -> Exit, not just close window)

---

## 📊 Setup Status Summary

| Tool | Status | Config Location | Format |
|------|--------|-----------------|--------|
| **Codex CLI** | ☐ Configured | `~/.codex/config.toml` | TOML |
| **Claude Desktop** | ☐ Configured | `%APPDATA%\Claude\claude_desktop_config.json` | JSON |
| **GitHub Copilot** | [PENDING] Awaiting MCP support | `.vscode/settings.json` | JSONC |

---

## [DONE] Success Criteria

You're ready when:
- [DONE] At least one AI tool (Codex CLI or Claude Desktop) shows 6 MCP tools
- [DONE] Ghana Card validation works (Luhn checksum enforced)
- [DONE] Database queries work (with PII masking)
- [DONE] NHIE enforcement works (blocks direct NHIA calls)
- [DONE] SQL safety works (blocks destructive queries)

---

## [LAUNCH] Next Steps After Setup

1. **Week 1 Testing** (Target: Nov 8, 2025)
   - Test all 5 scenarios from README.md
   - Document any issues in GitHub Issues
   - Verify Ghana domain rules enforced

2. **Development Workflow**
   - Use AI tools to generate OpenMRS code
   - Use MCP tools to validate against live system
   - Iterate on patient registration + OPD workflows

3. **Team Onboarding**
   - Share configuration with team members
   - Document team-specific settings
   - Set up CI/CD for MCP server tests

---

**Last Updated**: November 1, 2025  
**Target**: Week 1 complete by Nov 8, 2025  
**Status**: Configuration files ready, awaiting user setup
