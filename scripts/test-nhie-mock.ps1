# Test NHIE Mock Server
# Purpose: Verify NHIE mock is running and responding correctly

Write-Host "=== Testing NHIE Mock Server ===" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

# Configuration
$nhieBaseUrl = "http://localhost:8090/fhir"
$testsPassed = 0
$testsFailed = 0

# Helper function for test results
function Test-Result {
    param(
        [string]$TestName,
        [bool]$Success,
        [string]$Message = ""
    )
    
    if ($Success) {
        Write-Host "✅ $TestName" -ForegroundColor Green
        if ($Message) { Write-Host "   $Message" -ForegroundColor Gray }
        $script:testsPassed++
    } else {
        Write-Host "❌ $TestName" -ForegroundColor Red
        if ($Message) { Write-Host "   $Message" -ForegroundColor Yellow }
        $script:testsFailed++
    }
}

# Test 1: Check NHIE mock is running
Write-Host "`n[Test 1] Checking NHIE mock health..." -ForegroundColor Yellow
try {
    $metadata = Invoke-RestMethod -Uri "$nhieBaseUrl/metadata" -Method GET -ErrorAction Stop
    $isHealthy = $metadata.resourceType -eq "CapabilityStatement" -and $metadata.fhirVersion -like "4.0.*"
    Test-Result "NHIE mock is healthy" $isHealthy "FHIR Version: $($metadata.fhirVersion)"
} catch {
    Test-Result "NHIE mock is healthy" $false "Error: $($_.Exception.Message)"
    Write-Host "`n⚠️  Make sure NHIE mock is running: docker-compose up -d nhie-mock" -ForegroundColor Yellow
    exit 1
}

