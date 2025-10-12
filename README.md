# OneRoom Health Electron Kiosk

Enterprise-grade kiosk application for OneRoom Health clinical operations, built with Electron for Windows tablets and desktop deployment.

## Overview

This Electron application runs in full kiosk mode, loading the OneRoom Health web application in a secure, locked-down environment. It's specifically designed for Surface tablets and healthcare kiosks running Windows 11 Pro.

## Features

- **True Kiosk Mode**: Fullscreen, frameless window that prevents exit via gestures or standard shortcuts
- **Complete Touch Gesture Protection**: Blocks ALL edge swipes, pinch, drag, and tablet gestures
- **Immediate Launch**: Windows 11 Pro Assigned Access support for instant app launch (bypasses desktop)
- **Persistent Sessions**: Maintains OAuth login sessions across app restarts
- **Auto-start on Boot**: Automatically launches when Windows starts with high priority
- **Secure Navigation**: Restricts navigation to approved domains only
- **OAuth Support**: Handles Microsoft Azure AD authentication popups
- **Dual Exit Methods**: 
  - `Ctrl+Alt+X` keyboard shortcut
  - 5-tap sequence in top-right corner (for tablets)

## Prerequisites

- Node.js 20.x or higher
- Windows 11 Pro (recommended for kiosk deployments)
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
# Production URL
PROD_URL=https://orh-frontend-container-prod.purplewave-6482a85c.westus2.azurecontainerapps.io/login

# Environment
NODE_ENV=production
```

You can also use `KIOSK_URL` instead of `PROD_URL` if you want to override the URL specifically for kiosk mode.

## Development

To run the application in development mode:

```bash
npm start
```

This will launch the kiosk in fullscreen mode and load the configured production URL.

## Building the Installer

### Build Windows Installer (.exe)

```bash
npm run build:win
```

This creates an NSIS installer in the `release/` directory. The installer includes:
- Auto-start configuration option
- Desktop shortcut creation
- Start menu entry
- Clean uninstall support

### Build for Other Platforms

```bash
# macOS
npm run build:mac

