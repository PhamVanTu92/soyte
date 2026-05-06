# ============================================================
#  publish.ps1 — Deploy soyte-be lên IIS Windows
#  Cách dùng:
#    .\publish.ps1                        # deploy lên đường dẫn mặc định
#    .\publish.ps1 -Dest "D:\sites\api"  # deploy lên đường dẫn tùy chọn
# ============================================================
param(
    [string]$Dest = "C:\inetpub\wwwroot\soyte-be"
)

$Source = $PSScriptRoot   # thư mục chứa publish.ps1 (root project)
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  SOYTE-BE — Publish to IIS" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Source : $Source"
Write-Host "  Dest   : $Dest"
Write-Host ""

# ── 1. Tạo thư mục đích nếu chưa có ─────────────────────────
if (-not (Test-Path $Dest)) {
    New-Item -ItemType Directory -Path $Dest -Force | Out-Null
    Write-Host "[1/4] Created destination folder." -ForegroundColor Green
} else {
    Write-Host "[1/4] Destination folder exists." -ForegroundColor Yellow
}

# ── 2. Copy source (robocopy bỏ qua các thư mục không cần) ──
Write-Host "[2/4] Copying files..." -ForegroundColor Cyan

$excludeDirs = @(
    "node_modules",
    "logs",
    ".git",
    "uploads",   # giữ lại uploads cũ trên server; không ghi đè
    "dist"
)

$excludeFiles = @(
    ".env",           # KHÔNG copy .env — phải config riêng trên server
    "*.log",
    "publish.ps1",
    "debug-info.js",
    "migrate.js"
)

$robocopyArgs = @(
    $Source, $Dest,
    "/E",             # copy subdirectories kể cả rỗng
    "/PURGE",         # xóa file ở đích không còn ở nguồn (trừ thư mục loại trừ)
    "/XD"             # exclude directories
) + $excludeDirs + @("/XF") + $excludeFiles + @(
    "/NFL",           # không log tên file
    "/NDL",           # không log tên dir
    "/NJH",           # không log job header
    "/NJS"            # không log job summary
)

$result = robocopy @robocopyArgs
# robocopy exit code < 8 là thành công
if ($LASTEXITCODE -ge 8) {
    Write-Host "Robocopy failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit 1
}
Write-Host "       Files copied successfully." -ForegroundColor Green

# ── 3. Tạo thư mục logs và uploads nếu chưa có ──────────────
Write-Host "[3/4] Creating runtime folders..." -ForegroundColor Cyan
@("$Dest\logs", "$Dest\logs\iisnode", "$Dest\uploads") | ForEach-Object {
    if (-not (Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
        Write-Host "       Created: $_" -ForegroundColor Gray
    }
}

# ── 4. Cài production dependencies ──────────────────────────
Write-Host "[4/4] Installing production dependencies..." -ForegroundColor Cyan
Push-Location $Dest

# Ưu tiên pnpm nếu có, fallback sang npm
$usePnpm = $null -ne (Get-Command pnpm -ErrorAction SilentlyContinue)
if ($usePnpm) {
    pnpm install --prod --frozen-lockfile
} else {
    npm install --omit=dev --legacy-peer-deps
}

Pop-Location

if ($LASTEXITCODE -ne 0) {
    Write-Host "Dependency install failed." -ForegroundColor Red
    exit 1
}

# ── Done ─────────────────────────────────────────────────────
Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  Published successfully!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. Copy/update .env at: $Dest\.env"
Write-Host "  2. Restart IIS app pool:"
Write-Host "       Restart-WebAppPool -Name '<your-app-pool>'"
Write-Host "  3. (If first deploy) set IIS Physical Path to: $Dest"
Write-Host ""
