param(
  [switch]$SkipTests
)

# Build OpenMRS custom modules and copy .omod artifacts to openmrs-modules/
$ErrorActionPreference = 'Stop'

function Ensure-Tool($name, $cmd) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
    Write-Error "Required tool '$name' not found in PATH. Please install $name and retry."
  }
}

Ensure-Tool 'Java (JDK 8+)' 'java'
Ensure-Tool 'Maven' 'mvn'

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

$mvnArgs = @('package','-pl','backend/openmrs-module-ghanaemr,backend/ghana-foldernumber','-am')
if ($SkipTests) { $mvnArgs += '-DskipTests' }

Write-Host "[MedReg] Building modules via Maven..." -ForegroundColor Cyan
mvn @mvnArgs

$outDir = Join-Path $root 'openmrs-modules'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function Copy-ModuleArtifacts($modulePath) {
  $target = Join-Path $modulePath 'omod/target'
  if (-not (Test-Path $target)) { return }
  Get-ChildItem -Path $target -Filter '*.jar' -File -ErrorAction SilentlyContinue | ForEach-Object {
    $src = $_.FullName
    $name = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
    $dest = Join-Path $outDir ($name + '.omod')
    Copy-Item $src $dest -Force
    Write-Host "[MedReg] Copied $(Split-Path $src -Leaf) -> $(Split-Path $dest -Leaf)" -ForegroundColor Green
  }
  Get-ChildItem -Path $target -Filter '*.omod' -File -ErrorAction SilentlyContinue | ForEach-Object {
    Copy-Item $_.FullName $outDir -Force
    Write-Host "[MedReg] Copied $(Split-Path $_.FullName -Leaf)" -ForegroundColor Green
  }
}

Copy-ModuleArtifacts (Join-Path $root 'backend/openmrs-module-ghanaemr')
Copy-ModuleArtifacts (Join-Path $root 'backend/ghana-foldernumber')

Write-Host "[MedReg] Output modules directory: $outDir" -ForegroundColor Cyan
Write-Host "[MedReg] Next: docker-compose up -d openmrs" -ForegroundColor Cyan

