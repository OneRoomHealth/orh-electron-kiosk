# OneRoom Health Electron Display

Flexible display application for OneRoom Health clinical operations, built with Electron for Windows, macOS, and Linux deployment.

## Overview

This Electron application displays a static background image by default and can be remotely controlled to navigate to arbitrary URLs in a full-screen Chromium browser view. It's designed for digital signage, kiosks, and clinical display systems.

## Features

- **Static Background Display**: Shows a customizable PNG image on launch
- **Remote Navigation Control**: Switch to any URL via WebSocket or HTTP commands
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

On launch, the app displays the static background image located at:
```
electron/renderer/assets/background.png
```

To customize this image, replace `background.png` with your own 1920x1080 (or higher) PNG image before building.

### Remote Control via HTTP

The app exposes a local HTTP API on `127.0.0.1` (default port 8787).

#### Navigate to a URL

```bash
curl -X POST http://127.0.0.1:8787/navigate \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

#### Return to Splash Screen

```bash
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

**Navigate to URL:**
```json
{
  "type": "navigate",
  "url": "https://example.com"
}
```

**Return to splash:**
```json
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
| `WORKSTATION_WS_URL` | WebSocket server URL to connect to (optional) | None |
| `HTTP_CONTROL_PORT` | Port for local HTTP control server | 8787 |
| `FULLSCREEN` | Start in full-screen mode (`true`/`false`) | `false` |

## Deployment

### Standard Installation

1. Run the installer from the `release/` directory
2. Follow the installation wizard
3. Launch from the Start menu or desktop shortcut

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

### v1.0.9 (Current - Flexible Display)
- **Removed kiosk restrictions**: No more PIN, gesture blocking, or navigation allowlists
- **New state management**: Switch between splash screen and arbitrary URLs
- **Remote control**: WebSocket client and HTTP API for navigation
- **Configurable window modes**: Full-screen or maximized
- **Simplified architecture**: Clean separation of concerns

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
