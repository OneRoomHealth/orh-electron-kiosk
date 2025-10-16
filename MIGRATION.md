# Migration Guide: v1.0.8 → v1.0.9 (State Management)

## Overview

Version 1.0.9 transforms the kiosk application into a state-managed display system optimized for LED CareWall displays and provider workstations.

## What's New in v1.0.9

### State Management System
Four pre-configured states for clinical workflows:
- **Screensaver**: Idle display with background image
- **Carescape**: Pre-session room display
- **In-Session**: Active appointment display
- **Goodbye**: Post-appointment thank you screen

### User Type Configuration
- **LED CareWall Display**: For waiting room displays
- **Provider Workstation**: For healthcare provider computers
- Selected during installation, stored in `.env` file

### Enhanced Control APIs
- State-based HTTP endpoints with parameter support
- WebSocket state transitions
- Status inspection endpoint
- Backwards compatible with v1.0.8 commands

### Bug Fixes
- BrowserView alignment corrected (getContentBounds vs getBounds)

## Key Changes

### Architecture

**Before (v1.0.8):**
```
Single BrowserWindow → Hardcoded URL → Kiosk restrictions
```

**After (v1.0.9):**
```
BrowserWindow + State Manager → Dynamic URLs → Flexible control
    ↓
4 States: screensaver → carescape → inSession → goodbye
    ↓
Parameters: roomId, inviteId, inviteToken
```

### Environment Variables

**Removed:**
- `KIOSK_URL` - No longer used

**Added:**
```bash
USER_TYPE=ledcarewall              # or 'provider'
SCREENSAVER_URL=splash
CARESCAPE_URL=https://fe-app.oneroomhealth.app/ledwallview/care
IN_SESSION_URL=https://fe-app.oneroomhealth.app/ledwallview/ma
GOODBYE_URL=https://fe-app.oneroomhealth.app/ledwallview/endAppt
```

### API Endpoints

**New in v1.0.9:**
```bash
POST /state         # Generic state transition
POST /screensaver   # Show screensaver
POST /carescape     # Show carescape with params
POST /in-session    # Show in-session with params
POST /goodbye       # Show goodbye screen
POST /status        # Get current state info
```

**Still Supported (Legacy):**
```bash
POST /navigate      # Navigate to arbitrary URL
POST /splash        # Return to splash
```

### WebSocket Messages

**New in v1.0.9:**
```json
{"type": "state", "state": "carescape", "params": {"roomId": "123"}}
{"type": "screensaver"}
{"type": "carescape", "params": {...}}
{"type": "inSession", "params": {...}}
{"type": "goodbye"}
```

**Still Supported (Legacy):**
```json
{"type": "navigate", "url": "https://..."}
{"type": "splash"}
```

## Migration Steps

### For Development Environments

1. **Update dependencies:**
   ```bash
   git pull
   npm install
   ```

2. **Update `.env` file:**
   ```bash
   # Add new variables
   USER_TYPE=ledcarewall
   SCREENSAVER_URL=splash
   CARESCAPE_URL=https://fe-app.oneroomhealth.app/ledwallview/care
   IN_SESSION_URL=https://fe-app.oneroomhealth.app/ledwallview/ma
   GOODBYE_URL=https://fe-app.oneroomhealth.app/ledwallview/endAppt
   
   # Remove old variable
   # KIOSK_URL=... (no longer needed)
   ```

3. **Test state transitions:**
   ```bash
   npm start
   
   # In another terminal
   pwsh test-state-api.ps1
   ```

4. **Update control scripts:**
   
   **Old way (still works):**
   ```bash
   curl -X POST http://localhost:8787/navigate \
     -d '{"url":"https://example.com"}'
   ```
   
   **New way (recommended):**
   ```bash
   curl -X POST http://localhost:8787/carescape \
     -d '{"roomId":"room-123","inviteId":"invite-456"}'
   ```

### For Production Deployments

1. **Backup current installation** (if needed for rollback)

2. **Uninstall old version:**
   - Windows: Settings → Apps → OneRoom Health Kiosk → Uninstall
   - Or use Control Panel

3. **Install new version:**
   ```bash
   # Build new installer
   npm run build:win
   
   # Run installer from release/ directory
   # Select appropriate user type during installation
   ```

4. **Configure environment** (if using custom URLs):
   - Edit `.env` file in installation directory
   - Typically: `C:\Program Files\OneRoom Health Kiosk\.env`

5. **Test state transitions:**
   ```powershell
   # Check status
   Invoke-RestMethod -Uri "http://localhost:8787/status" -Method POST
   
   # Test state changes
   pwsh test-state-api.ps1
   ```

### For Control Systems

If you have external systems controlling the kiosk:

**Option 1: Update to State-Based Control (Recommended)**

```javascript
// Old way
await fetch('http://localhost:8787/navigate', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({url: 'https://...'})
});

// New way
await fetch('http://localhost:8787/carescape', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    roomId: 'room-123',
    inviteId: 'invite-456'
  })
});
```

**Option 2: Keep Legacy Commands (No Changes Required)**

Legacy `/navigate` and `/splash` endpoints continue to work.

