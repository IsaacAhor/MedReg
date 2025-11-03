# MCP Server Configuration Guide
**For Codex CLI, GitHub Copilot, and Claude Desktop**

---

## Overview

You're using **3 AI coding tools**:
1. [DONE] **Codex CLI** - Uses TOML config (`~/.codex/config.toml`)
2. [PENDING] **GitHub Copilot** - Uses VS Code settings (MCP support coming soon)
3. [PENDING] **Claude Desktop** - Uses JSON config (`%APPDATA%\Claude\claude_desktop_config.json`)

**Current Status (Nov 2024)**:
- [DONE] Codex CLI fully supports MCP
- [FAILED] GitHub Copilot does NOT support MCP yet (expected in future release)
- [DONE] Claude Desktop fully supports MCP

---

## 1. Codex CLI Configuration (TOML)

### Installation Check

```powershell
# Verify Codex CLI installed
codex --version

# Check config location
Test-Path $env:USERPROFILE\.codex\config.toml
```

### Configuration Steps

**Option A: Merge with Existing Config**

```powershell
# 1. Open your existing config
notepad $env:USERPROFILE\.codex\config.toml

# 2. Add the Ghana EMR MCP servers from codex-config.toml
# (Copy sections from: mcp-servers/configs/codex-config.toml)

# 3. Save and restart Codex
```

**Option B: Backup & Replace**

```powershell
# 1. Backup existing config
Copy-Item $env:USERPROFILE\.codex\config.toml $env:USERPROFILE\.codex\config.toml.backup

# 2. Copy new config
Copy-Item .\configs\codex-config.toml $env:USERPROFILE\.codex\config.toml

# 3. Edit to merge your existing projects
notepad $env:USERPROFILE\.codex\config.toml
```

### Codex TOML Format

```toml
# Project Definition
[projects.ghana-emr]
name = "ghana-emr"
path = "c:/temp/AI/MedReg"  # Unix-style path (forward slashes)
trust_level = "trusted"

# OpenMRS MCP Server
[mcp_servers.ghana-emr-openmrs]
command = "node"
args = ["c:/temp/AI/MedReg/mcp-servers/openmrs/dist/index.js"]

[mcp_servers.ghana-emr-openmrs.env]
OPENMRS_BASE_URL = "http://localhost:8080/openmrs/ws/rest/v1"
OPENMRS_USERNAME = "admin"
OPENMRS_PASSWORD = "Admin123"
FACILITY_CODE = "KBTH"
REGION_CODE = "GA"

# MySQL MCP Server
[mcp_servers.ghana-emr-mysql]
command = "node"
args = ["c:/temp/AI/MedReg/mcp-servers/mysql/dist/index.js"]

[mcp_servers.ghana-emr-mysql.env]
MYSQL_HOST = "localhost"
MYSQL_PORT = "3307"
MYSQL_USER = "openmrs_user"
MYSQL_PASSWORD = "openmrs_password"
MYSQL_DATABASE = "openmrs"
```

### Testing Codex CLI

```powershell
# 1. Navigate to project
cd c:\temp\AI\MedReg

# 2. Start Codex CLI
codex

# 3. Test MCP tools
# In Codex prompt:
# - "What MCP tools do you have available?"
# - "Create test patient: Kwame Mensah, Ghana Card GHA-123456789-0"
# - "Show me the patient table structure"
```

---

## 2. GitHub Copilot Configuration (VS Code)

### Current Status

**GitHub Copilot does NOT support MCP protocol yet** (as of November 2024).

### Workaround Options

**Option 1: Use Codex CLI for MCP tools** (Recommended)
- Use GitHub Copilot for inline code suggestions
- Use Codex CLI in terminal for MCP operations (database queries, patient creation)

**Option 2: Use Copilot Chat with context**
- GitHub Copilot Chat can reference `AGENTS.md` for domain rules
- But cannot execute MCP tools (query database, validate Ghana Cards dynamically)

**Option 3: Wait for MCP support**
- GitHub announced MCP support coming in future release
- When available, use `vscode-settings.json` configuration

### Prepare for Future MCP Support

```powershell
# 1. Copy VS Code settings template
Copy-Item .\configs\vscode-settings.json .\.vscode\settings.json

# 2. Verify MCP servers built
cd mcp-servers\openmrs; npm run build
cd ..\mysql; npm run build

# 3. When Copilot adds MCP support, restart VS Code
```

### VS Code Settings (Future)

```json
{
  "copilot.mcp.servers": {
    "ghana-emr-openmrs": {
      "command": "node",
      "args": ["c:\\temp\\AI\\MedReg\\mcp-servers\\openmrs\\dist\\index.js"],
      "env": {
        "OPENMRS_BASE_URL": "http://localhost:8080/openmrs/ws/rest/v1",
        "OPENMRS_USERNAME": "admin",
        "OPENMRS_PASSWORD": "Admin123"
      }
    }
  }
}
```

---

## 3. Claude Desktop Configuration (JSON)

### Installation

Download: https://claude.ai/download

### Configuration Steps

```powershell
# 1. Create config directory (if not exists)
New-Item -ItemType Directory -Force -Path "$env:APPDATA\Claude"

# 2. Create or edit config file
notepad "$env:APPDATA\Claude\claude_desktop_config.json"

# 3. Paste JSON config (see below)

# 4. Restart Claude Desktop completely (File -> Exit, then reopen)
```

