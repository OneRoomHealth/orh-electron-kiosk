# OneRoom Health Electron Kiosk

State-managed display application for OneRoom Health clinical operations, built with Electron for Windows, macOS, and Linux deployment.

## Overview

This Electron application provides a four-state display system optimized for LED CareWall displays and provider workstations. It can be remotely controlled via HTTP or WebSocket to transition between states with dynamic parameters for room IDs, appointments, and sessions.

## 📚 Documentation Quick Links

- **[QUICKSTART.md](./QUICKSTART.md)** - Get started in 5 minutes
- **[STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md)** - Complete state system guide  
- **[MIGRATION.md](./MIGRATION.md)** - Upgrading from v1.0.8
- **[DOCS_INDEX.md](./DOCS_INDEX.md)** - Full documentation index

## Features

- **State Management System**: Four pre-configured states for LED CareWall displays
  - Screensaver/Idle mode
  - Carescape (pre-session)
  - In-Session CareWall
  - Goodbye/Thank you screen
- **User Type Configuration**: Install as Provider workstation or LED CareWall display
- **Remote Navigation Control**: Switch between states via WebSocket or HTTP commands
- **Dual Control Modes**:
  - WebSocket client for real-time remote control
  - Local HTTP API for programmatic control
- **Flexible Window Modes**: Full-screen or maximized window (configurable)
- **No Restrictions**: Standard browser navigation, right-click menus, and DevTools available
- **Cross-Platform**: Runs on Windows, macOS, and Linux

## Prerequisites

- Node.js 20.x or higher
- npm or yarn package manager
- Git (for cloning the repository)

## Installation

### Clone the Repository

```bash
git clone <repository-url>
cd orh-electron-kiosk
```

### Install Dependencies

```bash
npm install
```

### Configure Environment

Create a `.env` file in the root directory:

```bash
# User Type: 'provider' or 'ledcarewall'
USER_TYPE=ledcarewall

# Auto-start on system boot (default: true)
AUTO_START=true  # Set to 'false' to disable

# LED CareWall Display URLs
SCREENSAVER_URL=splash
CARESCAPE_URL=https://fe-app.oneroomhealth.app/ledwallview/care
IN_SESSION_URL=https://fe-app.oneroomhealth.app/ledwallview/ma
GOODBYE_URL=https://fe-app.oneroomhealth.app/ledwallview/endAppt

# Optional: WebSocket server URL for remote control
WORKSTATION_WS_URL=ws://localhost:9000/ws

# Optional: HTTP control server port (default: 8787)
HTTP_CONTROL_PORT=8787

# Optional: Start in full-screen mode (default: false, uses maximized)
FULLSCREEN=true
```

All environment variables are optional. Without configuration, the app will:
- Start maximized (not full-screen)
- Run local HTTP control server on port 8787
- Use default LED CareWall URLs
- Not connect to any WebSocket server

## Development

To run the application in development mode:

```bash
npm start
```

This will launch the app showing the background image. You can then control it via HTTP or WebSocket.

## Building the Application

### Build Windows Installer (.exe)

```bash
npm run build:win
```

Creates an NSIS installer in the `release/` directory.

### Build for Other Platforms

```bash
# macOS
npm run build:mac

# Linux
npm run build:linux
```

## Usage

### Default Behavior

On launch, the app displays the screensaver (static background image) located at:
```
electron/renderer/assets/background.png
```

To customize this image, replace `background.png` with your own 1920x1080 (or higher) PNG image before building.

### State Management

The kiosk supports four states designed for LED CareWall displays:

1. **Screensaver**: Idle state with background image
2. **Carescape**: Pre-session room display
3. **In-Session**: Active appointment display
4. **Goodbye**: Post-appointment thank you screen

See [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) for detailed documentation.

### Remote Control via HTTP

The app exposes a local HTTP API on `127.0.0.1` (default port 8787).

#### State Commands

```bash
# Show screensaver
curl -X POST http://127.0.0.1:8787/screensaver

# Show carescape with parameters
curl -X POST http://127.0.0.1:8787/carescape \
  -H "Content-Type: application/json" \
  -d '{"roomId": "room-123", "inviteId": "invite-456"}'

# Show in-session view
curl -X POST http://127.0.0.1:8787/in-session \
  -H "Content-Type: application/json" \
  -d '{"roomId": "room-123", "inviteId": "invite-456"}'

# Show goodbye screen
curl -X POST http://127.0.0.1:8787/goodbye

# Get current status
curl -X POST http://127.0.0.1:8787/status
```

