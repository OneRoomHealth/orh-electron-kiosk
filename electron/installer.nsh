; Custom NSIS script for auto-start configuration

!macro customInstall
  ; Add registry entry for auto-start with proper quoting
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "ORHKiosk" '"$INSTDIR\OneRoom Health Kiosk.exe"'
!macroend

!macro customUnInstall  
  ; Remove registry entry on uninstall
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "ORHKiosk"
!macroend
