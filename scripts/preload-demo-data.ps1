# Preload Demo Data for NHIE Mock
# Purpose: Create realistic patient data for MoH demos

Write-Host "=== Preloading Demo Data to NHIE Mock ===" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

$nhieBaseUrl = "http://localhost:8090/fhir"
$patientsCreated = 0
$coveragesCreated = 0

# Check NHIE mock is running
Write-Host "`nChecking NHIE mock status..." -ForegroundColor Yellow
try {
    $metadata = Invoke-RestMethod -Uri "$nhieBaseUrl/metadata" -Method GET -ErrorAction Stop
    Write-Host "✅ NHIE mock is running" -ForegroundColor Green
} catch {
    Write-Host "❌ NHIE mock is not running. Start with: docker-compose up -d nhie-mock" -ForegroundColor Red
    exit 1
}

# Demo patients (realistic Ghana names and data)
$demoPatients = @(
    @{
        ghanaCard = "GHA-123456789-0"
        nhis = "0123456789"
        givenName = "Kwame"
        middleName = "Kofi"
        familyName = "Mensah"
        gender = "male"
        birthDate = "1985-03-15"
        phone = "+233244123456"
        city = "Accra"
        district = "Accra Metro"
        state = "Greater Accra"
        nhisStatus = "active"
    },
    @{
        ghanaCard = "GHA-987654321-5"
        nhis = "9876543210"
        givenName = "Ama"
        middleName = "Abena"
        familyName = "Asante"
        gender = "female"
        birthDate = "1990-07-22"
        phone = "+233244987654"
        city = "Kumasi"
        district = "Kumasi Metro"
        state = "Ashanti"
        nhisStatus = "active"
    },
    @{
        ghanaCard = "GHA-555666777-8"
        nhis = "5556667778"
        givenName = "Kofi"
        middleName = "Yaw"
        familyName = "Owusu"
        gender = "male"
        birthDate = "1978-11-30"
        phone = "+233244555666"
        city = "Tamale"
        district = "Tamale Metro"
        state = "Northern"
        nhisStatus = "active"
    },
    @{
        ghanaCard = "GHA-111222333-4"
        nhis = "1112223334"
        givenName = "Akosua"
        middleName = "Esi"
        familyName = "Boateng"
        gender = "female"
        birthDate = "1992-05-18"
        phone = "+233244111222"
        city = "Cape Coast"
        district = "Cape Coast Metro"
        state = "Central"
        nhisStatus = "active"
    },
    @{
        ghanaCard = "GHA-444555666-7"
        nhis = "4445556667"
        givenName = "Kwabena"
        middleName = "Kwaku"
        familyName = "Agyei"
        gender = "male"
        birthDate = "1980-09-12"
        phone = "+233244444555"
        city = "Takoradi"
        district = "Sekondi-Takoradi Metro"
        state = "Western"
        nhisStatus = "active"
    },
    @{
        ghanaCard = "GHA-777888999-0"
        nhis = "7778889990"
        givenName = "Abena"
        middleName = "Adjoa"
        familyName = "Mensah"
        gender = "female"
        birthDate = "1995-02-28"
        phone = "+233244777888"
        city = "Sunyani"
        district = "Sunyani Municipal"
        state = "Brong Ahafo"
        nhisStatus = "active"
    },
    @{
        ghanaCard = "GHA-222333444-5"
        nhis = "2223334445"
        givenName = "Yaw"
        middleName = "Kwesi"
        familyName = "Appiah"
        gender = "male"
        birthDate = "1988-06-05"
        phone = "+233244222333"
        city = "Ho"
        district = "Ho Municipal"
        state = "Volta"
        nhisStatus = "active"
    },
    @{
        ghanaCard = "GHA-666777888-9"
        nhis = "6667778889"
        givenName = "Akua"
        middleName = "Efua"
        familyName = "Osei"
        gender = "female"
        birthDate = "1993-10-14"
        phone = "+233244666777"
        city = "Koforidua"
        district = "New Juaben Municipal"
        state = "Eastern"
        nhisStatus = "active"
    },
    @{
        ghanaCard = "GHA-333444555-6"
        nhis = "3334445556"
        givenName = "Kwame"
        middleName = "Agyeman"
        familyName = "Danquah"
        gender = "male"
        birthDate = "1982-12-20"
        phone = "+233244333444"
        city = "Bolgatanga"
        district = "Bolgatanga Municipal"
        state = "Upper East"
        nhisStatus = "active"
    },
    @{
        ghanaCard = "GHA-888999000-1"
        nhis = "8889990001"
        givenName = "Adwoa"
        middleName = "Afia"
        familyName = "Frimpong"
        gender = "female"
        birthDate = "1991-04-09"
        phone = "+233244888999"
        city = "Wa"
        district = "Wa Municipal"
        state = "Upper West"
        nhisStatus = "active"
    },
    # Add expired NHIS for testing
    @{
        ghanaCard = "GHA-000111222-3"
        nhis = "0001112223"
        givenName = "Nana"
        middleName = "Kwame"
        familyName = "Anane"
        gender = "male"
        birthDate = "1975-08-25"
        phone = "+233244000111"
        city = "Accra"
        district = "Accra Metro"
        state = "Greater Accra"
        nhisStatus = "cancelled"  # Expired coverage
    }
)

