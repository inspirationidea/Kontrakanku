#!/bin/bash
# ============================================
# KontrakanKu — Build Android APK Script
# ============================================
# Prerequisites:
#   - Android Studio installed
#   - JAVA_HOME set (JDK 17+)
#   - ANDROID_HOME set (Android SDK)
#
# Usage:
#   bash build-android.sh [dev|prod]
#   dev  = build dengan IP lokal untuk testing di HP via WiFi
#   prod = build dengan URL production backend

set -e

MODE=${1:-dev}
FRONTEND_DIR="$(dirname "$0")/frontend"

echo "================================================"
echo "  KontrakanKu Android Builder — Mode: $MODE"
echo "================================================"

cd "$FRONTEND_DIR"

if [ "$MODE" = "prod" ]; then
  echo "[1/4] Building untuk PRODUCTION..."
  echo "⚠️  Pastikan VITE_API_URL di .env.production sudah diset ke URL backend production!"
  cp .env.production .env.local 2>/dev/null || echo "Tidak ada .env.production, pakai .env"
else
  echo "[1/4] Building untuk DEVELOPMENT (IP Lokal)..."
  # Deteksi IP lokal otomatis
  LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || ipconfig | grep -m1 "IPv4" | awk '{print $NF}')
  echo "     IP Lokal terdeteksi: $LOCAL_IP"
  echo "VITE_API_URL=http://$LOCAL_IP:4000/api" > .env.local
  echo "VITE_BACKEND_URL=http://$LOCAL_IP:4000" >> .env.local
  echo "     API URL diset ke: http://$LOCAL_IP:4000/api"
fi

echo "[2/4] Membangun web assets..."
npm run build

echo "[3/4] Menyinkronkan ke Android..."
npx cap sync android

echo "[4/4] Selesai! Langkah selanjutnya:"
echo ""
echo "  Opsi A — Build APK via Android Studio:"
echo "    npx cap open android"
echo "    → Build > Build Bundle(s) / APK(s) > Build APK(s)"
echo "    → APK ada di: android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "  Opsi B — Run langsung di HP (USB Debugging aktif):"
echo "    npx cap run android"
echo ""
echo "  Opsi C — Build APK via command line (perlu ANDROID_HOME):"
echo "    cd android && ./gradlew assembleDebug"
echo "    APK: android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "💡 Tips: Pastikan HP dan komputer di WiFi yang sama untuk testing dev!"