#### Legacy Commands

```bash
# Navigate to arbitrary URL
curl -X POST http://127.0.0.1:8787/navigate \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

# Return to splash screen
curl -X POST http://127.0.0.1:8787/splash
```

#### Change HTTP Port

Set the `HTTP_CONTROL_PORT` environment variable:

```bash
HTTP_CONTROL_PORT=9000 npm start
```

### Remote Control via WebSocket

If `WORKSTATION_WS_URL` is set, the app connects as a WebSocket client.

#### WebSocket Message Format

**State Commands:**
```json
// Screensaver
{"type": "screensaver"}

// Carescape
{
  "type": "carescape",
  "params": {"roomId": "room-123", "inviteId": "invite-456"}
}

// In-Session
{
  "type": "inSession",
  "params": {"roomId": "room-123", "inviteId": "invite-456"}
}

// Goodbye
{"type": "goodbye"}

// Generic state command
{
  "type": "state",
  "state": "carescape",
  "params": {"roomId": "room-123"}
}
```

**Legacy Commands:**
```json
// Navigate to URL
{
  "type": "navigate",
  "url": "https://example.com"
}

// Return to splash
{
  "type": "splash"
}
```

#### Example WebSocket Server Setup

```bash
# Set environment variable
export WORKSTATION_WS_URL=ws://localhost:9000/ws

# Start the app
npm start
```

The app will connect to the WebSocket server and listen for commands. If disconnected, it automatically reconnects with exponential backoff.

### Window Modes

#### Full-Screen Mode

```bash
FULLSCREEN=true npm start
```

Full-screen can be exited using standard OS controls (F11, Esc on some systems).

#### Maximized Mode (Default)

```bash
npm start
```

The window starts maximized but can be resized, minimized, or closed normally.

## Configuration Files

### Main Application Files

- **`electron/main-states.js`**: Main process entry point with state management
- **`electron/preload.js`**: Minimal preload script for renderer processes
- **`electron/renderer/splash.html`**: Static background display page
- **`electron/renderer/assets/background.png`**: Default background image

### Build Configuration

- **`package.json`**: Application metadata and build scripts
- **`electron-builder.yml`**: Electron Builder configuration
- **`.env`**: Environment variables (not tracked in git)

## API Reference

### HTTP API

**Base URL:** `http://127.0.0.1:8787` (or custom port)

#### POST /navigate

Navigate to a URL in a BrowserView.

**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://example.com"
}
```

#### POST /splash

Return to the splash screen.

**Response:**
```json
{
  "success": true
}
```

### WebSocket Protocol

Connect to the app by setting `WORKSTATION_WS_URL` to point to your WebSocket server. The app acts as a client.

**Message Types:**

1. **Navigate**
   ```json
   {
     "type": "navigate",
     "url": "https://example.com"
   }
   ```

2. **Splash**
   ```json
   {
     "type": "splash"
   }
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `USER_TYPE` | Installation type: `provider` or `ledcarewall` | `ledcarewall` |
| `AUTO_START` | Auto-start on system boot (`true`/`false`) | `true` |
| `SCREENSAVER_URL` | Screensaver state URL (use `splash` for local) | `splash` |
| `CARESCAPE_URL` | Carescape state URL | `https://fe-app.oneroomhealth.app/ledwallview/care` |
| `IN_SESSION_URL` | In-session state URL | `https://fe-app.oneroomhealth.app/ledwallview/ma` |
| `GOODBYE_URL` | Goodbye state URL | `https://fe-app.oneroomhealth.app/ledwallview/endAppt` |
| `WORKSTATION_WS_URL` | WebSocket server URL to connect to (optional) | None |
| `HTTP_CONTROL_PORT` | Port for local HTTP control server | 8787 |
| `FULLSCREEN` | Start in full-screen mode (`true`/`false`) | `false` |

## Deployment

### Standard Installation

