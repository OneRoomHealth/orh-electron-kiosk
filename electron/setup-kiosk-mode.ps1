# Windows 11 Pro Assigned Access Configuration Script
# This script configures Windows 11 to launch OneRoom Health Kiosk immediately on login
# Requires: Windows 11 Pro/Enterprise, Administrator privileges

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator', then run this script again." -ForegroundColor Yellow
    Pause
    Exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "OneRoom Health Kiosk - Setup Wizard" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the current user
$currentUser = $env:USERNAME
$domain = $env:USERDOMAIN

Write-Host "Current User: $domain\$currentUser" -ForegroundColor Green
Write-Host ""

# Find the kiosk executable
$possiblePaths = @(
    "$env:LOCALAPPDATA\Programs\OneRoom Health Kiosk\OneRoom Health Kiosk.exe",
    "$env:ProgramFiles\OneRoom Health Kiosk\OneRoom Health Kiosk.exe",
    "${env:ProgramFiles(x86)}\OneRoom Health Kiosk\OneRoom Health Kiosk.exe"
)

$kioskPath = $null
foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $kioskPath = $path
        break
    }
}

if (-not $kioskPath) {
    Write-Host "ERROR: Could not find OneRoom Health Kiosk executable!" -ForegroundColor Red
    Write-Host "Please install the application first, then run this script." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Searched in:" -ForegroundColor Yellow
    foreach ($path in $possiblePaths) {
        Write-Host "  - $path" -ForegroundColor Gray
    }
    Pause
    Exit 1
}

Write-Host "Found Kiosk Application: $kioskPath" -ForegroundColor Green
Write-Host ""

# Get the AUMID (Application User Model ID) for the app
# For packaged apps, we need to use the AUMID. For unpackaged .exe, we use the path
Write-Host "Step 1: Configuring Assigned Access..." -ForegroundColor Yellow

# Create XML configuration for Assigned Access
$xmlConfig = @"
<?xml version="1.0" encoding="utf-8" ?>
<AssignedAccessConfiguration xmlns="http://schemas.microsoft.com/AssignedAccess/2017/config">
  <Profiles>
    <Profile Id="{9A2A490F-10F6-4764-974A-43B19E722C23}">
      <AllAppsList>
        <AllowedApps>
          <App DesktopAppPath="$kioskPath" />
        </AllowedApps>
      </AllAppsList>
      <StartLayout>
        <![CDATA[<LayoutModificationTemplate xmlns:defaultlayout="http://schemas.microsoft.com/Start/2014/FullDefaultLayout" xmlns:start="http://schemas.microsoft.com/Start/2014/StartLayout" Version="1" xmlns="http://schemas.microsoft.com/Start/2014/LayoutModification">
                      <LayoutOptions StartTileGroupCellWidth="6" />
                      <DefaultLayoutOverride>
                        <StartLayoutCollection>
                          <defaultlayout:StartLayout GroupCellWidth="6" />
                        </StartLayoutCollection>
                      </DefaultLayoutOverride>
                    </LayoutModificationTemplate>
                ]]>
      </StartLayout>
      <Taskbar ShowTaskbar="false"/>
    </Profile>
  </Profiles>
  <Configs>
    <Config>
      <Account>$domain\$currentUser</Account>
      <DefaultProfile Id="{9A2A490F-10F6-4764-974A-43B19E722C23}"/>
    </Config>
  </Configs>
</AssignedAccessConfiguration>
"@

# Save the XML configuration
$configPath = "$env:TEMP\OneRoomKioskConfig.xml"
$xmlConfig | Out-File -FilePath $configPath -Encoding UTF8

Write-Host "Configuration file created: $configPath" -ForegroundColor Green

# Apply the Assigned Access configuration
try {
    Write-Host "Applying Assigned Access configuration..." -ForegroundColor Yellow
    Set-AssignedAccess -XmlPath $configPath
    Write-Host "SUCCESS: Assigned Access configured!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "ERROR: Failed to configure Assigned Access" -ForegroundColor Red
    Write-Host "Error details: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "This might be because:" -ForegroundColor Yellow
    Write-Host "  1. You're not running Windows 11 Pro/Enterprise/Education" -ForegroundColor Yellow
    Write-Host "  2. The user account is not a local account" -ForegroundColor Yellow
    Write-Host "  3. Assigned Access is not available on your Windows edition" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Continuing with alternative configuration..." -ForegroundColor Yellow
}

