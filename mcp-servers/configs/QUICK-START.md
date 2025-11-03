# MCP Configuration Quick Reference
**Choose your AI tool: Codex CLI, GitHub Copilot, or Claude Desktop**

---

## [LAUNCH] Quick Setup (Pick One)

### Option 1: Codex CLI (Recommended) [DONE]

**Status**: Works today with full MCP support

```powershell
# Run automated setup
cd c:\temp\AI\MedReg\mcp-servers
.\scripts\configure-codex.ps1

# Test
cd c:\temp\AI\MedReg
codex
# Ask: "What MCP tools do you have?"
```

**Config Location**: `%USERPROFILE%\.codex\config.toml`  
**Template**: `configs/codex-config.toml`  
**Format**: TOML (use forward slashes: `c:/temp/AI/MedReg`)

---

### Option 2: Claude Desktop [DONE]

**Status**: Works today with full MCP support

```powershell
# Copy config file
cd c:\temp\AI\MedReg\mcp-servers
Copy-Item .\configs\claude-desktop-config.json "$env:APPDATA\Claude\claude_desktop_config.json"

# Restart Claude Desktop (File -> Exit, then reopen)
# Test: Ask "What MCP tools do you have?"
```

**Config Location**: `%APPDATA%\Claude\claude_desktop_config.json`  
**Template**: `configs/claude-desktop-config.json`  
**Format**: JSON (use double backslashes: `c:\\temp\\AI\\MedReg`)

---

### Option 3: GitHub Copilot [PENDING]

**Status**: MCP support NOT available yet (coming soon)

**Current Workaround**: Use Copilot for inline suggestions + Codex CLI for MCP tools

**Future Setup** (when MCP support added):
```powershell
# Copy to workspace settings
Copy-Item .\configs\vscode-settings.json ..\.vscode\settings.json
# Restart VS Code
```

**Config Location**: `.vscode/settings.json` or User Settings  
**Template**: `configs/vscode-settings.json`  
**Format**: JSONC (JSON with comments)

---

## 📊 Comparison Table

| Feature | Codex CLI | GitHub Copilot | Claude Desktop |
|---------|-----------|----------------|----------------|
| **MCP Support** | [DONE] Yes | [FAILED] Not yet | [DONE] Yes |
| **Works Today** | [DONE] Yes | [WARNING] Partial | [DONE] Yes |
| **Ghana Card Validation** | [DONE] Via MCP | [FAILED] Manual | [DONE] Via MCP |
| **Database Queries** | [DONE] Via MCP | [FAILED] Manual | [DONE] Via MCP |
| **NHIE Enforcement** | [DONE] Via MCP | [FAILED] Manual | [DONE] Via MCP |
| **Inline Code Suggestions** | [FAILED] No | [DONE] Yes | [FAILED] No |
| **Interface** | Terminal | VS Code | Desktop App |
| **Config Format** | TOML | JSON | JSON |
| **Path Style** | `c:/temp/...` | `c:\\temp\\...` | `c:\\temp\\...` |

---

## 🎯 Recommended Workflow

**Best Setup: Codex CLI + GitHub Copilot Together**

1. Use **GitHub Copilot** in VS Code for:
   - Inline code suggestions
   - Auto-complete
   - Code generation

2. Use **Codex CLI** in terminal for:
   - Ghana Card validation (live Luhn checksum)
   - Database queries (safe SQL with PII masking)
   - Patient operations (create, search with validation)
   - NHIE enforcement (blocks direct NHIA calls)

**Example Workflow**:
```
1. Writing code in VS Code
   -> Copilot suggests: const ghanaCard = "GHA-123456789-0";

2. Need to validate?
   -> Switch to terminal, run: codex
   -> Ask: "Validate this Ghana Card: GHA-123456789-0"
   -> Codex uses MCP ghana_card validator (Luhn checksum)

3. Need to check database?
   -> Ask Codex: "Show me patients with NHIS number 0123456789"
   -> Codex uses MCP mysql server (safe query + PII masking)

4. Generate OpenMRS code?
   -> Copilot generates code in VS Code
   -> Codex validates against live OpenMRS API via MCP
```

---

## 🔧 Configuration Files Reference

| File | Purpose | Usage |
|------|---------|-------|
| `codex-config.toml` | Codex CLI config template | Merge into `~/.codex/config.toml` |
| `claude-desktop-config.json` | Claude Desktop config | Copy to `%APPDATA%\Claude\` |
| `vscode-settings.json` | VS Code config (future) | Copy to `.vscode/settings.json` |
| `README-CONFIGS.md` | Complete setup guide | Read for detailed instructions |

---

## ⚡ One-Line Setup

```powershell
# Codex CLI (recommended)
cd c:\temp\AI\MedReg\mcp-servers; .\scripts\configure-codex.ps1

# Claude Desktop
Copy-Item c:\temp\AI\MedReg\mcp-servers\configs\claude-desktop-config.json "$env:APPDATA\Claude\claude_desktop_config.json"

# Both (why not?)
cd c:\temp\AI\MedReg\mcp-servers; .\scripts\configure-codex.ps1; Copy-Item .\configs\claude-desktop-config.json "$env:APPDATA\Claude\claude_desktop_config.json"
```

---

## 🐛 Troubleshooting

### Codex: "MCP server not found"
```powershell
# Check paths use forward slashes
# CORRECT: c:/temp/AI/MedReg
# WRONG:   c:\temp\AI\MedReg

# Rebuild MCP servers
cd c:\temp\AI\MedReg\mcp-servers
.\scripts\install-all.ps1
```

### Claude: "No MCP tools available"
```powershell
# Check paths use double backslashes
# CORRECT: c:\\temp\\AI\\MedReg
# WRONG:   c:\temp\AI\MedReg

# Verify config exists
Test-Path "$env:APPDATA\Claude\claude_desktop_config.json"

# Restart Claude Desktop completely
```

### Copilot: "MCP tools not working"
**Expected** - Copilot doesn't support MCP yet. Use Codex CLI or Claude Desktop.

---

## 📚 Learn More

- **Full Setup Guide**: `configs/README-CONFIGS.md`
- **Main Documentation**: `README.md`
- **Ghana Domain Rules**: `../AGENTS.md`
- **MCP Protocol**: https://modelcontextprotocol.io/

---

**Last Updated**: November 1, 2025  
**Status**: Codex CLI [DONE] | Claude Desktop [DONE] | GitHub Copilot [PENDING]  
**Next Step**: Run `.\scripts\configure-codex.ps1` to get started!