Write-Host "`nCreating $($demoPatients.Count) demo patients..." -ForegroundColor Yellow

foreach ($patient in $demoPatients) {
    Write-Host "`n  Creating patient: $($patient.givenName) $($patient.middleName) $($patient.familyName)..." -ForegroundColor Gray
    
    # Build FHIR Patient resource
    $patientPayload = @{
        resourceType = "Patient"
        identifier = @(
            @{
                system = "http://moh.gov.gh/fhir/identifier/ghana-card"
                value = $patient.ghanaCard
            },
            @{
                system = "http://moh.gov.gh/fhir/identifier/nhis"
                value = $patient.nhis
            }
        )
        name = @(
            @{
                use = "official"
                family = $patient.familyName
                given = @($patient.givenName, $patient.middleName)
            }
        )
        gender = $patient.gender
        birthDate = $patient.birthDate
        telecom = @(
            @{
                system = "phone"
                value = $patient.phone
                use = "mobile"
            }
        )
        address = @(
            @{
                use = "home"
                text = "$($patient.city), Ghana"
                city = $patient.city
                district = $patient.district
                state = $patient.state
                country = "GH"
            }
        )
    } | ConvertTo-Json -Depth 10
    
    try {
        # Create patient with conditional create (idempotent)
        $patientResponse = Invoke-RestMethod -Uri "$nhieBaseUrl/Patient" `
            -Method POST `
            -Headers @{
                "Content-Type"="application/fhir+json"
                "If-None-Exist"="identifier=http://moh.gov.gh/fhir/identifier/ghana-card|$($patient.ghanaCard)"
            } `
            -Body $patientPayload `
            -ErrorAction Stop
        
        $patientId = $patientResponse.id
        Write-Host "    ✅ Patient ID: $patientId" -ForegroundColor Green
        $patientsCreated++
        
        # Create NHIS Coverage
        $coveragePayload = @{
            resourceType = "Coverage"
            status = $patient.nhisStatus
            beneficiary = @{
                reference = "Patient/$patientId"
                identifier = @{
                    system = "http://moh.gov.gh/fhir/identifier/nhis"
                    value = $patient.nhis
                }
            }
            payor = @(
                @{
                    display = "National Health Insurance Authority"
                }
            )
            period = if ($patient.nhisStatus -eq "active") {
                @{
                    start = "2025-01-01"
                    end = "2025-12-31"
                }
            } else {
                @{
                    start = "2024-01-01"
                    end = "2024-12-31"
                }
            }
        } | ConvertTo-Json -Depth 10
        
        $coverageResponse = Invoke-RestMethod -Uri "$nhieBaseUrl/Coverage" `
            -Method POST `
            -Headers @{"Content-Type"="application/fhir+json"} `
            -Body $coveragePayload `
            -ErrorAction Stop
        
        Write-Host "    ✅ Coverage ID: $($coverageResponse.id), Status: $($patient.nhisStatus)" -ForegroundColor Green
        $coveragesCreated++
        
    } catch {
        Write-Host "    ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 100  # Rate limiting
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Demo Data Preload Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Patients Created:  $patientsCreated / $($demoPatients.Count)" -ForegroundColor Green
Write-Host "Coverages Created: $coveragesCreated / $($demoPatients.Count)" -ForegroundColor Green

if ($patientsCreated -eq $demoPatients.Count) {
    Write-Host "`n✅ All demo data loaded successfully!" -ForegroundColor Green
    Write-Host "`nYou can now:" -ForegroundColor White
    Write-Host "  - Search patients: GET $nhieBaseUrl/Patient" -ForegroundColor Gray
    Write-Host "  - Check eligibility: GET $nhieBaseUrl/Coverage?beneficiary.identifier=..." -ForegroundColor Gray
    Write-Host "  - Browse data: Open http://localhost:8090/ in browser" -ForegroundColor Gray
} else {
    Write-Host "`n⚠️  Some data failed to load. Check errors above." -ForegroundColor Yellow
}
