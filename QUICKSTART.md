# Quick Start Guide

Get up and running with OneRoom Health Kiosk in minutes.

## Installation

```bash
# Clone repository (if not already done)
git clone <repository-url>
cd orh-electron-kiosk

# Install dependencies
npm install
```

## Run the App

### Basic Launch
```bash
npm start
```
- Shows screensaver/splash screen on launch
- HTTP control server on http://127.0.0.1:8787
- User type: LED CareWall Display (default)

### Full-Screen Mode
```bash
FULLSCREEN=true npm start
```

### Custom User Type
```bash
USER_TYPE=provider npm start
```

### With WebSocket Remote Control
```bash
WORKSTATION_WS_URL=ws://your-server:9000/ws npm start
```

## Control the App

### State Commands (Recommended)

**Show screensaver:**
```bash
curl -X POST http://127.0.0.1:8787/screensaver
```

**Show carescape with parameters:**
```bash
curl -X POST http://127.0.0.1:8787/carescape \
  -H "Content-Type: application/json" \
  -d '{"roomId": "room-123", "inviteId": "invite-456"}'
```

**Show in-session view:**
```bash
curl -X POST http://127.0.0.1:8787/in-session \
  -H "Content-Type: application/json" \
  -d '{"roomId": "room-123", "inviteId": "invite-456"}'
```

**Show goodbye screen:**
```bash
curl -X POST http://127.0.0.1:8787/goodbye
```

**Get current status:**
```bash
curl -X POST http://127.0.0.1:8787/status
```

### PowerShell Examples

```powershell
# Navigate through states
Invoke-RestMethod -Uri "http://localhost:8787/screensaver" -Method POST

$params = @{
    roomId = "room-123"
    inviteId = "invite-456"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8787/carescape" -Method POST -Body $params -ContentType "application/json"

Invoke-RestMethod -Uri "http://localhost:8787/in-session" -Method POST -Body $params -ContentType "application/json"

Invoke-RestMethod -Uri "http://localhost:8787/goodbye" -Method POST

# Or use the test script
pwsh test-state-api.ps1
```

## Build for Production

### Windows
```bash
npm run build:win
```
Output: `release/OneRoom Health Kiosk Setup 1.0.9.exe`

During installation, select:
- **LED CareWall Display** for waiting room displays
- **Provider Workstation** for provider computers

### macOS
```bash
npm run build:mac
```
Output: `release/OneRoom Health Kiosk-1.0.9.dmg`

### Linux
```bash
npm run build:linux
```
Output: `release/OneRoom Health Kiosk-1.0.9.AppImage` and `.deb`

## Configuration

### Environment Variables

Create a `.env` file:

```bash
# User Type
USER_TYPE=ledcarewall  # or 'provider'

# Auto-start on system boot (default: true)
AUTO_START=true  # Set to 'false' to disable

# State URLs (customize as needed)
SCREENSAVER_URL=splash
CARESCAPE_URL=https://fe-app.oneroomhealth.app/ledwallview/care
IN_SESSION_URL=https://fe-app.oneroomhealth.app/ledwallview/ma
GOODBYE_URL=https://fe-app.oneroomhealth.app/ledwallview/endAppt

# Optional: WebSocket control
WORKSTATION_WS_URL=ws://localhost:9000/ws

# Optional: HTTP port (default: 8787)
HTTP_CONTROL_PORT=8787

# Optional: Start in fullscreen
FULLSCREEN=true
```

### Customize Background Image

Replace the screensaver image:

```bash
# Replace with your own image (recommended: 1920x1080 or higher)
cp your-image.png electron/renderer/assets/background.png

# Rebuild
npm run build:win
```

## Testing the App

### 1. Launch and Verify Screensaver
```bash
npm start
```
Expected: Background image displays

### 2. Test State Transitions
```bash
# Run automated test script
pwsh test-state-api.ps1
```

Or manually:

```bash
# Show carescape
curl -X POST http://127.0.0.1:8787/carescape \
  -H "Content-Type: application/json" \
  -d '{"roomId":"test-123"}'

# Show in-session
curl -X POST http://127.0.0.1:8787/in-session \
  -H "Content-Type: application/json" \
  -d '{"roomId":"test-123"}'

# Show goodbye
curl -X POST http://127.0.0.1:8787/goodbye

# Back to screensaver
curl -X POST http://127.0.0.1:8787/screensaver
```

### 3. Check Status
```bash
curl -X POST http://127.0.0.1:8787/status
```

Expected response:
```json
{
  "success": true,
  "userType": "ledcarewall",
  "currentState": "screensaver",
  "stateParams": {},
  "availableStates": ["screensaver", "carescape", "inSession", "goodbye"]
}
```

## Typical Workflow

LED CareWall display flow:

```
1. Idle → screensaver
2. Patient arrives → carescape (with roomId)
3. Appointment starts → in-session (with roomId, inviteId)
4. Appointment ends → goodbye
5. Return to idle → screensaver
```

## Troubleshooting

### Port already in use?
```bash
# Use different port
HTTP_CONTROL_PORT=9000 npm start
```

### WebSocket won't connect?
- Verify server is running and accessible
- Check URL format: `ws://` or `wss://`
- Check firewall settings

### State not changing?
```bash
# Check current state
curl -X POST http://127.0.0.1:8787/status

# Check console for errors
npm start
```

### Background image not showing?
- Verify file exists: `ls electron/renderer/assets/background.png`
- Check browser console: View → Toggle Developer Tools (F12)

## Next Steps

- **Full documentation**: See [README.md](./README.md)
- **State management details**: See [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md)
- **Version history**: See [CHANGELOG.md](./CHANGELOG.md)
- **Migration from v1.0.8**: See [MIGRATION.md](./MIGRATION.md)

## Common Commands

```bash
# Development
npm start                    # Run app
npm run build:win           # Build Windows installer

# Testing
pwsh test-state-api.ps1     # Test all state transitions
curl -X POST http://localhost:8787/status  # Check status

# Configuration
cp .env.example .env        # Create config file
nano .env                   # Edit configuration
```

## Need Help?

1. Check [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) for detailed API documentation
2. Review console logs for error messages
3. Test with `/status` endpoint to verify configuration
4. Contact OneRoom Health support
