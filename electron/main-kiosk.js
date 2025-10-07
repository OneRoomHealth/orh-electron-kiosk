const { app, BrowserWindow, globalShortcut, session } = require('electron');
const path = require('path');
require('dotenv').config();

let mainWindow;

// Production URL from environment or default
const PROD_URL = process.env.KIOSK_URL || process.env.PROD_URL || 'https://orh-frontend-container-prod.purplewave-6482a85c.westus2.azurecontainerapps.io/login';

function createWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true,              // Fullscreen kiosk mode
    kiosk: true,                   // True kiosk mode (no escape with F11)
    frame: false,                  // No window frame
    alwaysOnTop: true,             // Always on top
    skipTaskbar: false,            // Show in taskbar for admin access
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      partition: 'persist:orh-session',  // Persistent session for OAuth
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  // Configure session for persistent login
  const ses = session.fromPartition('persist:orh-session');
  
  // Enable session persistence
  ses.setUserAgent(ses.getUserAgent() + ' ORHKiosk/1.0');
  
  // Load production URL
  console.log('Loading production URL:', PROD_URL);
  mainWindow.loadURL(PROD_URL);

  // Handle navigation to keep user in the app
  mainWindow.webContents.on('will-navigate', (event, url) => {
    // Allow navigation within the same domain
    const allowedDomain = 'purplewave-6482a85c.westus2.azurecontainerapps.io';
    if (!url.includes(allowedDomain) && !url.includes('login.microsoftonline.com')) {
      event.preventDefault();
      console.log('Navigation blocked to:', url);
    }
  });

  // Handle new window requests (OAuth popups, etc.)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Allow Microsoft OAuth popups
    if (url.includes('login.microsoftonline.com') || url.includes('microsoft.com/oauth')) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          fullscreen: false,
          kiosk: false,
          frame: true,
          width: 800,
          height: 600,
          webPreferences: {
            partition: 'persist:orh-session', // Same session
          }
        }
      };
    }
    // Block all other popups
    return { action: 'deny' };
  });

  // Prevent closing via web page
  mainWindow.on('close', (event) => {
    // Allow closing only via our keyboard shortcut
    if (!app.isQuitting) {
      event.preventDefault();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Disable right-click context menu in kiosk mode
  mainWindow.webContents.on('context-menu', (event) => {
    event.preventDefault();
  });

  // Log any console messages from the renderer (helpful for debugging)
  mainWindow.webContents.on('console-message', (event, level, message) => {
    console.log(`Renderer [${level}]:`, message);
  });
}

// Register global keyboard shortcut to exit kiosk
function registerExitShortcut() {
  const ret = globalShortcut.register('CommandOrControl+Alt+X', () => {
    console.log('Exit shortcut pressed - quitting application');
    app.isQuitting = true;
    app.quit();
  });

  if (!ret) {
    console.error('Failed to register exit shortcut');
  } else {
    console.log('Exit shortcut registered: Ctrl+Alt+X');
  }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();
  registerExitShortcut();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Cleanup on quit
app.on('will-quit', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
});

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // In production, you might want to log this to a file or remote service
});

// Prevent app from being suspended
app.on('browser-window-blur', () => {
  if (mainWindow) {
    mainWindow.focus();
  }
});

// Security: Disable dangerous features
app.on('web-contents-created', (event, contents) => {
  // Disable navigation to external sites via links
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    const allowedHosts = [
      'purplewave-6482a85c.westus2.azurecontainerapps.io',
      'login.microsoftonline.com',
      'microsoft.com'
    ];
    
    if (!allowedHosts.some(host => parsedUrl.hostname.includes(host))) {
      console.log('Blocked navigation to:', navigationUrl);
      event.preventDefault();
    }
  });

  // Disable new window creation except for OAuth
  contents.setWindowOpenHandler(({ url }) => {
    if (url.includes('login.microsoftonline.com')) {
      return { action: 'allow' };
    }
    return { action: 'deny' };
  });
});
