; Custom NSIS script for OneRoom Health Kiosk installation
; This script registers the app properly for Windows 11 Kiosk Mode (Assigned Access)

!include "LogicLib.nsh"
!include "nsDialogs.nsh"

; Variables for configuration
Var UserTypeDialog
Var UserTypeLabel
Var UserTypeDropdown
Var UserType

; Custom page to configure user type
Page custom UserTypePageCreate UserTypePageLeave

Function UserTypePageCreate
  nsDialogs::Create 1018
  Pop $UserTypeDialog

  ${If} $UserTypeDialog == error
    Abort
  ${EndIf}

  ; Title and description
  ${NSD_CreateLabel} 0 0 100% 24u "OneRoom Health Kiosk Configuration"
  Pop $0
  
  ${NSD_CreateLabel} 0 28u 100% 24u "Please select the installation type for this device:"
  Pop $0

  ; User type selection
  ${NSD_CreateLabel} 0 56u 100% 12u "Installation Type:"
  Pop $UserTypeLabel

  ${NSD_CreateDropList} 0 72u 200u 80u ""
  Pop $UserTypeDropdown
  
  ; Add options to dropdown
  ${NSD_CB_AddString} $UserTypeDropdown "LED CareWall Display"
  ${NSD_CB_AddString} $UserTypeDropdown "Provider Workstation"
  
  ; Set default selection
  ${NSD_CB_SelectString} $UserTypeDropdown "LED CareWall Display"
  
  ; Additional description
  ${NSD_CreateLabel} 0 100u 100% 48u "LED CareWall Display: Use for waiting room displays showing patient information.$\r$\n$\r$\nProvider Workstation: Use for healthcare provider computers."
  Pop $0

  nsDialogs::Show
FunctionEnd

Function UserTypePageLeave
  ; Get selected value
  ${NSD_GetText} $UserTypeDropdown $0
  
  ${If} $0 == "LED CareWall Display"
    StrCpy $UserType "ledcarewall"
  ${ElseIf} $0 == "Provider Workstation"
    StrCpy $UserType "provider"
  ${Else}
    StrCpy $UserType "ledcarewall"
  ${EndIf}
  
  DetailPrint "Selected installation type: $UserType"
FunctionEnd

