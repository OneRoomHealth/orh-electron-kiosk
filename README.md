# OneRoom Health - Electron Kiosk Application

This is a secure, fullscreen kiosk application for OneRoom Health workstations and tablets.

## Features

- 🔒 **Fullscreen Kiosk Mode** - Runs in fullscreen without window controls
- 🔐 **Microsoft OAuth Integration** - Secure authentication with Azure AD
- 💾 **Persistent Sessions** - Automatic login when credentials are stored
- ⌨️ **Admin Exit Shortcut** - Press `Ctrl+Alt+X` to exit the application
- 🚀 **Auto-Start on Boot** - Automatically launches when the device starts
- 🌐 **Production Ready** - Points directly to production environment

## Prerequisites

- Windows 10/11, macOS 10.13+, or modern Linux
- Node.js 16+ and npm

## Installation

### 1. Clone and Install Dependencies

```bash
cd orh-electron-kiosk
npm install
```

### 2. Configure Environment Variables (Optional)

Copy the example environment file:

```bash
cp .env.example .env
```

The default configuration will work out of the box. You can customize the `.env` file if needed:

```env
KIOSK_URL=https://orh-frontend-container-prod.purplewave-6482a85c.westus2.azurecontainerapps.io/login
NODE_ENV=production
```

**Note:** Microsoft OAuth authentication is handled by the web application itself. The Electron kiosk is just a browser wrapper - no Azure credentials needed here.

### 3. Run the Application

```bash
npm start
```

## Building for Production

### Windows

```bash
npm run build:win
```

Output: `release/OneRoom Health Kiosk Setup.exe`

### macOS

```bash
npm run build:mac
```

Output: `release/OneRoom Health Kiosk.dmg`

### Linux

```bash
npm run build:linux
```

Output: `release/OneRoom Health Kiosk.AppImage`

## Setting Up Auto-Start

### Windows

After building, the installer will offer to create a startup shortcut. Alternatively:

1. Press `Win + R`, type `shell:startup`, press Enter
2. Create a shortcut to the installed application in this folder

**Or via Registry (recommended for kiosk):**

Create a file `setup-autostart.reg`:

```reg
Windows Registry Editor Version 5.00

[HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run]
"ORHKiosk"="C:\\Program Files\\OneRoom Health Kiosk\\OneRoom Health Kiosk.exe"
```

Double-click to apply.

### macOS

1. System Preferences → Users & Groups
2. Click your user → Login Items
3. Click the "+" button
4. Navigate to Applications and select "OneRoom Health Kiosk"

### Linux (Ubuntu/Debian)

Create a desktop entry:

```bash
mkdir -p ~/.config/autostart
cat > ~/.config/autostart/orh-kiosk.desktop << EOF
[Desktop Entry]
Type=Application
Name=OneRoom Health Kiosk
Exec=/path/to/OneRoom Health Kiosk.AppImage
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF
```

## Kiosk Mode Features

### Exit the Application

Press `Ctrl + Alt + X` to close the kiosk application.

This shortcut is designed for administrators and should be kept confidential.

### Session Persistence

The application automatically stores authentication tokens in the browser session. When the application restarts:

- If valid credentials exist → Auto-login
- If credentials expired → Show login page

Session data is stored securely in: `%APPDATA%/orh-electron-kiosk/` (Windows) or `~/Library/Application Support/orh-electron-kiosk/` (macOS)

### Security Features

- ✅ Context isolation enabled
- ✅ Sandbox mode active
- ✅ Node integration disabled
- ✅ Secure preload script for controlled access
- ✅ Session data encrypted at rest

## Troubleshooting

### Application won't start

1. Check that all dependencies are installed: `npm install`
2. Verify `.env` file exists and contains valid values
3. Check logs in Developer Tools (if accessible)

### Authentication fails

1. Verify Azure AD credentials in `.env`
2. Ensure redirect URI matches Azure AD configuration
3. Check that the production URL is accessible from your network
4. Clear session data: Delete `session-data/` folder in app data directory

### Can't exit the application

Press `Ctrl + Alt + X`

If this doesn't work:
- Windows: `Ctrl + Shift + Esc` to open Task Manager, end the process
- macOS: `Cmd + Option + Esc`, force quit
- Linux: `Alt + F2`, type `xkill`, click the window

### Auto-start not working

**Windows:**
- Check `shell:startup` folder for the shortcut
- Verify the target path is correct
- Check Windows Task Manager → Startup tab

**macOS:**
- System Preferences → Users & Groups → Login Items
- Ensure the app is in the list and checked

**Linux:**
- Check `~/.config/autostart/orh-kiosk.desktop` exists
- Verify the Exec path is correct
- Test manually: `~/.config/autostart/orh-kiosk.desktop`

## Development

The main application files:

- `electron/main.js` - Main process (window management, kiosk mode)
- `electron/preload.js` - Secure bridge between main and renderer
- `package.json` - Dependencies and build configuration

## Support

For issues or questions, contact OneRoom Health IT support.

## License

Proprietary - OneRoom Health