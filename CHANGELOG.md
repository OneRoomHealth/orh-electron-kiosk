# Changelog - OneRoom Health Kiosk

## [1.0.9] - 2025-10-16

### Added
<<<<<<< HEAD
- **State Management System**: User-type-specific states
  - **LED CareWall Display** (4 states): Screensaver, Carescape, In-Session, Goodbye
  - **Provider Workstation** (2 states): Screensaver, In-Session
=======
- **State Management System**: Four pre-configured states for LED CareWall displays
  - Screensaver/Idle: Static splash screen
  - Carescape: Pre-session room display
  - In-Session: Active appointment display  
  - Goodbye: Post-appointment thank you screen
>>>>>>> bfda533d2f51f8fd631391c23e8c642a4cc77f7a
  
- **User Type Configuration**: 
  - Provider workstation mode
  - LED CareWall display mode
  - Configured during installation via custom NSIS dialog
<<<<<<< HEAD
  - Automatically selects appropriate URLs based on user type

- **Smart URL Handling**:
  - Screensaver URLs are exact (no parameters appended)
  - Other state URLs have parameters automatically appended (roomId, inviteId, inviteToken)
  - Provider URLs: `PROVIDER_SCREENSAVER_URL`, `PROVIDER_IN_SESSION_URL`
  - LED CareWall URLs: `SCREENSAVER_URL`, `CARESCAPE_URL`, `IN_SESSION_URL`, `GOODBYE_URL`
=======
>>>>>>> bfda533d2f51f8fd631391c23e8c642a4cc77f7a

- **Programmatic Auto-Start Control**:
  - Configurable via `AUTO_START` environment variable (default: true)
  - Uses `auto-launch` package for cross-platform support
  - Automatically configures on first launch
  - Can be disabled by setting `AUTO_START=false` in `.env`
  
- **Enhanced HTTP API Endpoints**:
  - `POST /state` - Generic state transition with parameters
  - `POST /screensaver` - Show screensaver
  - `POST /carescape` - Show carescape with room/invite params
  - `POST /in-session` - Show in-session view with params
  - `POST /goodbye` - Show goodbye screen
  - `POST /status` - Get current state and configuration
  
- **Enhanced WebSocket Support**:
  - State-based message types
  - Parameter passing for room/invite IDs
  - Backwards compatible with legacy commands
  
- **Installation Wizard**:
  - Custom page for user type selection
  - Automatic `.env` file generation with selected configuration
  - Clear descriptions for each installation type
  
- **Documentation**:
  - `STATE_MANAGEMENT.md` - Comprehensive state management guide
  - `test-state-api.ps1` - PowerShell test script for API
  - Updated README with state management examples

### Fixed
- **BrowserView Alignment Bug**: Changed from `getBounds()` to `getContentBounds()` 
  in `main-states.js` (lines 76, 121) to prevent misalignment and clipping issues
  caused by window frame dimensions being included in BrowserView positioning

### Changed
- Environment variables: Added `USER_TYPE`, `AUTO_START`, `SCREENSAVER_URL`, 
  `CARESCAPE_URL`, `IN_SESSION_URL`, `GOODBYE_URL`
- `.env` and `.env.example` updated with new state configuration
- `installer.nsh` now includes user type selection dialog and AUTO_START in generated config
- Main process now logs user type, auto-start status, and available states on startup

### Technical Details

**Files Modified**:
- `electron/main-states.js` - Core state management implementation
- `electron/installer.nsh` - Installation wizard with user type selection
- `.env` - Added state URLs and user type
- `.env.example` - Updated with new configuration options
- `README.md` - Updated with state management documentation

**API Behavior**:
- All HTTP endpoints return JSON responses
- State parameters (roomId, inviteId, inviteToken) are passed as query params
- URLs are built dynamically from base URLs + parameters
- `/status` endpoint provides current state inspection

**State Transitions**:
```
Screensaver → Carescape → In-Session → Goodbye → Screensaver
```

**Parameter Support**:
- `roomId`: Room identifier
- `inviteId`: Invite/appointment identifier  
- `inviteToken`: Authentication token for secure sessions

### Migration Guide

For existing installations:

1. **Update environment variables**:
   ```bash
   USER_TYPE=ledcarewall
   SCREENSAVER_URL=splash
   CARESCAPE_URL=https://fe-app.oneroomhealth.app/ledwallview/care
   IN_SESSION_URL=https://fe-app.oneroomhealth.app/ledwallview/ma
   GOODBYE_URL=https://fe-app.oneroomhealth.app/ledwallview/endAppt
   ```

2. **Update control scripts**:
   - Replace `/navigate` calls with state-specific endpoints
   - Add parameter objects for room/invite IDs
   
3. **Test state transitions**:
   ```bash
   # Run included test script
   pwsh test-state-api.ps1
   ```

### Known Issues
- None at this time

### Security Notes
- HTTP API remains bound to localhost (127.0.0.1)
- No authentication required for local API
- WebSocket connections should be secured at the server level
- User type configuration stored in plaintext `.env` file

---

## [1.0.8] - Previous Version
- Windows Kiosk Mode with AUMID registration
- Touch gesture blocking
- PIN protection and 5-tap exit
- Domain allowlist enforcement

