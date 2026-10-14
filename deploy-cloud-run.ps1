# ============================================================
# Google Cloud Run Deployment Script for Rythu Nestham (రైతు నేస్తం)
# ============================================================

param(
    [string]$ProjectId = "",
    [string]$Region = "asia-south1",
    [string]$ServiceName = "rythu-nestham"
)

Write-Host "============================================================" -ForegroundColor Green
Write-Host "🌾 Deploying Rythu Nestham to Google Cloud Run" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green

# 1. Check if gcloud is installed and in path
$gcloudCmd = Get-Command gcloud -ErrorAction SilentlyContinue
if (-not $gcloudCmd) {
    # Check default Cloud SDK install locations
    $defaultPaths = @(
        "$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin",
        "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin",
        "C:\Program Files\Google\Cloud SDK\google-cloud-sdk\bin"
    )
    foreach ($p in $defaultPaths) {
        if (Test-Path "$p\gcloud.cmd") {
            $env:Path = "$p;" + $env:Path
            $gcloudCmd = "$p\gcloud.cmd"
            break
        }
    }
}

if (-not $gcloudCmd) {
    Write-Error "gcloud CLI not found. Please install Google Cloud SDK or run from Google Cloud Shell."
    exit 1
}

# 2. Check Authentication
Write-Host "Checking GCP Authentication..." -ForegroundColor Cyan
$activeAccount = (& gcloud auth list --filter=status:ACTIVE --format="value(account)") 2>$null
if (-not $activeAccount) {
    Write-Host "No active GCP account found. Launching login..." -ForegroundColor Yellow
    & gcloud auth login
}

# 3. Set Project ID
if (-not $ProjectId) {
    $currentProject = (& gcloud config get-value project) 2>$null
    if ($currentProject -and $currentProject -ne "(unset)") {
        $ProjectId = $currentProject
    } else {
        $ProjectId = Read-Host "Enter your Google Cloud Project ID"
    }
}

if (-not $ProjectId) {
    Write-Error "Project ID is required to deploy to Cloud Run."
    exit 1
}

Write-Host "Configuring Project: $ProjectId in Region: $Region..." -ForegroundColor Cyan
& gcloud config set project $ProjectId

# 4. Enable Required GCP APIs
Write-Host "Ensuring Cloud Run & Cloud Build APIs are enabled..." -ForegroundColor Cyan
& gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

# 5. Build Frontend Assets
Write-Host "Building React 18 production bundle..." -ForegroundColor Cyan
Push-Location frontend
& "C:\Program Files\nodejs\npm.cmd" run build
Pop-Location

# 6. Deploy directly from source to Cloud Run
Write-Host "Submitting build and deploying to Cloud Run..." -ForegroundColor Green
& gcloud run deploy $ServiceName `
    --source . `
    --region $Region `
    --platform managed `
    --allow-unauthenticated `
    --port 8080 `
    --memory 512Mi `
    --cpu 1

Write-Host "============================================================" -ForegroundColor Green
Write-Host "Deployment completed! Check the public HTTPS URL above." -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green

