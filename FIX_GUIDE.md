# Fix OpenMRS and Enable MCPs - Quick Guide

## What I Fixed

1. ✅ **Stopped dev container Docker services** - No more port conflicts
2. ✅ **Reverted MCP paths to Windows** - MCPs now point to `C:\temp\AI\MedReg\mcp-servers`
3. ✅ **Created fix script** - `scripts/fix-openmrs-windows.ps1` to fix OpenMRS error

---

## Steps to Complete (Run on Windows)

### Step 1: Fix OpenMRS Container

Open **PowerShell** on Windows and run:

```powershell
cd C:\temp\AI\MedReg
.\scripts\fix-openmrs-windows.ps1
```

**What this does:**
- Stops OpenMRS container
- Clears the corrupted Spring bean cache (`.openmrs-lib-cache`)
- Restarts OpenMRS
- Tests the REST API to confirm it's working

**Expected result:** ✅ `SUCCESS! OpenMRS is working!`

---

### Step 2: Reload VS Code to Enable MCPs

**Option A: Reload Window**
1. Press `Ctrl+Shift+P`
2. Type "Reload Window"
3. Press Enter

**Option B: Restart VS Code**
1. Close VS Code completely
2. Reopen your project

**Why?** MCP configuration changes require VS Code to reload the MCP Toolkit extension.

---

### Step 3: Verify MCP Connectivity

After VS Code reloads:

1. Check **MCP Toolkit** sidebar (left panel)
2. You should see 3 MCPs:
   - ✅ Supabase (HTTP)
   - ✅ ghana-emr-openmrs (stdio)
   - ✅ ghana-emr-mysql (stdio)

3. Look for green status indicators next to each MCP

---

## How to Monitor (Docker Desktop)

You should now see **only these containers** in Docker Desktop:
- ✅ `medreg` (network)
- ✅ `openmrs` (OpenMRS 2.4.0) - Port 8080
- ✅ `mysql` (MySQL 5.7) - Port 3307
- ✅ `nhie-mock` (HAPI FHIR) - Port 8090
- ✅ `nhie-mock-db` (PostgreSQL) - Port 5433

All containers should show **green status** (healthy/running).

---

## Verify OpenMRS is Working

Test in browser or PowerShell:

```powershell
# Browser
http://localhost:8080/openmrs/

# PowerShell
$base64Auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:Admin123"))
Invoke-RestMethod -Uri "http://localhost:8080/openmrs/ws/rest/v1/session" -Headers @{Authorization="Basic $base64Auth"}
```

**Expected:** JSON response with `"authenticated": true`

---

## What's Next (After Fix)

Once OpenMRS is working and MCPs are connected:

1. ✅ Complete **Task 13** from PROMPT_QUEUE.md
   - Create billing concepts (OPM-008)
   - Create NHIS eligibility attributes (OPM-009)
   - Document UUIDs in `docs/config/billing-concepts.md`

2. The MCP servers will help automate REST API calls for creating OpenMRS metadata

---

## Troubleshooting

### If OpenMRS still shows errors:
```powershell
# Check logs
docker logs openmrs --tail 100

# Try complete restart
docker-compose -f C:\temp\AI\MedReg\docker-compose.yml restart openmrs
```

### If MCPs don't connect:
1. Verify Node.js is installed on Windows
2. Check MCP paths exist: `C:\temp\AI\MedReg\mcp-servers\openmrs\dist\index.js`
3. Restart VS Code completely (not just reload)

---

## Summary

✅ Dev container Docker stopped (no conflicts)  
✅ MCP config points to Windows paths  
✅ Fix script created for OpenMRS error  
🔄 **ACTION REQUIRED:** Run `fix-openmrs-windows.ps1` and reload VS Code
