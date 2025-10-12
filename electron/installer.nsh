; Custom NSIS script for OneRoom Health Kiosk installation
; This script registers the app properly for Windows 11 Kiosk Mode (Assigned Access)

!include "LogicLib.nsh"

!macro customInstall
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