1. Run the installer from the `release/` directory
2. Follow the installation wizard
3. **Select installation type** (LED CareWall Display or Provider Workstation)
4. Complete installation
5. Launch from the Start menu or desktop shortcut

The installer will automatically configure the appropriate user type based on your selection.

### Auto-Start Configuration

To run the app on system boot, use your OS's auto-start mechanism:

**Windows:**
- Add a shortcut to: `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup`

**macOS:**
- System Preferences → Users & Groups → Login Items

**Linux:**
- Add to systemd user services or desktop autostart

## Customization

### Change Background Image

Replace `electron/renderer/assets/background.png` with your own image before building. Recommended resolution: 1920x1080 or higher.

### Modify Splash Screen

Edit `electron/renderer/splash.html` to customize the appearance. The current implementation uses a full-bleed centered image.

## Troubleshooting

### App Won't Start

Check that Node.js 20.x or higher is installed:
```bash
node --version
```

### HTTP Control Not Working

Verify the port isn't already in use:
```bash
# Linux/macOS
lsof -i :8787

# Windows
netstat -ano | findstr :8787
```

Try changing the port:
```bash
HTTP_CONTROL_PORT=9000 npm start
```

### WebSocket Won't Connect

Ensure the WebSocket server is running and accessible:
```bash
# Test with a WebSocket client
wscat -c ws://localhost:9000/ws
```

Check the app console for connection errors.

### Background Image Not Showing

Verify the image exists:
```bash
ls electron/renderer/assets/background.png
```

Check the browser console (DevTools) for loading errors.

### Build Errors

Clear dependencies and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build:win
```

## Project Structure

```
orh-electron-kiosk/
├── electron/
│   ├── main-states.js                # Main process (new entry point)
│   ├── main-kiosk.js                 # Legacy kiosk mode (deprecated)
│   ├── main.js                       # Legacy dev mode (deprecated)
│   ├── preload.js                    # Preload script
│   ├── renderer/
│   │   ├── splash.html               # Splash screen HTML
│   │   └── assets/
│   │       └── background.png        # Background image
│   ├── autostart.js                  # Auto-start utility
│   ├── credentials.js                # Credential management (legacy)
│   ├── installer.nsh                 # NSIS installer scripts
│   ├── icon.ico                      # Windows icon
│   ├── icon.png                      # Linux icon
│   └── entitlements.mac.plist        # macOS entitlements
├── .github/workflows/
│   └── release-win.yml               # GitHub Actions release workflow
├── release/                          # Build output directory
├── .env                              # Environment configuration (not in git)
├── package.json                      # NPM package configuration
├── electron-builder.yml              # Electron Builder configuration
└── README.md                         # This file
```

## Security Considerations

This application does **not** include kiosk security features:

- ❌ No domain allowlists
- ❌ No navigation restrictions
- ❌ No context menu blocking
- ❌ No keyboard shortcut blocking
- ❌ No forced focus retention
- ❌ No PIN protection

For kiosk deployments requiring security, use the previous kiosk version (v1.0.8) or implement custom restrictions.

## Version History

### v1.0.9 (Current - State Management)
- **State management system**: Four pre-configured states for LED CareWall displays
- **User type configuration**: Provider vs LED CareWall installation types
- **Enhanced HTTP API**: State-based endpoints with parameter support
- **WebSocket state control**: Real-time state transitions
- **Bug fix**: BrowserView alignment corrected (getContentBounds vs getBounds)
- **Installation wizard**: User type selection during installation
- **Configurable URLs**: All state URLs customizable via environment variables

### v1.0.8 (Legacy Kiosk)
- Windows Kiosk Mode support with AUMID registration
- Complete gesture blocking and touch protection
- 5-tap corner exit and PIN protection
- Domain allowlist enforcement

## Migration from Kiosk Mode

If migrating from v1.0.8 kiosk mode:

1. **Remove Windows Assigned Access** if configured
2. **Update environment variables**: Remove `KIOSK_URL`, add new vars as needed
3. **Rebuild the application**: `npm install && npm run build:win`
4. **Test control interfaces**: Verify HTTP and WebSocket control work

## Support

For issues, bugs, or feature requests, contact the OneRoom Health IT team.

## License

Proprietary - OneRoom Health © 2025
