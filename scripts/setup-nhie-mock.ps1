# Setup NHIE Mock Server
# Quick setup script for first-time NHIE mock initialization

Write-Host "=== Ghana EMR - NHIE Mock Server Setup ===" -ForegroundColor Cyan
Write-Host "This script will set up the NHIE mock server for development.`n" -ForegroundColor Gray

# Step 1: Start Docker services
Write-Host "[Step 1/4] Starting Docker services..." -ForegroundColor Yellow
docker-compose up -d nhie-mock-db nhie-mock

# Step 2: Wait for services to be healthy
Write-Host "`n[Step 2/4] Waiting for services to initialize..." -ForegroundColor Yellow
Write-Host "  - PostgreSQL: Waiting..." -ForegroundColor Gray
Start-Sleep -Seconds 10

Write-Host "  - HAPI FHIR: Waiting (this takes 60-90 seconds)..." -ForegroundColor Gray
$maxWait = 120
$elapsed = 0
$healthy = $false

while ($elapsed -lt $maxWait -and -not $healthy) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8090/fhir/metadata" -Method GET -ErrorAction Stop -TimeoutSec 5
        if ($response.resourceType -eq "CapabilityStatement") {
            $healthy = $true
            Write-Host "  ✅ NHIE mock is healthy!" -ForegroundColor Green
        }
    } catch {
        Start-Sleep -Seconds 5
        $elapsed += 5
        Write-Host "    Still waiting... ($elapsed seconds)" -ForegroundColor Gray
    }
}

if (-not $healthy) {
    Write-Host "`n❌ NHIE mock did not start within $maxWait seconds" -ForegroundColor Red
    Write-Host "Check logs: docker logs medreg-nhie-mock" -ForegroundColor Yellow
    exit 1
}

# Step 3: Run tests
Write-Host "`n[Step 3/4] Running connectivity tests..." -ForegroundColor Yellow
.\scripts\test-nhie-mock.ps1

# Step 4: Preload demo data
Write-Host "`n[Step 4/4] Do you want to preload demo data? (Y/N)" -ForegroundColor Yellow
$preload = Read-Host "Enter your choice"

if ($preload -eq "Y" -or $preload -eq "y") {
    .\scripts\preload-demo-data.ps1
} else {
    Write-Host "  Skipped demo data preload" -ForegroundColor Gray
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "NHIE Mock Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nNHIE Mock Endpoints:" -ForegroundColor White
Write-Host "  - Base URL:     http://localhost:8090/fhir" -ForegroundColor Gray
Write-Host "  - Web UI:       http://localhost:8090/" -ForegroundColor Gray
Write-Host "  - Metadata:     http://localhost:8090/fhir/metadata" -ForegroundColor Gray
Write-Host "  - PostgreSQL:   localhost:5433 (user: hapi, db: hapi)" -ForegroundColor Gray

Write-Host "`nQuick Commands:" -ForegroundColor White
Write-Host "  - Test mock:    .\scripts\test-nhie-mock.ps1" -ForegroundColor Gray
Write-Host "  - Preload data: .\scripts\preload-demo-data.ps1" -ForegroundColor Gray
Write-Host "  - View logs:    docker logs -f medreg-nhie-mock" -ForegroundColor Gray
Write-Host "  - Stop mock:    docker-compose stop nhie-mock nhie-mock-db" -ForegroundColor Gray
Write-Host "  - Restart:      docker-compose restart nhie-mock" -ForegroundColor Gray

Write-Host "`nNext Steps:" -ForegroundColor White
Write-Host "  1. Configure Ghana EMR: Set 'ghana.nhie.mode=mock' in openmrs-runtime.properties" -ForegroundColor Gray
Write-Host "  2. Implement NHIEHttpClient (Task #6)" -ForegroundColor Gray
Write-Host "  3. Test patient registration → NHIE sync" -ForegroundColor Gray

Write-Host "`n✅ Setup complete! Ready for development." -ForegroundColor Green