!macro customInstall
  ; Create .env file with user configuration
  DetailPrint "Creating configuration file with USER_TYPE=$UserType"
  
  FileOpen $0 "$INSTDIR\.env" w
  FileWrite $0 "# OneRoom Health Kiosk - Environment Configuration$\r$\n"
  FileWrite $0 "$\r$\n"
  FileWrite $0 "# Production URL to load in kiosk (for provider mode)$\r$\n"
  FileWrite $0 "KIOSK_URL=https://orh-frontend-container-prod.purplewave-6482a85c.westus2.azurecontainerapps.io/login$\r$\n"
  FileWrite $0 "$\r$\n"
  FileWrite $0 "# Application Settings$\r$\n"
  FileWrite $0 "NODE_ENV=production$\r$\n"
  FileWrite $0 "KIOSK_MODE=true$\r$\n"
  FileWrite $0 "AUTO_START=true  # Set to 'false' to disable auto-start on system boot$\r$\n"
  FileWrite $0 "$\r$\n"
  FileWrite $0 "# Exit Shortcut (default: Ctrl+Alt+X)$\r$\n"
  FileWrite $0 "EXIT_SHORTCUT=CommandOrControl+Alt+X$\r$\n"
  FileWrite $0 "$\r$\n"
  FileWrite $0 "# Optional: Device Identifier$\r$\n"
  FileWrite $0 "DEVICE_ID=$\r$\n"
  FileWrite $0 "$\r$\n"
  FileWrite $0 "# Optional: Logging$\r$\n"
  FileWrite $0 "LOG_LEVEL=info$\r$\n"
  FileWrite $0 "$\r$\n"
  FileWrite $0 "# User Type: 'provider' or 'ledcarewall'$\r$\n"
  FileWrite $0 "USER_TYPE=$UserType$\r$\n"
  FileWrite $0 "$\r$\n"
  FileWrite $0 "# LED CareWall Display URLs$\r$\n"
  FileWrite $0 "LED_WALL_BASE_URL=https://fe-app.oneroomhealth.app/ledwallview$\r$\n"
  FileWrite $0 "$\r$\n"
  FileWrite $0 "# State URLs (use 'splash' for local splash screen)$\r$\n"
  FileWrite $0 "SCREENSAVER_URL=splash$\r$\n"
  FileWrite $0 "CARESCAPE_URL=https://fe-app.oneroomhealth.app/ledwallview/care$\r$\n"
  FileWrite $0 "IN_SESSION_URL=https://fe-app.oneroomhealth.app/ledwallview/ma$\r$\n"
  FileWrite $0 "GOODBYE_URL=https://fe-app.oneroomhealth.app/ledwallview/endAppt$\r$\n"
  FileWrite $0 "$\r$\n"
  FileWrite $0 "# WebSocket and HTTP Control (optional)$\r$\n"
  FileWrite $0 "# WORKSTATION_WS_URL=ws://localhost:9000/ws$\r$\n"
  FileWrite $0 "# HTTP_CONTROL_PORT=8787$\r$\n"
  FileWrite $0 "# FULLSCREEN=true$\r$\n"
  FileClose $0
  
  ; Add registry entry for auto-start with proper quoting
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "ORHKiosk" '"$INSTDIR\OneRoom Health Kiosk.exe"'
  
  ; Register Application User Model ID (AUMID) for Windows Kiosk Mode
  ; This makes the app visible in Windows Settings > Accounts > Other users > Assigned access
  WriteRegStr SHCTX "Software\Classes\AppUserModelId\com.oneroomhealth.kiosk" "DisplayName" "OneRoom Health Kiosk"
  WriteRegStr SHCTX "Software\Classes\AppUserModelId\com.oneroomhealth.kiosk" "IconUri" "$INSTDIR\OneRoom Health Kiosk.exe,0"
  WriteRegDWORD SHCTX "Software\Classes\AppUserModelId\com.oneroomhealth.kiosk" "IsKioskApp" 1
  
  ; Create Start Menu shortcut with AUMID
  CreateDirectory "$SMPROGRAMS\OneRoom Health Kiosk"
  CreateShortCut "$SMPROGRAMS\OneRoom Health Kiosk\OneRoom Health Kiosk.lnk" "$INSTDIR\OneRoom Health Kiosk.exe" "" "$INSTDIR\OneRoom Health Kiosk.exe" 0
  
  ; Set the AUMID on the shortcut using a temporary VBScript
  ; This is necessary for Windows to recognize the app in kiosk settings
  FileOpen $0 "$TEMP\set_aumid.vbs" w
  FileWrite $0 'Set oShell = CreateObject("Shell.Application")$\r$\n'
  FileWrite $0 'Set oFolder = oShell.NameSpace("$SMPROGRAMS\OneRoom Health Kiosk")$\r$\n'
  FileWrite $0 'Set oItem = oFolder.ParseName("OneRoom Health Kiosk.lnk")$\r$\n'
  FileWrite $0 'Set oLink = oItem.GetLink$\r$\n'
  FileWrite $0 'oLink.SetAppUserModelID "com.oneroomhealth.kiosk"$\r$\n'
  FileWrite $0 'oLink.Save$\r$\n'
  FileClose $0
  
  ExecWait 'wscript "$TEMP\set_aumid.vbs"'
  Delete "$TEMP\set_aumid.vbs"
  
  ; Also set AUMID on desktop shortcut if it was created
  ${If} ${FileExists} "$DESKTOP\OneRoom Health Kiosk.lnk"
    FileOpen $0 "$TEMP\set_aumid_desktop.vbs" w
    FileWrite $0 'Set oShell = CreateObject("Shell.Application")$\r$\n'
    FileWrite $0 'Set oFolder = oShell.NameSpace("$DESKTOP")$\r$\n'
    FileWrite $0 'Set oItem = oFolder.ParseName("OneRoom Health Kiosk.lnk")$\r$\n'
    FileWrite $0 'Set oLink = oItem.GetLink$\r$\n'
    FileWrite $0 'oLink.SetAppUserModelID "com.oneroomhealth.kiosk"$\r$\n'
    FileWrite $0 'oLink.Save$\r$\n'
    FileClose $0
    
    ExecWait 'wscript "$TEMP\set_aumid_desktop.vbs"'
    Delete "$TEMP\set_aumid_desktop.vbs"
  ${EndIf}
!macroend

!macro customUnInstall  
  ; Remove registry entry on uninstall
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "ORHKiosk"
  
  ; Remove AUMID registration
  DeleteRegKey SHCTX "Software\Classes\AppUserModelId\com.oneroomhealth.kiosk"
  
  ; Remove Start Menu folder
  RMDir /r "$SMPROGRAMS\OneRoom Health Kiosk"
!macroend
