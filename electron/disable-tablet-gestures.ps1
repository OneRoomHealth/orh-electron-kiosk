# Disable Windows Tablet Gestures Script
# Run this as Administrator to disable system-level touch gestures on Surface tablets

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator', then run this script again." -ForegroundColor Yellow
    Pause
    Exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Disable Windows Tablet Gestures" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

try {
    # Disable Edge Swipe (swipe from sides)
    Write-Host "Disabling edge swipes..." -ForegroundColor Yellow
    if (-not (Test-Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\EdgeUI")) {
        New-Item -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\EdgeUI" -Force | Out-Null
    }
    Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\EdgeUI" -Name "AllowEdgeSwipe" -Value 0 -Type DWord
    Write-Host "✓ Edge swipes disabled" -ForegroundColor Green
    
    # Disable News and Interests (widget swipe)
    Write-Host "Disabling widgets/news panel..." -ForegroundColor Yellow
    if (-not (Test-Path "HKLM:\SOFTWARE\Policies\Microsoft\Dsh")) {
        New-Item -Path "HKLM:\SOFTWARE\Policies\Microsoft\Dsh" -Force | Out-Null
    }
    Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Dsh" -Name "AllowNewsAndInterests" -Value 0 -Type DWord
    
    # Also disable at user level
    if (-not (Test-Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Feeds")) {
        New-Item -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Feeds" -Force | Out-Null
    }
    Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Feeds" -Name "ShellFeedsTaskbarViewMode" -Value 2 -Type DWord
    Write-Host "✓ Widgets disabled" -ForegroundColor Green
    
    # Disable Task View gesture (swipe up with 3 fingers)
    Write-Host "Disabling Task View gesture..." -ForegroundColor Yellow
    if (-not (Test-Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\PrecisionTouchPad")) {
        New-Item -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\PrecisionTouchPad" -Force | Out-Null
    }
    Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\PrecisionTouchPad" -Name "AAPThreshold" -Value 0 -Type DWord
    Write-Host "✓ Task View gesture disabled" -ForegroundColor Green
    
    # Disable Tablet Mode auto-switching
    Write-Host "Disabling Tablet Mode prompts..." -ForegroundColor Yellow
    if (-not (Test-Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\ImmersiveShell")) {
        New-Item -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\ImmersiveShell" -Force | Out-Null
    }
    Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\ImmersiveShell" -Name "TabletMode" -Value 0 -Type DWord
    Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\ImmersiveShell" -Name "SignInMode" -Value 1 -Type DWord
    Write-Host "✓ Tablet Mode disabled" -ForegroundColor Green
    
    # Disable touch keyboard auto-invoke
    Write-Host "Configuring touch keyboard..." -ForegroundColor Yellow
    if (-not (Test-Path "HKCU:\Software\Microsoft\TabletTip\1.7")) {
        New-Item -Path "HKCU:\Software\Microsoft\TabletTip\1.7" -Force | Out-Null
    }
    Set-ItemProperty -Path "HKCU:\Software\Microsoft\TabletTip\1.7" -Name "EnableDesktopModeAutoInvoke" -Value 0 -Type DWord
    Write-Host "✓ Touch keyboard configured" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Success!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "All tablet gestures have been disabled." -ForegroundColor White
    Write-Host ""
    Write-Host "IMPORTANT: You must LOG OUT and LOG BACK IN" -ForegroundColor Cyan
    Write-Host "           (or restart) for changes to take effect." -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "ERROR: Failed to disable some gestures" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Yellow
    Write-Host ""
}

Pause

