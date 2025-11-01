# Install All MCP Servers
# Run from mcp-servers/ directory

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Installing MedReg MCP Servers" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# Check Node.js version
Write-Host "Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js not found. Install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Install shared package first
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "1/3: Installing Shared Package" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
cd shared
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install shared package" -ForegroundColor Red
    exit 1
}
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build shared package" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Shared package installed successfully" -ForegroundColor Green
Write-Host ""

# Install OpenMRS MCP Server
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "2/3: Installing OpenMRS MCP Server" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
cd ../openmrs
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install OpenMRS MCP server" -ForegroundColor Red
    exit 1
}
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build OpenMRS MCP server" -ForegroundColor Red
    exit 1
}
Write-Host "✅ OpenMRS MCP server installed successfully" -ForegroundColor Green
Write-Host ""

# Install MySQL MCP Server
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "3/3: Installing MySQL MCP Server" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
cd ../mysql
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install MySQL MCP server" -ForegroundColor Red
    exit 1
}
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build MySQL MCP server" -ForegroundColor Red
    exit 1
}
Write-Host "✅ MySQL MCP server installed successfully" -ForegroundColor Green
Write-Host ""

# Return to mcp-servers directory
cd ..

# Success summary
Write-Host "=====================================" -ForegroundColor Green
Write-Host "✅ Installation Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Ensure OpenMRS is running: docker-compose up -d" -ForegroundColor White
Write-Host "2. Configure Claude Desktop (see README.md)" -ForegroundColor White
Write-Host "3. Test MCP servers: .\scripts\test-mcp-servers.ps1" -ForegroundColor White
Write-Host ""
Write-Host "MCP Server locations:" -ForegroundColor Yellow
Write-Host "- OpenMRS: .\openmrs\dist\index.js" -ForegroundColor White
Write-Host "- MySQL:   .\mysql\dist\index.js" -ForegroundColor White
Write-Host ""