# Linux
npm run build:linux
```

## Deployment

### Standard Installation

1. Run the `.exe` installer from the `release/` directory
2. Follow the installation wizard
3. Choose whether to enable auto-start on Windows boot
4. The application will launch automatically after installation

### Windows 11 Pro - Full Kiosk Mode (Recommended)

For immediate launch (bypassing Windows desktop) on Windows 11 Pro/Enterprise:

1. **Install the application** using the standard installer
2. **Open Windows Settings** → **Accounts** → **Other users**
3. Click **"Set up a kiosk"** (or **"Assigned access"** on some Windows versions)
4. Click **"Get started"**
5. **Create a new kiosk account** or select an existing local user account
6. In the app selection screen, select **"OneRoom Health Kiosk"** from the list
7. Click **"Close"** to complete the setup
8. **Sign out** and log in with the kiosk user account

The app will now launch immediately when the kiosk user logs in, bypassing the Windows desktop.

**What's Configured:**
- Windows Assigned Access (single-app kiosk mode)
- Immediate launch on login (no desktop shown)
- App runs in secure, locked-down mode
- Touch gesture protection and exit methods built-in

**To Remove Kiosk Mode:**
1. Log in with an administrator account
2. Go to **Settings** → **Accounts** → **Other users**
3. Find the kiosk user and click **"Remove kiosk"**
4. Delete the kiosk user account if no longer needed

### GitHub Actions Release

This project includes automated GitHub Actions workflow for releases:

1. **Commit your changes** to the main branch
2. **Create and push a version tag**:
```bash
   git tag v1.0.3
   git push origin main
   git push origin v1.0.3
   ```
3. **GitHub Actions will automatically**:
   - Build the Windows installer
   - Create a GitHub release
   - Attach the `.exe` file to the release

The workflow is defined in `.github/workflows/release-win.yml`.

## Configuration Files

### Main Kiosk File
- **`electron/main-kiosk.js`**: Production kiosk mode (current entry point)
- **`electron/main.js`**: Development mode with DevTools

### Key Configuration Files
- **`package.json`**: Application metadata and build scripts
- **`electron-builder.yml`**: Build configuration for installers
- **`electron/installer.nsh`**: Custom NSIS installer scripts
- **`electron/preload.js`**: Secure preload script for renderer process
- **`electron/autostart.js`**: Utility for managing Windows auto-start

## Usage

### Starting the Kiosk

The application will start automatically if configured during installation. You can also launch it from:
- Desktop shortcut
- Start menu: "OneRoom Health Kiosk"
- Task Manager → Run new task → "OneRoom Health Kiosk"

### Exiting the Kiosk

**For Administrators - Two Methods:**

1. **Keyboard Shortcut**: Press `Ctrl+Alt+X` simultaneously
2. **Touch Gesture (Tablet)**: Tap the top-right corner 5 times within 3 seconds
   - Visual feedback: A red circle appears showing tap count
   - Must complete all 5 taps in the corner within 3 seconds

**Note**: These are the ONLY ways to exit the application. All other exit methods (Alt+F4, closing window, swipe gestures, etc.) are completely disabled for security.

### Blocked Shortcuts

The following shortcuts are blocked to prevent accidental exit:
- `Alt+F4` - Close window
- `Ctrl+Shift+Escape` - Task Manager
- `F11` - Exit fullscreen
- `Command+Q` / `Command+W` - macOS quit/close

**Note**: `Alt+Tab` and `Ctrl+Alt+Delete` cannot be blocked as they are system-level Windows shortcuts.

## Kiosk Security Features

### Window Protection
- Non-resizable, non-movable, frameless window
- Always on top, cannot be minimized
- Blocks close attempts and restores focus
- Prevents minimize via swipe gestures

### Touch Gesture Protection
- Completely blocks ALL edge swipes (left, right, top, bottom)
- Disables pinch-to-zoom and smooth scrolling
- Disables touch drag-and-drop and touch editing
- Prevents overscroll navigation gestures
- Blocks tablet mode gesture transitions
- Aggressive focus retention (checks every 1 second)
- CSS-level touch-action blocking for bulletproof protection

### Navigation Security
- Restricts navigation to approved domains:
  - `purplewave-6482a85c.westus2.azurecontainerapps.io`
  - `login.microsoftonline.com`
  - `microsoft.com`
- Blocks popup windows except for OAuth authentication
- Disables right-click context menu

## Troubleshooting

### Kiosk Won't Exit

If `Ctrl+Alt+X` doesn't work:
1. Try `Ctrl+Alt+Delete` → Task Manager → End Task on "OneRoom Health Kiosk"
2. If Task Manager is blocked, restart the computer
3. Disable auto-start before restarting (see below)

### Disable Auto-Start

If the kiosk auto-starts and you need to disable it:
1. Press `Ctrl+Alt+Delete` to access Task Manager
2. Go to "Startup" tab
3. Find "OneRoom Health Kiosk" and disable it
4. Restart the computer

### App Not Appearing in Kiosk App List

If "OneRoom Health Kiosk" doesn't appear in Windows Settings → Accounts → Other users → Assigned access:

1. **Verify the app is installed**: Check that it's installed in one of these locations:
   - `%LOCALAPPDATA%\Programs\OneRoom Health Kiosk\`
   - `%ProgramFiles%\OneRoom Health Kiosk\`
   
2. **Check for the Start Menu shortcut**: The app should appear in Start Menu under "OneRoom Health Kiosk"

3. **Reinstall the application**: The installer automatically registers the app with Windows. Try uninstalling and reinstalling.

4. **Verify Windows edition**: Assigned Access requires Windows 11 Pro, Enterprise, or Education (not Home edition)

5. **Check registry**: Open Registry Editor and verify this key exists:
   ```
   HKEY_CURRENT_USER\Software\Classes\AppUserModelId\com.oneroomhealth.kiosk
   ```

### Application Crashes on Start

Check the application logs:
- Windows: `%APPDATA%\orh-electron-kiosk\logs\`
- macOS: `~/Library/Logs/orh-electron-kiosk/`

### OAuth Login Issues

If login fails or doesn't persist:
1. Clear the application session data:
   - Windows: Delete `%APPDATA%\orh-electron-kiosk\`
2. Restart the application
3. Complete the OAuth flow again

### Build Errors

If `npm run build:win` fails:
- Ensure Node.js 20.x is installed
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check that you have the latest version of electron-builder

## Project Structure

```
orh-electron-kiosk/
├── electron/                         # Electron main process files
│   ├── main-kiosk.js                # Production kiosk entry point
│   ├── main.js                      # Development entry point
│   ├── preload.js                   # Secure preload script
│   ├── autostart.js                 # Windows auto-start utility
│   ├── credentials.js               # (Optional) Credential management
│   ├── installer.nsh                # NSIS installer with AUMID registration
│   ├── icon.ico                     # Windows application icon
│   ├── icon.png                     # Linux application icon
│   └── entitlements.mac.plist       # macOS entitlements
├── .github/workflows/          # GitHub Actions workflows
│   └── release-win.yml         # Windows release automation
├── release/                    # Build output directory
├── .env                        # Environment configuration (not in git)
├── .env.example                # Environment template
├── package.json                # NPM package configuration
├── electron-builder.yml        # Electron builder configuration
└── README.md                   # This file
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PROD_URL` or `KIOSK_URL` | URL to load in kiosk mode | Azure Container Apps URL |
| `NODE_ENV` | Environment mode | `production` |

## Version History

### v1.0.8 (Current)
- **Windows Kiosk Mode Support**: Proper AUMID registration makes app visible in Windows Assigned Access settings
- **Simplified Setup**: Removed PowerShell scripts - kiosk mode now configured through Windows Settings UI
- **Complete gesture blocking**: Bulletproof protection against ALL touch navigation
- **5-tap corner exit**: Touch-friendly exit method for tablets with visual feedback
- **Enhanced startup priority**: Task Scheduler integration for reliable boot

### v1.0.5
- Fixed exit shortcut to use Control+Alt+X directly
- Improved startup priority with Windows Task Scheduler
- Better auto-launch reliability

### v1.0.4
- Added auto-launch dependency
- Fixed auto-start functionality
- Integrated autostart module into main process

### v1.0.3
- Enhanced tablet swipe gesture protection
- Added minimize prevention
- Improved focus retention
- Fixed exit shortcut conflicts

### v1.0.0
- Initial production release
- Basic kiosk mode functionality
- OAuth support
- Auto-start capability

## Support

For issues, bugs, or feature requests, contact the OneRoom Health IT team.

## License

Proprietary - OneRoom Health © 2025
