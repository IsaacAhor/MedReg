# MedReg Week 1 Setup Script (PowerShell)
# Run this script to set up the complete development environment

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "MedReg Week 1 Setup" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Docker
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerInstalled) {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    Write-Host "   Download: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Docker is installed" -ForegroundColor Green

# Check Node.js
$nodeInstalled = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeInstalled) {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    Write-Host "   Download: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
$nodeVersion = node --version
Write-Host "✅ Node.js is installed ($nodeVersion)" -ForegroundColor Green

# Check pnpm
$pnpmInstalled = Get-Command pnpm -ErrorAction SilentlyContinue
if (-not $pnpmInstalled) {
    Write-Host "⚠️  pnpm is not installed. Skipping (using npm)..." -ForegroundColor Yellow
    # skipping pnpm installation (using npm)
    Write-Host "✅ pnpm check skipped" -ForegroundColor Green
} else {
    Write-Host "✅ pnpm is installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Starting Backend Setup (Docker)" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Start MySQL
Write-Host ""
Write-Host "Starting MySQL container..." -ForegroundColor Yellow
docker-compose up -d mysql

Write-Host "Waiting 30 seconds for MySQL to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Start OpenMRS
Write-Host ""
Write-Host "Starting OpenMRS container..." -ForegroundColor Yellow
docker-compose up -d openmrs

Write-Host ""
Write-Host "⏳ OpenMRS is starting (this takes 3-5 minutes on first run)..." -ForegroundColor Yellow
Write-Host "   You can monitor progress with: docker-compose logs -f openmrs" -ForegroundColor Gray

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Starting Frontend Setup (Next.js)" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Navigate to frontend directory
if (Test-Path "frontend") {
    Set-Location frontend
    
    # Install dependencies
    Write-Host ""
    Write-Host "Installing frontend dependencies (this may take 3-5 minutes)..." -ForegroundColor Yellow
    npm install
    
    # Copy environment file
    if (-not (Test-Path ".env.local")) {
        Write-Host ""
        Write-Host "Creating .env.local file..." -ForegroundColor Yellow
        Copy-Item .env.example .env.local
        Write-Host "✅ .env.local created" -ForegroundColor Green
    } else {
        Write-Host "✅ .env.local already exists" -ForegroundColor Green
    }
    
    Set-Location ..
} else {
    Write-Host "❌ Frontend directory not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "✅ Backend (OpenMRS + MySQL) is starting up" -ForegroundColor Green
Write-Host "   OpenMRS will be available at: http://localhost:8080/openmrs" -ForegroundColor Gray
Write-Host "   Default credentials: admin / Admin123" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
Write-Host "   To start frontend, run:" -ForegroundColor Gray
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host "   Frontend will be available at: http://localhost:3000" -ForegroundColor Gray

Write-Host ""
Write-Host "📚 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Wait for OpenMRS to fully start (check: docker-compose ps)" -ForegroundColor Gray
Write-Host "   2. Access OpenMRS at http://localhost:8080/openmrs" -ForegroundColor Gray
Write-Host "   3. Start frontend: cd frontend && npm run dev" -ForegroundColor Gray
Write-Host "   4. Configure user roles in OpenMRS admin panel" -ForegroundColor Gray
Write-Host "   5. Review docs/setup/week1-setup-guide.md" -ForegroundColor Gray

Write-Host ""
Write-Host "📖 Documentation:" -ForegroundColor Yellow
Write-Host "   - README.md" -ForegroundColor Gray
Write-Host "   - docs/setup/week1-setup-guide.md" -ForegroundColor Gray
Write-Host "   - docs/setup/week1-implementation-summary.md" -ForegroundColor Gray
Write-Host "   - AGENTS.md (comprehensive context)" -ForegroundColor Gray

Write-Host ""
Write-Host "🔧 Useful Commands:" -ForegroundColor Yellow
Write-Host "   docker-compose logs -f openmrs    # View OpenMRS logs" -ForegroundColor Gray
Write-Host "   docker-compose ps                 # Check service status" -ForegroundColor Gray
Write-Host "   docker-compose restart openmrs    # Restart OpenMRS" -ForegroundColor Gray
Write-Host "   docker-compose down               # Stop all services" -ForegroundColor Gray

Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Cyan
