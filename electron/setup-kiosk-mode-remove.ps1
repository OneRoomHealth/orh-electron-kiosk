# Windows 11 Pro Assigned Access Removal Script
# This script removes OneRoom Health Kiosk assigned access configuration

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator', then run this script again." -ForegroundColor Yellow
    Pause
    Exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Remove Kiosk Mode Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Remove Assigned Access
try {
    Write-Host "Removing Assigned Access configuration..." -ForegroundColor Yellow
    Clear-AssignedAccess
    Write-Host "✓ Assigned Access removed" -ForegroundColor Green
} catch {
    Write-Host "Note: No Assigned Access configuration to remove (or already removed)" -ForegroundColor Gray
}

# Remove Registry auto-start
try {
    Write-Host "Removing registry auto-start entry..." -ForegroundColor Yellow
    $runKeyPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
    Remove-ItemProperty -Path $runKeyPath -Name "OneRoomHealthKiosk" -ErrorAction SilentlyContinue
    Write-Host "✓ Registry auto-start removed" -ForegroundColor Green
} catch {
    Write-Host "Note: Registry entry already removed or not found" -ForegroundColor Gray
}

# Re-enable Edge Swipe
try {
    Write-Host "Re-enabling Windows UI features..." -ForegroundColor Yellow
    Remove-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\EdgeUI" -Name "AllowEdgeSwipe" -ErrorAction SilentlyContinue
    Remove-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Personalization" -Name "NoLockScreen" -ErrorAction SilentlyContinue
    Write-Host "✓ Windows UI features restored" -ForegroundColor Green
} catch {
    Write-Host "Note: Some settings already restored" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Kiosk mode configuration removed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please restart your computer to return to normal Windows operation." -ForegroundColor Yellow
Write-Host ""

Pause

