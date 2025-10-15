# Migration Guide: Kiosk v1.0.8 → Flexible Display v1.0.9

## Overview

This document outlines the changes made to convert the hardened kiosk application into a flexible display system with remote control capabilities.

## Key Changes

### 1. Architecture Shift

**Before (v1.0.8):**
- Single BrowserWindow in kiosk mode
- Hardcoded URL (KIOSK_URL)
- Heavy security restrictions
- PIN/gesture exit mechanisms

**After (v1.0.9):**
- BrowserWindow with BrowserView pattern
- State-based navigation (splash ↔ destinations)
- No security restrictions
- Remote control via WebSocket/HTTP

### 2. New Files Created

- `electron/main-states.js` - New main entry point with state management
- `electron/renderer/splash.html` - Static splash screen
- `electron/renderer/assets/background.png` - Default background image
- `.env.example` - Environment variable template
- `MIGRATION.md` - This file

### 3. Modified Files

- `package.json` - Updated main entry, added `ws` dependency, bumped version to 1.0.9
- `electron/preload.js` - Removed kiosk-specific APIs
- `electron-builder.yml` - Simplified file inclusion
- `README.md` - Complete rewrite with new usage instructions

### 4. Deprecated Files (Still Present)

- `electron/main-kiosk.js` - Legacy kiosk mode (no longer used)
- `electron/main.js` - Legacy dev mode (no longer used)

### 5. Environment Variables

**Removed:**
- `KIOSK_URL` - No longer used
- `PROD_URL` - No longer used

**New:**
- `WORKSTATION_WS_URL` - WebSocket server URL (optional)
- `HTTP_CONTROL_PORT` - Local HTTP API port (default: 8787)
- `FULLSCREEN` - Start in fullscreen mode (default: false)

### 6. Removed Features

All kiosk security features have been removed:

- ❌ Kiosk mode (`kiosk: true`)
- ❌ Always on top
- ❌ Frameless window
- ❌ Global shortcut blocking (Alt+F4, F11, etc.)
- ❌ Context menu blocking
- ❌ Touch gesture protection
- ❌ Edge swipe prevention
- ❌ Domain allowlists
- ❌ Navigation restrictions
- ❌ Focus retention loops
- ❌ 5-tap corner exit
- ❌ PIN protection
- ❌ Close/minimize prevention

### 7. New Features

#### State Management
- `showSplash()` - Display static background image
- `enterDestination(url)` - Navigate to any URL in BrowserView

#### Remote Control Interfaces

**HTTP API (127.0.0.1:8787):**
```bash
# Navigate
curl -X POST http://127.0.0.1:8787/navigate \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

# Splash
curl -X POST http://127.0.0.1:8787/splash
```

**WebSocket Client:**
```json
// Navigate
{"type": "navigate", "url": "https://example.com"}

// Splash
{"type": "splash"}
```

## Migration Steps

### For Development

1. **Update dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file** (optional):
   ```bash
   cp .env.example .env
   # Edit .env as needed
   ```

3. **Test the application:**
   ```bash
   npm start
   ```

4. **Test HTTP control:**
   ```bash
   curl -X POST http://127.0.0.1:8787/navigate \
     -H "Content-Type: application/json" \
     -d '{"url":"https://example.com"}'
   ```

### For Production Deployment

1. **Remove Windows Assigned Access** (if configured):
   - Settings → Accounts → Other users
   - Find kiosk user → "Remove kiosk"

2. **Rebuild the application:**
   ```bash
   npm run build:win  # or build:mac, build:linux
   ```

3. **Uninstall old version** (if installed)

4. **Install new version** from `release/` directory

5. **Configure remote control** (if needed):
   - Set environment variables in system or via launcher script
   - Or use HTTP API from local processes

### For Auto-Start

The app no longer forces auto-start. To configure:

**Windows:**
- Create shortcut in: `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup`

**macOS:**
- System Preferences → Users & Groups → Login Items

**Linux:**
- Add to systemd user service or XDG autostart

## Testing Checklist

- [ ] App starts and shows background image
- [ ] HTTP `/navigate` endpoint works
- [ ] HTTP `/splash` endpoint works
- [ ] WebSocket connection establishes (if configured)
- [ ] WebSocket navigation commands work
- [ ] Window can be resized/minimized/closed normally
- [ ] Right-click context menus work
- [ ] DevTools accessible (F12)
- [ ] Background image displays correctly
- [ ] BrowserView fills window properly
- [ ] Multiple navigation commands work sequentially

## Rollback Plan

If you need to revert to kiosk mode:

1. **Checkout v1.0.8:**
   ```bash
   git checkout v1.0.8
   ```

2. **Reinstall dependencies:**
   ```bash
   npm install
   ```

3. **Rebuild:**
   ```bash
   npm run build:win
   ```

Or install from previous release artifacts.

## Support

For questions or issues with the migration, contact the OneRoom Health IT team.
