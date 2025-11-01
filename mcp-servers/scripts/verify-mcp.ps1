# Verify MCP Infrastructure
# Checks that all components are properly installed and configured

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Verifying MCP Infrastructure" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"
$issues = @()

# 1. Check Node.js
Write-Host "1. Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "   ❌ Node.js not found" -ForegroundColor Red
    $issues += "Node.js not installed"
}

# 2. Check npm
Write-Host "2. Checking npm..." -ForegroundColor Yellow
$npmVersion = npm --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ npm: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "   ❌ npm not found" -ForegroundColor Red
    $issues += "npm not installed"
}

# 3. Check Docker
Write-Host "3. Checking Docker..." -ForegroundColor Yellow
$dockerVersion = docker --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Docker: $dockerVersion" -ForegroundColor Green
    
    # Check if OpenMRS container is running
    $openmrsRunning = docker ps --filter "name=openmrs" --format "{{.Names}}" 2>$null
    if ($openmrsRunning) {
        Write-Host "   ✅ OpenMRS container running" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  OpenMRS container not running" -ForegroundColor Yellow
        $issues += "OpenMRS container not running (run: docker-compose up -d)"
    }
    
    # Check if MySQL container is running
    $mysqlRunning = docker ps --filter "name=mysql" --format "{{.Names}}" 2>$null
    if ($mysqlRunning) {
        Write-Host "   ✅ MySQL container running" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  MySQL container not running" -ForegroundColor Yellow
        $issues += "MySQL container not running (run: docker-compose up -d)"
    }
} else {
    Write-Host "   ❌ Docker not found" -ForegroundColor Red
    $issues += "Docker not installed"
}

# 4. Check shared package
Write-Host "4. Checking shared package..." -ForegroundColor Yellow
if (Test-Path "shared\dist\index.js") {
    Write-Host "   ✅ Shared package built" -ForegroundColor Green
} else {
    Write-Host "   ❌ Shared package not built" -ForegroundColor Red
    $issues += "Shared package not built (run: cd shared; npm install; npm run build)"
}

# 5. Check OpenMRS MCP server
Write-Host "5. Checking OpenMRS MCP server..." -ForegroundColor Yellow
if (Test-Path "openmrs\dist\index.js") {
    Write-Host "   ✅ OpenMRS MCP server built" -ForegroundColor Green
} else {
    Write-Host "   ❌ OpenMRS MCP server not built" -ForegroundColor Red
    $issues += "OpenMRS MCP server not built (run: cd openmrs; npm install; npm run build)"
}

if (Test-Path "openmrs\node_modules") {
    Write-Host "   ✅ OpenMRS dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ❌ OpenMRS dependencies not installed" -ForegroundColor Red
    $issues += "OpenMRS dependencies not installed (run: cd openmrs; npm install)"
}

# 6. Check MySQL MCP server
Write-Host "6. Checking MySQL MCP server..." -ForegroundColor Yellow
if (Test-Path "mysql\dist\index.js") {
    Write-Host "   ✅ MySQL MCP server built" -ForegroundColor Green
} else {
    Write-Host "   ❌ MySQL MCP server not built" -ForegroundColor Red
    $issues += "MySQL MCP server not built (run: cd mysql; npm install; npm run build)"
}

if (Test-Path "mysql\node_modules") {
    Write-Host "   ✅ MySQL dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ❌ MySQL dependencies not installed" -ForegroundColor Red
    $issues += "MySQL dependencies not installed (run: cd mysql; npm install)"
}

# 7. Check environment variables
Write-Host "7. Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path "openmrs\.env") {
    Write-Host "   ✅ OpenMRS .env exists" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  OpenMRS .env not found (optional, uses defaults)" -ForegroundColor Yellow
}

if (Test-Path "mysql\.env") {
    Write-Host "   ✅ MySQL .env exists" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  MySQL .env not found (optional, uses defaults)" -ForegroundColor Yellow
}

# 8. Check AGENTS.md exists
Write-Host "8. Checking project context..." -ForegroundColor Yellow
if (Test-Path "..\AGENTS.md") {
    Write-Host "   ✅ AGENTS.md found" -ForegroundColor Green
} else {
    Write-Host "   ❌ AGENTS.md not found" -ForegroundColor Red
    $issues += "AGENTS.md not found in project root"
}

# Summary
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Verification Summary" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

if ($issues.Count -eq 0) {
    Write-Host ""
    Write-Host "✅ All checks passed! MCP infrastructure ready." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Configure Claude Desktop (see README.md)" -ForegroundColor White
    Write-Host "2. Test MCP servers work" -ForegroundColor White
    Write-Host ""
    exit 0
} else {
    Write-Host ""
    Write-Host "❌ Found $($issues.Count) issue(s):" -ForegroundColor Red
    foreach ($issue in $issues) {
        Write-Host "   - $issue" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Fix issues and run verify again." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
