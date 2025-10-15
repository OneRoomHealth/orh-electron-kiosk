# Quick Start Guide

## Installation

```bash
# Install dependencies
npm install
```

## Run the App

### Basic Launch (Local Control Only)
```bash
npm start
```
- Shows background image on launch
- HTTP control server on http://127.0.0.1:8787

### Full-Screen Mode
```bash
FULLSCREEN=true npm start
```

### With WebSocket Remote Control
```bash
WORKSTATION_WS_URL=ws://your-server:9000/ws npm start
```

### Custom HTTP Port
```bash
HTTP_CONTROL_PORT=9000 npm start
```

## Control the App

### HTTP API (Local)

**Navigate to a URL:**
```bash
curl -X POST http://127.0.0.1:8787/navigate \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.google.com"}'
```

**Return to splash screen:**
```bash
curl -X POST http://127.0.0.1:8787/splash
```

### WebSocket (Remote)

Send JSON messages to control the app:

**Navigate:**
```json
{"type": "navigate", "url": "https://www.google.com"}
```

**Splash:**
```json
{"type": "splash"}
```

## Build for Production

### Windows
```bash
npm run build:win
```
Installer: `release/OneRoom Health Kiosk Setup 1.0.9.exe`

### macOS
```bash
npm run build:mac
```
Installer: `release/OneRoom Health Kiosk-1.0.9.dmg`

### Linux
```bash
npm run build:linux
```
Packages: `release/OneRoom Health Kiosk-1.0.9.AppImage` and `.deb`

## Customize Background

Replace the default background image:

```bash
# Replace with your own image (recommended: 1920x1080 or higher)
cp your-image.png electron/renderer/assets/background.png

# Rebuild
npm run build:win  # or build:mac, build:linux
```

## Environment Variables

Create a `.env` file:

```bash
# Optional: WebSocket server for remote control
WORKSTATION_WS_URL=ws://localhost:9000/ws

# Optional: HTTP server port (default: 8787)
HTTP_CONTROL_PORT=8787

# Optional: Start in fullscreen (default: false)
FULLSCREEN=true
```

## Testing

### Test Sequence

1. **Launch app**
   ```bash
   npm start
   ```
   Expected: Blue background with "OneRoom Health" text

2. **Navigate to URL**
   ```bash
   curl -X POST http://127.0.0.1:8787/navigate \
     -H "Content-Type: application/json" \
     -d '{"url":"https://www.google.com"}'
   ```
   Expected: Google homepage loads in full window

3. **Return to splash**
   ```bash
   curl -X POST http://127.0.0.1:8787/splash
   ```
   Expected: Back to blue background

4. **Exit app**
   - Click X button or press Alt+F4 (standard window controls work)

## Troubleshooting

### Port already in use?
```bash
# Use a different port
HTTP_CONTROL_PORT=9000 npm start
```

### WebSocket won't connect?
- Verify server is running and accessible
- Check URL format: `ws://` or `wss://` protocol required
- Check firewall settings

### Background image not showing?
- Verify file exists: `ls electron/renderer/assets/background.png`
- Check console for errors: View → Toggle Developer Tools

### Need help?
See full documentation in `README.md`