### Claude Desktop JSON Format

```json
{
  "mcpServers": {
    "ghana-emr-openmrs": {
      "command": "node",
      "args": [
        "c:\\temp\\AI\\MedReg\\mcp-servers\\openmrs\\dist\\index.js"
      ],
      "env": {
        "OPENMRS_BASE_URL": "http://localhost:8080/openmrs/ws/rest/v1",
        "OPENMRS_USERNAME": "admin",
        "OPENMRS_PASSWORD": "Admin123",
        "FACILITY_CODE": "KBTH",
        "REGION_CODE": "GA"
      }
    },
    "ghana-emr-mysql": {
      "command": "node",
      "args": [
        "c:\\temp\\AI\\MedReg\\mcp-servers\\mysql\\dist\\index.js"
      ],
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

**Important**: 
- Use **double backslashes** (`\\`) in Windows paths for JSON
- Use **single forward slashes** (`/`) in TOML paths for Codex

### Testing Claude Desktop

```powershell
# 1. Verify config file
Test-Path "$env:APPDATA\Claude\claude_desktop_config.json"

# 2. Open Claude Desktop

# 3. Test MCP tools
# Ask Claude:
# - "What MCP tools do you have?"
# - "Create patient: Kwame Mensah, Ghana Card GHA-123456789-0"
```

---

## Quick Reference: Path Formats

| Tool | Config Format | Path Style | Example |
|------|---------------|------------|---------|
| Codex CLI | TOML | Unix (forward slashes) | `c:/temp/AI/MedReg` |
| GitHub Copilot | JSON | Windows (double backslashes) | `c:\\temp\\AI\\MedReg` |
| Claude Desktop | JSON | Windows (double backslashes) | `c:\\temp\\AI\\MedReg` |

---

## Troubleshooting

### Codex CLI: "MCP server not found"

```powershell
# 1. Check config syntax
codex config validate

# 2. Check paths use forward slashes
# CORRECT: c:/temp/AI/MedReg
# WRONG:   c:\temp\AI\MedReg

# 3. Rebuild MCP servers
cd c:\temp\AI\MedReg\mcp-servers\openmrs
npm run build
```

### Codex CLI: "Cannot find module"

```powershell
# 1. Check Node.js version
node --version  # Must be 18+

# 2. Reinstall dependencies
cd c:\temp\AI\MedReg\mcp-servers
.\scripts\install-all.ps1

# 3. Verify dist/index.js exists
Test-Path openmrs\dist\index.js
Test-Path mysql\dist\index.js
```

### VS Code: GitHub Copilot doesn't see MCP tools

**This is expected** - Copilot doesn't support MCP yet. Use Codex CLI or Claude Desktop instead.

---

## Recommended Setup (November 2024)

**For daily development:**
1. [DONE] **VS Code + GitHub Copilot** - Inline code suggestions, auto-complete
2. [DONE] **Codex CLI (terminal)** - MCP tools for database queries, patient operations
3. [DONE] **AGENTS.md** - Ghana domain rules, patterns (Copilot reads this automatically)

**When you need MCP tools:**
- Open terminal in VS Code
- Run: `codex`
- Use MCP commands: "Create patient...", "Query database...", etc.

**Workflow:**
```
1. GitHub Copilot suggests code -> You review
2. Need to validate Ghana Card? -> Ask Codex CLI (uses MCP ghana_card validator)
3. Need to query database? -> Ask Codex CLI (uses MCP mysql server)
4. Copilot generates OpenMRS code -> Codex validates against live API
```

---

## Next Steps

### 1. Configure Codex CLI (Immediate)

```powershell
# Merge Ghana EMR config into existing Codex config
notepad $env:USERPROFILE\.codex\config.toml

# Add sections from: mcp-servers/configs/codex-config.toml
# Save and test:
codex
# Ask: "What MCP tools do you have?"
```

### 2. Build MCP Servers (If not done)

```powershell
cd c:\temp\AI\MedReg\mcp-servers
.\scripts\install-all.ps1
.\scripts\verify-mcp.ps1
```

### 3. Test MCP Tools

See main README.md for 5 test scenarios.

---

## Summary

| Feature | Codex CLI | GitHub Copilot | Claude Desktop |
|---------|-----------|----------------|----------------|
| MCP Support | [DONE] Yes | [FAILED] Not yet | [DONE] Yes |
| Config Format | TOML | JSON (future) | JSON |
| Config Location | `~/.codex/config.toml` | `.vscode/settings.json` | `%APPDATA%\Claude\...` |
| Ghana Card Validation | [DONE] Via MCP | [FAILED] Manual only | [DONE] Via MCP |
| Database Queries | [DONE] Via MCP | [FAILED] Manual only | [DONE] Via MCP |
| NHIE Enforcement | [DONE] Via MCP | [FAILED] Manual only | [DONE] Via MCP |
| Inline Suggestions | [FAILED] No | [DONE] Yes | [FAILED] No |

**Recommendation**: Use **Codex CLI + GitHub Copilot** together for best results.

---

**Last Updated**: November 1, 2025  
**Config Files**: `codex-config.toml`, `vscode-settings.json`  
**Status**: Codex CLI ready, Copilot awaiting MCP support