# Step 2: Configure Registry for immediate startup (backup method)
Write-Host "Step 2: Configuring Registry for auto-start..." -ForegroundColor Yellow

try {
    $runKeyPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
    Set-ItemProperty -Path $runKeyPath -Name "OneRoomHealthKiosk" -Value "`"$kioskPath`"" -Type String
    Write-Host "Registry configured for auto-start" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "WARNING: Could not configure registry auto-start" -ForegroundColor Yellow
    Write-Host "Error: $_" -ForegroundColor Gray
    Write-Host ""
}

# Step 3: Disable Windows UI features
Write-Host "Step 3: Disabling Windows UI features for kiosk mode..." -ForegroundColor Yellow

try {
    # Disable Edge Swipe
    if (-not (Test-Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\EdgeUI")) {
        New-Item -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\EdgeUI" -Force | Out-Null
    }
    Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\EdgeUI" -Name "AllowEdgeSwipe" -Value 0 -Type DWord
    
    # Disable Lock Screen
    if (-not (Test-Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Personalization")) {
        New-Item -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Personalization" -Force | Out-Null
    }
    Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Personalization" -Name "NoLockScreen" -Value 1 -Type DWord
    
    # Disable tablet mode prompts
    if (-not (Test-Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\ImmersiveShell")) {
        New-Item -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\ImmersiveShell" -Force | Out-Null
    }
    Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\ImmersiveShell" -Name "TabletMode" -Value 0 -Type DWord
    Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\ImmersiveShell" -Name "SignInMode" -Value 1 -Type DWord
    
    Write-Host "Windows UI features configured" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "WARNING: Some UI features could not be disabled" -ForegroundColor Yellow
    Write-Host "Error: $_" -ForegroundColor Gray
    Write-Host ""
}

# Step 4: Configure Power Settings
Write-Host "Step 4: Configuring power settings for kiosk..." -ForegroundColor Yellow

try {
    # Never turn off display
    powercfg /change monitor-timeout-ac 0
    powercfg /change monitor-timeout-dc 0
    
    # Never sleep
    powercfg /change standby-timeout-ac 0
    powercfg /change standby-timeout-dc 0
    
    # Disable hibernate
    powercfg /hibernate off
    
    Write-Host "Power settings configured" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "WARNING: Could not configure all power settings" -ForegroundColor Yellow
    Write-Host "Error: $_" -ForegroundColor Gray
    Write-Host ""
}

# Cleanup
Remove-Item -Path $configPath -Force -ErrorAction SilentlyContinue

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuration Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The kiosk has been configured with the following:" -ForegroundColor White
Write-Host "  ✓ Assigned Access (single-app kiosk mode)" -ForegroundColor Green
Write-Host "  ✓ Auto-start on login" -ForegroundColor Green
Write-Host "  ✓ Edge swipes disabled" -ForegroundColor Green
Write-Host "  ✓ Lock screen disabled" -ForegroundColor Green
Write-Host "  ✓ Power settings optimized" -ForegroundColor Green
Write-Host ""
Write-Host "Exit Methods:" -ForegroundColor Yellow
Write-Host "  1. Keyboard: Ctrl+Alt+X" -ForegroundColor White
Write-Host "  2. Touch: Tap top-right corner 5 times within 3 seconds" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT: Please RESTART your computer for all changes to take effect." -ForegroundColor Cyan
Write-Host ""
Write-Host "To disable kiosk mode, run: setup-kiosk-mode-remove.ps1" -ForegroundColor Gray
Write-Host ""

$restart = Read-Host "Would you like to restart now? (Y/N)"
if ($restart -eq "Y" -or $restart -eq "y") {
    Write-Host "Restarting in 10 seconds..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    Restart-Computer -Force
} else {
    Write-Host "Please restart your computer manually when ready." -ForegroundColor Yellow
    Pause
}

