# OneRoom Health Kiosk - State Management System

## Overview

The kiosk now supports a comprehensive state management system with four distinct states optimized for LED CareWall displays and provider workstations.

## Installation Types

During installation, you'll be prompted to select an installation type:

- **LED CareWall Display**: For waiting room displays showing patient information
- **Provider Workstation**: For healthcare provider computers

This selection sets the `USER_TYPE` environment variable (`ledcarewall` or `provider`).

## Available States

### 1. Screensaver
- **State Name**: `screensaver`
- **Display**: Local splash screen with background image
- **When to Use**: Idle state, no active session

### 2. Carescape
- **State Name**: `carescape`
- **URL**: `https://fe-app.oneroomhealth.app/ledwallview/care`
- **When to Use**: Pre-session display, room setup
- **Parameters**: 
  - `roomId`: Room identifier
  - `inviteId`: Optional invite identifier
  - `inviteToken`: Optional authentication token

### 3. In-Session CareWall
- **State Name**: `inSession`
- **URL**: `https://fe-app.oneroomhealth.app/ledwallview/ma`
- **When to Use**: Active appointment/session in progress
- **Parameters**:
  - `roomId`: Room identifier
  - `inviteId`: Optional invite identifier
  - `inviteToken`: Optional authentication token

### 4. Goodbye/Thank You
- **State Name**: `goodbye`
- **URL**: `https://fe-app.oneroomhealth.app/ledwallview/endAppt`
- **When to Use**: Post-appointment, patient departure
- **Parameters**: Optional custom parameters

## Configuration

### Environment Variables (.env file)

```bash
# User Type
USER_TYPE=ledcarewall  # or 'provider'

# Auto-start on system boot (default: true)
AUTO_START=true  # Set to 'false' to disable

# State URLs (customizable)
SCREENSAVER_URL=splash
CARESCAPE_URL=https://fe-app.oneroomhealth.app/ledwallview/care
IN_SESSION_URL=https://fe-app.oneroomhealth.app/ledwallview/ma
GOODBYE_URL=https://fe-app.oneroomhealth.app/ledwallview/endAppt

# Optional: HTTP Control Port
HTTP_CONTROL_PORT=8787

# Optional: WebSocket URL
WORKSTATION_WS_URL=ws://your-server:9000/ws
```

## HTTP API

The kiosk exposes a local HTTP API for state control (default port: 8787).

### Endpoints

#### 1. Set State (Generic)
```bash
POST http://localhost:8787/state
Content-Type: application/json

{
  "state": "carescape",
  "params": {
    "roomId": "room-123",
    "inviteId": "invite-456",
    "inviteToken": "token-xyz"
  }
}
```

#### 2. Screensaver
```bash
POST http://localhost:8787/screensaver
```

#### 3. Carescape
```bash
POST http://localhost:8787/carescape
Content-Type: application/json

{
  "roomId": "room-123",
  "inviteId": "invite-456"
}
```

#### 4. In-Session
```bash
POST http://localhost:8787/in-session
Content-Type: application/json

{
  "roomId": "room-123",
  "inviteId": "invite-456",
  "inviteToken": "token-xyz"
}
```

#### 5. Goodbye
```bash
POST http://localhost:8787/goodbye
```

#### 6. Get Status
```bash
POST http://localhost:8787/status

# Response:
{
  "success": true,
  "userType": "ledcarewall",
  "currentState": "inSession",
  "stateParams": {
    "roomId": "room-123"
  },
  "availableStates": ["screensaver", "carescape", "inSession", "goodbye"]
}
```

### Example Usage (PowerShell)

```powershell
# Show screensaver
Invoke-RestMethod -Uri "http://localhost:8787/screensaver" -Method POST

# Start carescape view
$body = @{
    roomId = "room-123"
    inviteId = "invite-456"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8787/carescape" -Method POST -Body $body -ContentType "application/json"

# Transition to in-session
$body = @{
    roomId = "room-123"
    inviteId = "invite-456"
    inviteToken = "token-xyz"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8787/in-session" -Method POST -Body $body -ContentType "application/json"

# Show goodbye screen
Invoke-RestMethod -Uri "http://localhost:8787/goodbye" -Method POST

# Check current status
Invoke-RestMethod -Uri "http://localhost:8787/status" -Method POST
```

### Example Usage (curl)

```bash
# Show screensaver
curl -X POST http://localhost:8787/screensaver

# Start carescape view
curl -X POST http://localhost:8787/carescape \
  -H "Content-Type: application/json" \
  -d '{"roomId": "room-123", "inviteId": "invite-456"}'

# Transition to in-session
curl -X POST http://localhost:8787/in-session \
  -H "Content-Type: application/json" \
  -d '{"roomId": "room-123", "inviteId": "invite-456", "inviteToken": "token-xyz"}'

# Show goodbye screen
curl -X POST http://localhost:8787/goodbye

# Check current status
curl -X POST http://localhost:8787/status
```

## WebSocket API

If you configure `WORKSTATION_WS_URL`, the kiosk will connect to a WebSocket server for real-time control.

### Message Format

#### Set State
```json
{
  "type": "state",
  "state": "carescape",
  "params": {
    "roomId": "room-123",
    "inviteId": "invite-456"
  }
}
```

#### State Shortcuts
```json
// Screensaver
{"type": "screensaver"}

// Carescape
{
  "type": "carescape",
  "params": {"roomId": "room-123"}
}

// In-Session
{
  "type": "inSession",
  "params": {"roomId": "room-123"}
}

// Goodbye
{"type": "goodbye"}
```

## Typical Flow Example

### LED CareWall Display Workflow

```
1. Idle State
   └─> POST /screensaver
       Display: Splash screen with branding

2. Patient Arrives
   └─> POST /carescape {"roomId": "room-5"}
       Display: Welcome screen, room info

3. Appointment Starts
   └─> POST /in-session {"roomId": "room-5", "inviteId": "appt-123"}
       Display: In-session information, provider details

4. Appointment Ends
   └─> POST /goodbye
       Display: Thank you message

5. Return to Idle
   └─> POST /screensaver
       Display: Splash screen
```

## Bug Fixes

### BrowserView Alignment Fix

The kiosk now correctly uses `getContentBounds()` instead of `getBounds()` to ensure the BrowserView aligns properly with the visible content area, preventing clipping and misalignment issues on both initial setup and window resize.

**Affected Files**: `electron/main-states.js` (lines 76, 121)

## Customization

You can customize state URLs by editing the `.env` file after installation:

```bash
# Custom URLs for your environment
CARESCAPE_URL=https://your-custom-domain.com/carescape
IN_SESSION_URL=https://your-custom-domain.com/in-session
GOODBYE_URL=https://your-custom-domain.com/goodbye
```

## Troubleshooting

### Check Current State
```bash
curl -X POST http://localhost:8787/status
```

### View Logs
Logs are printed to console. When running as a service, check:
- Windows Event Viewer
- Application logs in `%APPDATA%\OneRoom Health Kiosk\logs`

### Reset to Default
If the kiosk gets stuck, send it back to screensaver:
```bash
curl -X POST http://localhost:8787/screensaver
```

## Security Notes

- The HTTP API is bound to `127.0.0.1` (localhost only)
- No authentication is required as it's intended for local control
- For production deployments, consider firewall rules to restrict access
- WebSocket connections support remote control - secure your WebSocket server appropriately

## Support

For issues or questions:
1. Check logs for error messages
2. Verify `.env` configuration
3. Test with `/status` endpoint
4. Contact OneRoom Health support

