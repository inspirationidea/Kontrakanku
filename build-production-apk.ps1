# ================================================================
# KontrakanKu — Production APK/AAB Builder (PowerShell)
# ================================================================
# Jalankan: .\build-production-apk.ps1
# Prerequisite: Android Studio + JDK 11+
# ================================================================

$ErrorActionPreference = "Stop"
$ROOT    = Split-Path -Parent $MyInvocation.MyCommand.Path
$FRONT   = "$ROOT\frontend"
$ANDROID = "$FRONT\android"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  KontrakanKu Production APK Builder" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Cek Android SDK
$ANDROID_HOME = $env:ANDROID_HOME
if (-not $ANDROID_HOME) {
    $ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
}
if (-not (Test-Path $ANDROID_HOME)) {
    Write-Host "ERROR: Android SDK tidak ditemukan!" -ForegroundColor Red
    Write-Host "Set ANDROID_HOME env variable ke folder Android SDK kamu." -ForegroundColor Yellow
    Write-Host "Contoh: `$env:ANDROID_HOME = 'C:\Users\Nama\AppData\Local\Android\Sdk'" -ForegroundColor Yellow
    exit 1
}
Write-Host "Android SDK: $ANDROID_HOME" -ForegroundColor Green

# Cek keystore
$KEYSTORE = "$ANDROID\app\kontrakanku-release.keystore"
if (-not (Test-Path $KEYSTORE)) {
    Write-Host "ERROR: Keystore tidak ditemukan di $KEYSTORE" -ForegroundColor Red
    Write-Host "Jalankan dulu: keytool -genkeypair ..." -ForegroundColor Yellow
    exit 1
}
Write-Host "Keystore: FOUND" -ForegroundColor Green

# Step 1: Build web assets dengan env production
Write-Host ""
Write-Host "[1/4] Building web assets (production)..." -ForegroundColor Yellow
Set-Location $FRONT
Copy-Item ".env.production" ".env.local" -Force
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Build web GAGAL!" -ForegroundColor Red; exit 1 }
Write-Host "Web assets built successfully." -ForegroundColor Green

# Step 2: Sync ke Android
Write-Host ""
Write-Host "[2/4] Syncing ke Android..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) { Write-Host "Capacitor sync GAGAL!" -ForegroundColor Red; exit 1 }
Write-Host "Sync complete." -ForegroundColor Green

# Step 3: Build Release APK
Write-Host ""
Write-Host "[3/4] Building Release APK..." -ForegroundColor Yellow
Set-Location $ANDROID
$env:ANDROID_HOME = $ANDROID_HOME

.\gradlew.bat assembleRelease --stacktrace 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build APK GAGAL! Cek error di atas." -ForegroundColor Red
    exit 1
}

# Step 4: Build Release AAB (untuk Play Store)
Write-Host ""
Write-Host "[4/4] Building Release AAB (Play Store bundle)..." -ForegroundColor Yellow
.\gradlew.bat bundleRelease 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build AAB GAGAL!" -ForegroundColor Red
    # AAB optional, APK sudah berhasil
}

# Output locations
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  BUILD BERHASIL!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$APK = "$ANDROID\app\build\outputs\apk\release\app-release.apk"
$AAB = "$ANDROID\app\build\outputs\bundle\release\app-release.aab"

if (Test-Path $APK) {
    $size = [math]::Round((Get-Item $APK).Length / 1MB, 1)
    Write-Host "APK (install langsung):" -ForegroundColor Cyan
    Write-Host "  $APK" -ForegroundColor White
    Write-Host "  Ukuran: $size MB" -ForegroundColor White
}

if (Test-Path $AAB) {
    $size = [math]::Round((Get-Item $AAB).Length / 1MB, 1)
    Write-Host ""
    Write-Host "AAB (upload ke Play Store):" -ForegroundColor Cyan
    Write-Host "  $AAB" -ForegroundColor White
    Write-Host "  Ukuran: $size MB" -ForegroundColor White
}

Write-Host ""
Write-Host "LANGKAH SELANJUTNYA (Upload ke Play Store):" -ForegroundColor Yellow
Write-Host "1. Buka https://play.google.com/console" -ForegroundColor White
Write-Host "2. Buat App baru -> Pilih 'Android App Bundle (.aab)'" -ForegroundColor White
Write-Host "3. Upload file app-release.aab" -ForegroundColor White
Write-Host "4. Isi deskripsi, screenshot, kategori" -ForegroundColor White
Write-Host "5. Submit untuk review (1-3 hari kerja)" -ForegroundColor White

Set-Location $ROOT
