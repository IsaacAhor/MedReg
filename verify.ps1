# MedReg Installation Verification Script
# Run this after setup to verify everything is working

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "MedReg Installation Verification" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check Docker containers
Write-Host "Checking Docker containers..." -ForegroundColor Yellow
$mysqlStatus = docker ps --filter "name=medreg-mysql" --format "{{.Status}}"
$openmrsStatus = docker ps --filter "name=medreg-openmrs" --format "{{.Status}}"

if ($mysqlStatus -match "Up") {
    Write-Host "✅ MySQL container is running" -ForegroundColor Green
} else {
    Write-Host "❌ MySQL container is not running" -ForegroundColor Red
    $allGood = $false
}

if ($openmrsStatus -match "Up") {
    Write-Host "✅ OpenMRS container is running" -ForegroundColor Green
} else {
    Write-Host "❌ OpenMRS container is not running" -ForegroundColor Red
    Write-Host "   Note: OpenMRS takes 3-5 minutes to start on first run" -ForegroundColor Yellow
    $allGood = $false
}

# Check OpenMRS accessibility
Write-Host ""
Write-Host "Checking OpenMRS accessibility..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/openmrs/" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ OpenMRS is accessible at http://localhost:8080/openmrs" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Cannot access OpenMRS at http://localhost:8080/openmrs" -ForegroundColor Red
    Write-Host "   OpenMRS may still be starting up (wait 3-5 minutes)" -ForegroundColor Yellow
    $allGood = $false
}

# Check frontend directory
Write-Host ""
Write-Host "Checking frontend setup..." -ForegroundColor Yellow
if (Test-Path "frontend/node_modules") {
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend dependencies not installed" -ForegroundColor Red
    Write-Host "   Run: cd frontend && npm install" -ForegroundColor Yellow
    $allGood = $false
}

if (Test-Path "frontend/.env.local") {
    Write-Host "✅ Frontend .env.local file exists" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend .env.local file missing" -ForegroundColor Red
    Write-Host "   Run: cd frontend && Copy-Item .env.example .env.local -Force" -ForegroundColor Yellow
    $allGood = $false
}

# Check configuration files
Write-Host ""
Write-Host "Checking configuration files..." -ForegroundColor Yellow
$requiredFiles = @(
    "docker-compose.yml",
    "openmrs-runtime.properties",
    "mysql-init/01-init-ghana-emr.sql",
    "frontend/package.json",
    "frontend/tsconfig.json",
    "frontend/next.config.mjs"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $file is missing" -ForegroundColor Red
        $allGood = $false
    }
}

# Summary
Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Verification Summary" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

if ($allGood) {
    Write-Host "✅ All checks passed! Installation is complete." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Access OpenMRS: http://localhost:8080/openmrs" -ForegroundColor Gray
    Write-Host "   Login: admin / Admin123" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Start frontend:" -ForegroundColor Gray
    Write-Host "   cd frontend" -ForegroundColor Gray
    Write-Host "   npm run dev" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Access frontend: http://localhost:3000" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Configure user roles in OpenMRS admin panel" -ForegroundColor Gray
    Write-Host ""
    Write-Host "5. Review docs/setup/week1-setup-guide.md" -ForegroundColor Gray
} else {
    Write-Host "⚠️  Some checks failed. Please review the errors above." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "- Wait 3-5 minutes for OpenMRS to fully start" -ForegroundColor Gray
    Write-Host "- Run: docker-compose up -d" -ForegroundColor Gray
    Write-Host "- Run: cd frontend && npm install" -ForegroundColor Gray
    Write-Host "- Check logs: docker-compose logs -f openmrs" -ForegroundColor Gray
}

Write-Host ""
Write-Host "For detailed troubleshooting, see:" -ForegroundColor Yellow
Write-Host "- docs/setup/week1-setup-guide.md" -ForegroundColor Gray
Write-Host "- docs/QUICK_REFERENCE.md" -ForegroundColor Gray
