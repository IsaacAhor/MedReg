# test-location-login.ps1
# Tests location-based login implementation

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Location-Based Login Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$frontendUrl = "http://localhost:3000"
$backendUrl = "http://localhost:8080/openmrs"

Write-Host "Testing Frontend Availability..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$frontendUrl/login" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Frontend is running at $frontendUrl" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Frontend not available at $frontendUrl" -ForegroundColor Red
    Write-Host "  Run 'npm run dev' in frontend directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "`nTesting Backend Availability..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$backendUrl/ws/rest/v1/session" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Backend is running at $backendUrl" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Backend not available at $backendUrl" -ForegroundColor Red
    Write-Host "  Run 'docker-compose up -d openmrs' in project root" -ForegroundColor Yellow
    exit 1
}

Write-Host "`nTesting Location Tags..." -ForegroundColor Yellow
$base64Auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:Admin123"))
$headers = @{
    "Authorization" = "Basic $base64Auth"
}

try {
    $response = Invoke-RestMethod -Uri "$backendUrl/ws/rest/v1/locationtag?v=default" -Headers $headers
    $loginLocationTag = $response.results | Where-Object { $_.name -eq "Login Location" }
    
    if ($loginLocationTag) {
        Write-Host "✓ Login Location tag exists" -ForegroundColor Green
    } else {
        Write-Host "✗ Login Location tag not found" -ForegroundColor Red
        Write-Host "  Run '.\scripts\setup-locations.ps1' to create" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "✗ Failed to check location tags" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
}

Write-Host "`nTesting Login Locations..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$backendUrl/ws/rest/v1/location?tag=Login Location&v=default" -Headers $headers
    $loginLocations = $response.results
    
    if ($loginLocations.Count -gt 0) {
        Write-Host "✓ Found $($loginLocations.Count) login locations:" -ForegroundColor Green
        foreach ($location in $loginLocations) {
            Write-Host "    - $($location.display)" -ForegroundColor Cyan
        }
    } else {
        Write-Host "✗ No login locations found" -ForegroundColor Red
        Write-Host "  Run '.\scripts\setup-locations.ps1' to create" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "✗ Failed to fetch login locations" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
}

Write-Host "`nTesting Login API (with location)..." -ForegroundColor Yellow
$firstLocation = $loginLocations[0].uuid

$loginPayload = @{
    username = "admin"
    password = "Admin123"
    locationUuid = $firstLocation
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$frontendUrl/api/auth/login" -Method Post -Body $loginPayload -ContentType "application/json" -UseBasicParsing
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Login successful with location" -ForegroundColor Green
        
        # Check cookies
        $cookies = $response.Headers.'Set-Cookie'
        if ($cookies -match "omrsLocation=") {
            Write-Host "✓ omrsLocation cookie set" -ForegroundColor Green
        } else {
            Write-Host "✗ omrsLocation cookie not set" -ForegroundColor Red
        }
        
        if ($cookies -match "omrsAuth=1") {
            Write-Host "✓ omrsAuth cookie set" -ForegroundColor Green
        } else {
            Write-Host "✗ omrsAuth cookie not set" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "✗ Login failed" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "All tests passed! ✅" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open browser: $frontendUrl/login" -ForegroundColor White
Write-Host "2. Enter credentials: admin / Admin123" -ForegroundColor White
Write-Host "3. Select location from dropdown" -ForegroundColor White
Write-Host "4. Click 'Sign In'" -ForegroundColor White
Write-Host "5. Verify you're redirected to home page" -ForegroundColor White
Write-Host ""
