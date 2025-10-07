; Custom NSIS script for auto-start configuration

!macro customInstall
  ; Add registry entry for auto-start (current user)
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "ORHKiosk" "$INSTDIR\${PRODUCT_FILENAME}.exe"
!macroend

!macro customUnInstall  
  ; Remove registry entry on uninstall
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "ORHKiosk"
!macroend
