# setup-locations.ps1
# Sets up Ghana EMR location tags and locations in OpenMRS

param(
    [string]$OpenMRSUrl = "http://localhost:8080/openmrs",
    [string]$Username = "admin",
    [string]$Password = "Admin123"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Ghana EMR Location Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Base64 encode credentials
$base64Auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${Username}:${Password}"))
$headers = @{
    "Authorization" = "Basic $base64Auth"
    "Content-Type" = "application/json"
}

# Test connection
Write-Host "Testing OpenMRS connection..." -ForegroundColor Yellow
try {
    $session = Invoke-RestMethod -Uri "$OpenMRSUrl/ws/rest/v1/session" -Headers $headers -Method Get
    if ($session.authenticated) {
        Write-Host "✓ Connected as: $($session.user.display)" -ForegroundColor Green
    } else {
        throw "Authentication failed"
    }
} catch {
    Write-Host "✗ Failed to connect to OpenMRS" -ForegroundColor Red
    Write-Host "  URL: $OpenMRSUrl" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    exit 1
}

# Location Tags to create
$locationTags = @(
    @{
        uuid = "b8bbf83e-645f-451f-8efe-a0db56f09676"
        name = "Login Location"
        description = "When a user logs in and chooses a session location they may only choose one with this tag"
    },
    @{
        uuid = "1c783dca-fd54-4ea8-a0fc-2875374e9d42"
        name = "Queue Room"
        description = "Locations where patients can be queued for service"
    },
    @{
        uuid = "37dd4458-dc9e-4ae6-a1f1-789c1162d37b"
        name = "Visit Location"
        description = "Visits are only allowed to happen at locations tagged with this tag"
    },
    @{
        uuid = "89a80c4d-2899-11ed-bdcb-507b9dea1806"
        name = "Main Pharmacy"
        description = "Main pharmacy location for drug dispensing"
    }
)

Write-Host "`nCreating Location Tags..." -ForegroundColor Yellow
foreach ($tag in $locationTags) {
    try {
        # Check if tag exists
        $existing = $null
        try {
            $existing = Invoke-RestMethod -Uri "$OpenMRSUrl/ws/rest/v1/locationtag/$($tag.uuid)" -Headers $headers -Method Get
        } catch {
            # Tag doesn't exist
        }

        if ($existing) {
            Write-Host "  - $($tag.name): Already exists" -ForegroundColor Gray
        } else {
            $body = @{
                uuid = $tag.uuid
                name = $tag.name
                description = $tag.description
            } | ConvertTo-Json

            Invoke-RestMethod -Uri "$OpenMRSUrl/ws/rest/v1/locationtag" -Headers $headers -Method Post -Body $body | Out-Null
            Write-Host "  ✓ $($tag.name): Created" -ForegroundColor Green
        }
    } catch {
        Write-Host "  ✗ $($tag.name): Failed - $_" -ForegroundColor Red
    }
}

# Locations to create
$locations = @(
    @{
        uuid = "facility-001"
        name = "Ghana EMR Facility"
        description = "Default facility for Ghana EMR"
        tags = @("37dd4458-dc9e-4ae6-a1f1-789c1162d37b")  # Visit Location
    },
    @{
        uuid = "reception-001"
        name = "Reception"
        description = "Patient registration and records"
        parent = "facility-001"
        tags = @("b8bbf83e-645f-451f-8efe-a0db56f09676", "1c783dca-fd54-4ea8-a0fc-2875374e9d42", "37dd4458-dc9e-4ae6-a1f1-789c1162d37b")
    },
    @{
        uuid = "triage-001"
        name = "Triage"
        description = "Patient assessment and vital signs"
        parent = "facility-001"
        tags = @("b8bbf83e-645f-451f-8efe-a0db56f09676", "1c783dca-fd54-4ea8-a0fc-2875374e9d42", "37dd4458-dc9e-4ae6-a1f1-789c1162d37b")
    },
    @{
        uuid = "opd-room-001"
        name = "OPD Room 1"
        description = "General outpatient consultation"
        parent = "facility-001"
        tags = @("b8bbf83e-645f-451f-8efe-a0db56f09676", "1c783dca-fd54-4ea8-a0fc-2875374e9d42", "37dd4458-dc9e-4ae6-a1f1-789c1162d37b")
    },
    @{
        uuid = "opd-room-002"
        name = "OPD Room 2"
        description = "General outpatient consultation"
        parent = "facility-001"
        tags = @("b8bbf83e-645f-451f-8efe-a0db56f09676", "1c783dca-fd54-4ea8-a0fc-2875374e9d42", "37dd4458-dc9e-4ae6-a1f1-789c1162d37b")
    },
    @{
        uuid = "pharmacy-001"
        name = "Pharmacy"
        description = "Drug dispensing and counseling"
        parent = "facility-001"
        tags = @("b8bbf83e-645f-451f-8efe-a0db56f09676", "1c783dca-fd54-4ea8-a0fc-2875374e9d42", "37dd4458-dc9e-4ae6-a1f1-789c1162d37b", "89a80c4d-2899-11ed-bdcb-507b9dea1806")
    },
    @{
        uuid = "cashier-001"
        name = "Cashier"
        description = "Payment and billing"
        parent = "facility-001"
        tags = @("b8bbf83e-645f-451f-8efe-a0db56f09676", "1c783dca-fd54-4ea8-a0fc-2875374e9d42", "37dd4458-dc9e-4ae6-a1f1-789c1162d37b")
    },
    @{
        uuid = "laboratory-001"
        name = "Laboratory"
        description = "Clinical laboratory services"
        parent = "facility-001"
        tags = @("b8bbf83e-645f-451f-8efe-a0db56f09676", "37dd4458-dc9e-4ae6-a1f1-789c1162d37b")
    }
)

Write-Host "`nCreating Locations..." -ForegroundColor Yellow
foreach ($location in $locations) {
    try {
        # Check if location exists
        $existing = $null
        try {
            $existing = Invoke-RestMethod -Uri "$OpenMRSUrl/ws/rest/v1/location/$($location.uuid)" -Headers $headers -Method Get
        } catch {
            # Location doesn't exist
        }

        if ($existing) {
            Write-Host "  - $($location.name): Already exists" -ForegroundColor Gray
        } else {
            $body = @{
                uuid = $location.uuid
                name = $location.name
                description = $location.description
            }

            if ($location.parent) {
                $body.parentLocation = $location.parent
            }

            if ($location.tags) {
                $body.tags = $location.tags | ForEach-Object { @{ uuid = $_ } }
            }

            $bodyJson = $body | ConvertTo-Json -Depth 10

            Invoke-RestMethod -Uri "$OpenMRSUrl/ws/rest/v1/location" -Headers $headers -Method Post -Body $bodyJson | Out-Null
            Write-Host "  ✓ $($location.name): Created" -ForegroundColor Green
        }
    } catch {
        Write-Host "  ✗ $($location.name): Failed - $_" -ForegroundColor Red
    }
}

# Verify setup
Write-Host "`nVerifying Setup..." -ForegroundColor Yellow
try {
    $loginLocations = Invoke-RestMethod -Uri "$OpenMRSUrl/ws/rest/v1/location?tag=Login Location&v=default" -Headers $headers -Method Get
    Write-Host "  ✓ Found $($loginLocations.results.Count) login locations" -ForegroundColor Green
    
    foreach ($loc in $loginLocations.results) {
        Write-Host "    - $($loc.display)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "  ✗ Failed to verify setup" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Test login at: http://localhost:3000/login" -ForegroundColor White
Write-Host "2. You should see location dropdown with:" -ForegroundColor White
Write-Host "   - Reception" -ForegroundColor White
Write-Host "   - Triage" -ForegroundColor White
Write-Host "   - OPD Room 1" -ForegroundColor White
Write-Host "   - OPD Room 2" -ForegroundColor White
Write-Host "   - Pharmacy" -ForegroundColor White
Write-Host "   - Cashier" -ForegroundColor White
Write-Host "   - Laboratory" -ForegroundColor White
Write-Host ""
