# Fix OpenMRS Spring Bean Error on Windows Docker Desktop
# Run this script in PowerShell on your Windows machine

Write-Host "Fixing OpenMRS container error..." -ForegroundColor Cyan

# Stop the OpenMRS container
Write-Host "`n1. Stopping OpenMRS container..." -ForegroundColor Yellow
docker stop openmrs

# Clear the OpenMRS lib cache (this fixes the Spring proxy error)
Write-Host "`n2. Clearing OpenMRS lib cache..." -ForegroundColor Yellow
docker exec openmrs rm -rf /usr/local/tomcat/.OpenMRS/.openmrs-lib-cache/* 2>$null

# If the above fails (container stopped), we need to start it temporarily
if ($LASTEXITCODE -ne 0) {
    Write-Host "   Container is stopped, starting temporarily to clear cache..." -ForegroundColor Gray
    docker start openmrs
    Start-Sleep -Seconds 5
    docker exec openmrs rm -rf /usr/local/tomcat/.OpenMRS/.openmrs-lib-cache/*
    docker stop openmrs
}

# Start the OpenMRS container
Write-Host "`n3. Starting OpenMRS container..." -ForegroundColor Yellow
docker start openmrs

# Wait for OpenMRS to initialize
Write-Host "`n4. Waiting for OpenMRS to initialize (90 seconds)..." -ForegroundColor Yellow
for ($i = 90; $i -gt 0; $i--) {
    Write-Progress -Activity "Waiting for OpenMRS" -Status "$i seconds remaining" -PercentComplete ((90-$i)/90*100)
    Start-Sleep -Seconds 1
}
Write-Progress -Activity "Waiting for OpenMRS" -Completed

# Test the REST API
Write-Host "`n5. Testing OpenMRS REST API..." -ForegroundColor Yellow
$base64Auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:Admin123"))
$headers = @{
    Authorization = "Basic $base64Auth"
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/openmrs/ws/rest/v1/session" -Headers $headers -Method Get
    if ($response.authenticated -eq $true) {
        Write-Host "`n✅ SUCCESS! OpenMRS is working!" -ForegroundColor Green
        Write-Host "   User: $($response.user.username)" -ForegroundColor Green
        Write-Host "   Authenticated: $($response.authenticated)" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️  OpenMRS responded but not authenticated" -ForegroundColor Yellow
        Write-Host $response
    }
} catch {
    Write-Host "`n❌ ERROR: OpenMRS still has issues" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n   Checking logs..." -ForegroundColor Yellow
    docker logs openmrs --tail 50
}

Write-Host "`nDone! Check Docker Desktop to verify container status." -ForegroundColor Cyan
