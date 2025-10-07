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
    minimizable: false,            // Prevent minimization
    closable: false,               // Prevent closing via system buttons
    movable: false,                // Prevent moving
    resizable: false,              // Prevent resizing
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      partition: 'persist:orh-session',  // Persistent session for OAuth
      webSecurity: true,
      allowRunningInsecureContent: false,
      backgroundThrottling: false,  // Prevent throttling when not focused
      enablePreferredSizeMode: true,
      spellcheck: false,            // Disable spellcheck for performance
    },
  });

  // Configure session for persistent login and performance
  const ses = session.fromPartition('persist:orh-session');
  
  // Enable session persistence
  ses.setUserAgent(ses.getUserAgent() + ' ORHKiosk/1.0');
  
  // Performance optimizations
  ses.setPreloads([path.join(__dirname, 'preload.js')]);
  
  // Enable cache for faster loading
  ses.setCache({
    size: 100 * 1024 * 1024, // 100MB cache
  });
  
  // Load production URL
  console.log('Loading production URL:', PROD_URL);
  mainWindow.loadURL(PROD_URL, {
    userAgent: ses.getUserAgent(),
  });

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

  // Prevent minimization from Windows gestures
  mainWindow.on('minimize', (event) => {
    event.preventDefault();
    mainWindow.restore();
    mainWindow.focus();
    mainWindow.setAlwaysOnTop(true);
  });

  // Prevent blur events (loss of focus)
  mainWindow.on('blur', () => {
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.focus();
        mainWindow.moveTop();
      }
    }, 100);
  });

  // Re-apply kiosk mode if somehow exited
  mainWindow.on('leave-full-screen', () => {
    mainWindow.setKiosk(true);
    mainWindow.setFullScreen(true);
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

// Performance: Disable hardware acceleration issues
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  // Optimize for performance
  app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder');
  
  createWindow();
  registerExitShortcut();
  
  // Periodically ensure window stays on top and focused
  setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (!mainWindow.isFocused()) {
        mainWindow.focus();
        mainWindow.moveTop();
      }
      if (!mainWindow.isAlwaysOnTop()) {
        mainWindow.setAlwaysOnTop(true);
      }
    }
  }, 2000);

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

// Prevent app from being suspended or minimized
app.on('browser-window-blur', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    setTimeout(() => {
      mainWindow.focus();
      mainWindow.moveTop();
      mainWindow.setAlwaysOnTop(true);
    }, 50);
  }
});

// Prevent Windows gestures from minimizing the app
if (process.platform === 'win32') {
  app.on('browser-window-created', (event, window) => {
    window.hookWindowMessage(0x0112, (wParam) => {
      // SC_MINIMIZE = 0xF020, SC_CLOSE = 0xF060
      const SC_MINIMIZE = 0xF020;
      const SC_CLOSE = 0xF060;
      const SC_RESTORE = 0xF120;
      
      if (wParam === SC_MINIMIZE || wParam === SC_CLOSE || wParam === SC_RESTORE) {
        window.setSkipTaskbar(false);
        window.focus();
        window.moveTop();
        return true; // Prevent default behavior
      }
    });
  });
}

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
