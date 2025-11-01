# Configure Codex CLI with Ghana EMR MCP Servers
# This script merges Ghana EMR MCP config into your existing Codex config

Write-Host "`n=== Codex CLI MCP Configuration Setup ===" -ForegroundColor Cyan
Write-Host ""

$codexConfigPath = "$env:USERPROFILE\.codex\config.toml"
$ghanaConfigPath = ".\configs\codex-config.toml"

# Check if Codex CLI installed
Write-Host "[1/5] Checking Codex CLI installation..." -ForegroundColor Yellow
try {
    $codexVersion = & codex --version 2>&1
    Write-Host "  ✓ Codex CLI installed: $codexVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Codex CLI not found. Install from: npm install -g @openai/codex" -ForegroundColor Red
    exit 1
}

# Check if existing config exists
Write-Host "`n[2/5] Checking existing Codex config..." -ForegroundColor Yellow
if (Test-Path $codexConfigPath) {
    Write-Host "  ✓ Found existing config: $codexConfigPath" -ForegroundColor Green
    
    # Backup existing config
    Write-Host "`n[3/5] Backing up existing config..." -ForegroundColor Yellow
    $backupPath = "$codexConfigPath.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $codexConfigPath $backupPath
    Write-Host "  ✓ Backup saved: $backupPath" -ForegroundColor Green
} else {
    Write-Host "  ! No existing config found. Will create new config." -ForegroundColor Yellow
}

# Read Ghana EMR config template
Write-Host "`n[4/5] Reading Ghana EMR MCP config template..." -ForegroundColor Yellow
if (!(Test-Path $ghanaConfigPath)) {
    Write-Host "  ✗ Template not found: $ghanaConfigPath" -ForegroundColor Red
    exit 1
}
$ghanaConfig = Get-Content $ghanaConfigPath -Raw
Write-Host "  ✓ Template loaded" -ForegroundColor Green

# Instructions for manual merge
Write-Host "`n[5/5] Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Your Codex config will now open in Notepad." -ForegroundColor Cyan
Write-Host "  Please MANUALLY MERGE the following sections:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. Copy [projects.ghana-emr] section" -ForegroundColor White
Write-Host "  2. Copy [mcp_servers.ghana-emr-openmrs] section" -ForegroundColor White
Write-Host "  3. Copy [mcp_servers.ghana-emr-mysql] section" -ForegroundColor White
Write-Host ""
Write-Host "  From: configs\codex-config.toml" -ForegroundColor Gray
Write-Host "  To:   $codexConfigPath" -ForegroundColor Gray
Write-Host ""
Write-Host "  Press Enter to open Notepad with both files..." -ForegroundColor Yellow
Read-Host

# Open both files in Notepad
Start-Process notepad $codexConfigPath
Start-Sleep -Seconds 1
Start-Process notepad $ghanaConfigPath

Write-Host "`n  ✓ Notepad opened with both files" -ForegroundColor Green
Write-Host ""
Write-Host "After merging, test with:" -ForegroundColor Cyan
Write-Host "  cd c:\temp\AI\MedReg" -ForegroundColor White
Write-Host "  codex" -ForegroundColor White
Write-Host '  Ask: "What MCP tools do you have?"' -ForegroundColor White
Write-Host ""
