#!/usr/bin/env pwsh
# Test script for OneRoom Health Kiosk /navigate API

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "OneRoom Health Kiosk - Navigate API Test" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Test 1: Check if kiosk is running
Write-Host "`n[1/5] Checking kiosk status..." -ForegroundColor Yellow
try {
    $status = Invoke-RestMethod -Uri "http://localhost:8787/status" -Method POST -ErrorAction Stop
    Write-Host "✓ Kiosk is running" -ForegroundColor Green
    Write-Host "  User Type: $($status.userType)" -ForegroundColor Gray
    Write-Host "  Current State: $($status.currentState)" -ForegroundColor Gray
    Write-Host "  Available States: $($status.availableStates -join ', ')" -ForegroundColor Gray
} catch {
    Write-Host "✗ Kiosk is not responding. Make sure the app is running!" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Navigate to carescape
Write-Host "`n[2/5] Testing navigation to Carescape view..." -ForegroundColor Yellow
$carescapeUrl = "https://fe-app.oneroomhealth.app/ledwallview/care?roomId=TEST-001&inviteId=INV-123"
$body = @{ url = $carescapeUrl } | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "http://localhost:8787/navigate" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "✓ Successfully navigated to: $carescapeUrl" -ForegroundColor Green
    Write-Host "  Waiting 5 seconds..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
} catch {
    Write-Host "✗ Navigation failed: $_" -ForegroundColor Red
}

# Test 3: Navigate to in-session
Write-Host "`n[3/5] Testing navigation to In-Session view..." -ForegroundColor Yellow
$inSessionUrl = "https://fe-app.oneroomhealth.app/ledwallview/ma?roomId=TEST-001&inviteId=INV-123&inviteToken=TOKEN-ABC"
$body = @{ url = $inSessionUrl } | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "http://localhost:8787/navigate" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "✓ Successfully navigated to: $inSessionUrl" -ForegroundColor Green
    Write-Host "  Waiting 5 seconds..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
} catch {
    Write-Host "✗ Navigation failed: $_" -ForegroundColor Red
}

# Test 4: Navigate to goodbye
Write-Host "`n[4/5] Testing navigation to Goodbye view..." -ForegroundColor Yellow
$goodbyeUrl = "https://fe-app.oneroomhealth.app/ledwallview/endAppt"
$body = @{ url = $goodbyeUrl } | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "http://localhost:8787/navigate" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "✓ Successfully navigated to: $goodbyeUrl" -ForegroundColor Green
    Write-Host "  Waiting 5 seconds..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
} catch {
    Write-Host "✗ Navigation failed: $_" -ForegroundColor Red
}

# Test 5: Return to screensaver
Write-Host "`n[5/5] Returning to screensaver..." -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "http://localhost:8787/screensaver" -Method POST -ErrorAction Stop
    Write-Host "✓ Successfully returned to screensaver" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to return to screensaver: $_" -ForegroundColor Red
}

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "✓ All tests completed!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "`nThe kiosk should now be showing the screensaver." -ForegroundColor White
Write-Host "`nFor your workstation API, use this format:" -ForegroundColor White
Write-Host @"

POST http://localhost:8787/navigate
Content-Type: application/json

{
  "url": "https://your-complete-url.com/path?with=params"
}

"@ -ForegroundColor Cyan