### WebSocket Control Migration

**Old messages (still work):**
```json
{"type": "navigate", "url": "https://example.com"}
{"type": "splash"}
```

**New messages (recommended):**
```json
// Set state with parameters
{
  "type": "carescape",
  "params": {
    "roomId": "room-123",
    "inviteId": "invite-456"
  }
}

// Or use generic state command
{
  "type": "state",
  "state": "inSession",
  "params": {
    "roomId": "room-123",
    "inviteId": "invite-456",
    "inviteToken": "token-xyz"
  }
}
```

## Testing Checklist

After migration, verify:

- [ ] App starts and shows screensaver
- [ ] `/status` endpoint returns current state
- [ ] State transitions work:
  - [ ] screensaver → carescape
  - [ ] carescape → in-session
  - [ ] in-session → goodbye
  - [ ] goodbye → screensaver
- [ ] Parameters appear in URLs (check browser address bar)
- [ ] WebSocket commands work (if configured)
- [ ] Legacy `/navigate` and `/splash` still work
- [ ] Window resizes correctly (BrowserView aligned)
- [ ] User type is correct (check `/status` response)

## Rollback Plan

If you need to revert to v1.0.8:

### Option 1: Reinstall Previous Version
1. Uninstall v1.0.9
2. Install v1.0.8 from archived installer
3. Restore previous `.env` configuration

### Option 2: Git Checkout
```bash
git checkout v1.0.8
npm install
npm run build:win
```

## Configuration Examples

### LED CareWall Display (Default)
```bash
USER_TYPE=ledcarewall
SCREENSAVER_URL=splash
CARESCAPE_URL=https://fe-app.oneroomhealth.app/ledwallview/care
IN_SESSION_URL=https://fe-app.oneroomhealth.app/ledwallview/ma
GOODBYE_URL=https://fe-app.oneroomhealth.app/ledwallview/endAppt
HTTP_CONTROL_PORT=8787
```

### Provider Workstation
```bash
USER_TYPE=provider
SCREENSAVER_URL=splash
CARESCAPE_URL=https://fe-app.oneroomhealth.app/ledwallview/care
IN_SESSION_URL=https://fe-app.oneroomhealth.app/ledwallview/ma
GOODBYE_URL=https://fe-app.oneroomhealth.app/ledwallview/endAppt
HTTP_CONTROL_PORT=8787
```

### Custom URLs
```bash
USER_TYPE=ledcarewall
SCREENSAVER_URL=https://custom-domain.com/screensaver
CARESCAPE_URL=https://custom-domain.com/carescape
IN_SESSION_URL=https://custom-domain.com/session
GOODBYE_URL=https://custom-domain.com/goodbye
```

## Troubleshooting

### State not changing
```bash
# Check current state
curl -X POST http://localhost:8787/status

# Verify URL configuration in .env
cat .env

# Check console logs for errors
npm start
```

### Parameters not appearing in URL
- Verify JSON syntax in request body
- Use correct parameter names: `roomId`, `inviteId`, `inviteToken`
- Check `/status` endpoint to see current `stateParams`

### BrowserView misaligned
- This bug was fixed in v1.0.9
- If issue persists, verify you're running v1.0.9:
  ```bash
  curl -X POST http://localhost:8787/status
  # Should show version in logs
  ```

### Installation wizard doesn't show user type selection
- Verify you're using v1.0.9 installer
- Check installer logs in temp directory
- Manually edit `.env` file after installation if needed

## Breaking Changes

### None for Basic Usage
All legacy commands still work, so existing integrations continue functioning.

### For Advanced Integrations
If you were directly manipulating the kiosk URL:
- Use state-based commands instead
- Or continue using `/navigate` with full URLs

## Benefits of Upgrading

1. **Cleaner Control**: State names instead of full URLs
2. **Parameter Handling**: Built-in query parameter support
3. **Status Inspection**: Know current state at any time
4. **Bug Fixes**: BrowserView alignment corrected
5. **Better Organization**: User type configuration
6. **Future-Proof**: Extensible state system

## Support

- **Documentation**: See [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md)
- **Quick Start**: See [QUICKSTART.md](./QUICKSTART.md)
- **API Reference**: See [README.md](./README.md)
- **Version History**: See [CHANGELOG.md](./CHANGELOG.md)
- **Issues**: Contact OneRoom Health IT team

## Version Comparison

| Feature | v1.0.8 | v1.0.9 |
|---------|--------|--------|
| State Management | ❌ | ✅ 4 states |
| User Types | ❌ | ✅ Provider/LEDCareWall |
| Parameter Passing | ❌ | ✅ roomId, inviteId, etc |
| Status Endpoint | ❌ | ✅ `/status` |
| BrowserView Alignment | ⚠️ Bug | ✅ Fixed |
| HTTP API | ✅ Basic | ✅ Enhanced |
| WebSocket | ✅ Basic | ✅ Enhanced |
| Legacy Support | N/A | ✅ Backwards compatible |

---

**Migration Date**: October 16, 2025  
**Target Version**: 1.0.9  
**Previous Version**: 1.0.8