# Test 2: Create test patient
Write-Host "`n[Test 2] Creating test patient..." -ForegroundColor Yellow
$testGhanaCard = "GHA-999888777-6"
$patientPayload = @{
    resourceType = "Patient"
    identifier = @(
        @{
            system = "http://moh.gov.gh/fhir/identifier/ghana-card"
            value = $testGhanaCard
        },
        @{
            system = "http://moh.gov.gh/fhir/identifier/nhis"
            value = "9998887776"
        }
    )
    name = @(
        @{
            use = "official"
            family = "TestPatient"
            given = @("Ghana", "EMR")
        }
    )
    gender = "male"
    birthDate = "1990-01-01"
    telecom = @(
        @{
            system = "phone"
            value = "+233244999888"
            use = "mobile"
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$nhieBaseUrl/Patient" `
        -Method POST `
        -Headers @{"Content-Type"="application/fhir+json"} `
        -Body $patientPayload `
        -ErrorAction Stop
    
    $patientId = $response.id
    Test-Result "Patient created successfully" ($null -ne $patientId) "Patient ID: $patientId"
} catch {
    Test-Result "Patient created successfully" $false "Error: $($_.Exception.Message)"
}

# Test 3: Search for patient by Ghana Card
Write-Host "`n[Test 3] Searching for patient by Ghana Card..." -ForegroundColor Yellow
try {
    $searchUrl = "$nhieBaseUrl/Patient?identifier=http://moh.gov.gh/fhir/identifier/ghana-card|$testGhanaCard"
    $searchResult = Invoke-RestMethod -Uri $searchUrl -Method GET -ErrorAction Stop
    
    $found = $searchResult.total -gt 0
    if ($found) {
        $foundPatient = $searchResult.entry[0].resource
        $patientName = "$($foundPatient.name[0].given[0]) $($foundPatient.name[0].family)"
        Test-Result "Patient found by Ghana Card" $true "Name: $patientName, ID: $($foundPatient.id)"
    } else {
        Test-Result "Patient found by Ghana Card" $false "No patient found with Ghana Card: $testGhanaCard"
    }
} catch {
    Test-Result "Patient found by Ghana Card" $false "Error: $($_.Exception.Message)"
}

# Test 4: Test conditional create (idempotency)
Write-Host "`n[Test 4] Testing conditional create (duplicate prevention)..." -ForegroundColor Yellow
try {
    $conditionalResponse = Invoke-RestMethod -Uri "$nhieBaseUrl/Patient" `
        -Method POST `
        -Headers @{
            "Content-Type"="application/fhir+json"
            "If-None-Exist"="identifier=http://moh.gov.gh/fhir/identifier/ghana-card|$testGhanaCard"
        } `
        -Body $patientPayload `
        -ErrorAction Stop
    
    # HAPI FHIR returns existing patient (200) instead of creating new one
    $isDuplicate = $conditionalResponse.id -eq $patientId
    Test-Result "Duplicate prevention works" $isDuplicate "Returned existing patient (idempotent)"
} catch {
    # Some FHIR servers return 412 Precondition Failed for duplicates
    $is412 = $_.Exception.Response.StatusCode.value__ -eq 412
    Test-Result "Duplicate prevention works" $is412 "Duplicate detected (expected behavior)"
}

# Test 5: Search by NHIS number
Write-Host "`n[Test 5] Searching by NHIS number..." -ForegroundColor Yellow
try {
    $nhisSearchUrl = "$nhieBaseUrl/Patient?identifier=http://moh.gov.gh/fhir/identifier/nhis|9998887776"
    $nhisSearchResult = Invoke-RestMethod -Uri $nhisSearchUrl -Method GET -ErrorAction Stop
    
    $foundByNhis = $nhisSearchResult.total -gt 0
    Test-Result "Patient found by NHIS number" $foundByNhis
} catch {
    Test-Result "Patient found by NHIS number" $false "Error: $($_.Exception.Message)"
}

# Test 6: Get patient by ID
Write-Host "`n[Test 6] Getting patient by ID..." -ForegroundColor Yellow
try {
    $getResponse = Invoke-RestMethod -Uri "$nhieBaseUrl/Patient/$patientId" -Method GET -ErrorAction Stop
    $isValid = $getResponse.resourceType -eq "Patient" -and $getResponse.id -eq $patientId
    Test-Result "Patient retrieved by ID" $isValid "Resource Type: $($getResponse.resourceType)"
} catch {
    Test-Result "Patient retrieved by ID" $false "Error: $($_.Exception.Message)"
}

# Test 7: Create NHIS Coverage (for eligibility checks)
Write-Host "`n[Test 7] Creating NHIS Coverage resource..." -ForegroundColor Yellow
$coveragePayload = @{
    resourceType = "Coverage"
    status = "active"
    beneficiary = @{
        reference = "Patient/$patientId"
        identifier = @{
            system = "http://moh.gov.gh/fhir/identifier/nhis"
            value = "9998887776"
        }
    }
    payor = @(
        @{
            display = "National Health Insurance Authority"
        }
    )
    period = @{
        start = "2025-01-01"
        end = "2025-12-31"
    }
} | ConvertTo-Json -Depth 10

try {
    $coverageResponse = Invoke-RestMethod -Uri "$nhieBaseUrl/Coverage" `
        -Method POST `
        -Headers @{"Content-Type"="application/fhir+json"} `
        -Body $coveragePayload `
        -ErrorAction Stop
    
    $coverageId = $coverageResponse.id
    Test-Result "Coverage created successfully" ($null -ne $coverageId) "Coverage ID: $coverageId, Status: active"
} catch {
    Test-Result "Coverage created successfully" $false "Error: $($_.Exception.Message)"
}

# Test 8: Check NHIS eligibility
Write-Host "`n[Test 8] Checking NHIS eligibility..." -ForegroundColor Yellow
try {
    $eligibilityUrl = "$nhieBaseUrl/Coverage?beneficiary.identifier=http://moh.gov.gh/fhir/identifier/nhis|9998887776"
    $eligibilityResult = Invoke-RestMethod -Uri $eligibilityUrl -Method GET -ErrorAction Stop
    
    $hasActiveCoverage = $false
    if ($eligibilityResult.total -gt 0) {
        $coverage = $eligibilityResult.entry[0].resource
        $hasActiveCoverage = $coverage.status -eq "active"
        $validTo = $coverage.period.end
        Test-Result "NHIS eligibility check" $hasActiveCoverage "Status: active, Valid until: $validTo"
    } else {
        Test-Result "NHIS eligibility check" $false "No coverage found"
    }
} catch {
    Test-Result "NHIS eligibility check" $false "Error: $($_.Exception.Message)"
}

# Test 9: Test invalid request (missing required field)
Write-Host "`n[Test 9] Testing invalid request handling..." -ForegroundColor Yellow
$invalidPayload = @{
    resourceType = "Patient"
    # Missing identifier (required field)
    name = @(@{given=@("Test")})
} | ConvertTo-Json -Depth 10

try {
    $invalidResponse = Invoke-RestMethod -Uri "$nhieBaseUrl/Patient" `
        -Method POST `
        -Headers @{"Content-Type"="application/fhir+json"} `
        -Body $invalidPayload `
        -ErrorAction Stop
    
    Test-Result "Invalid request rejected" $false "Request should have failed but succeeded"
} catch {
    $is400 = $_.Exception.Response.StatusCode.value__ -eq 400
    Test-Result "Invalid request rejected" $is400 "Returned 400 Bad Request (expected)"
}

# Test 10: Performance check (response time)
Write-Host "`n[Test 10] Performance check..." -ForegroundColor Yellow
try {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $perfResponse = Invoke-RestMethod -Uri "$nhieBaseUrl/Patient/$patientId" -Method GET -ErrorAction Stop
    $stopwatch.Stop()
    
    $responseTimeMs = $stopwatch.ElapsedMilliseconds
    $isPerformant = $responseTimeMs -lt 2000  # Should respond within 2 seconds
    Test-Result "Response time acceptable" $isPerformant "Response time: $responseTimeMs ms"
} catch {
    Test-Result "Response time acceptable" $false "Error: $($_.Exception.Message)"
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Results Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Tests Passed: $testsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -gt 0) { "Red" } else { "Green" })
Write-Host "Total Tests:  $($testsPassed + $testsFailed)" -ForegroundColor White

if ($testsFailed -eq 0) {
    Write-Host "`n✅ All tests passed! NHIE mock is working correctly." -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n⚠️  Some tests failed. Check logs above for details." -ForegroundColor Yellow
    exit 1
}
