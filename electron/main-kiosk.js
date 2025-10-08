const { app, BrowserWindow, globalShortcut, session, ipcMain } = require('electron');
const path = require('path');
const autostart = require('./autostart');
require('dotenv').config();

// Disable hardware acceleration gestures on Windows tablets (must be before app.ready)
app.commandLine.appendSwitch('disable-pinch');
app.commandLine.appendSwitch('disable-touch-drag-drop');
app.commandLine.appendSwitch('disable-touch-editing');
app.commandLine.appendSwitch('disable-touch-feedback');
app.commandLine.appendSwitch('disable-accelerated-2d-canvas');
app.commandLine.appendSwitch('disable-smooth-scrolling');
app.commandLine.appendSwitch('overscroll-history-navigation', '0');

let mainWindow;

// Production URL from environment or default
const PROD_URL = process.env.KIOSK_URL || process.env.PROD_URL || 'https://orh-frontend-container-prod.purplewave-6482a85c.westus2.azurecontainerapps.io/login';

// 5-tap corner exit control
let cornerTaps = [];
const CORNER_SIZE = 100; // pixels
const TAP_TIMEOUT = 3000; // 3 seconds
const REQUIRED_TAPS = 5;

function createWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true,              // Fullscreen kiosk mode
    kiosk: true,                   // True kiosk mode (no escape with F11)
    frame: false,                  // No window frame
    alwaysOnTop: true,             // Always on top
    skipTaskbar: false,            // Show in taskbar for admin access
    minimizable: false,            // Disable minimize
    maximizable: false,            // Disable maximize
    closable: false,               // Disable close button
    resizable: false,              // Disable resize
    movable: false,                // Disable moving window
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

  // Prevent closing via web page or gestures
  mainWindow.on('close', (event) => {
    // Allow closing only via our keyboard shortcut
    if (!app.isQuitting) {
      event.preventDefault();
      console.log('Close attempt blocked - use Ctrl+Alt+X to exit');
      // Force window to stay visible and focused
      mainWindow.show();
      mainWindow.focus();
      mainWindow.setAlwaysOnTop(true);
    }
  });

  // Prevent minimize via gestures
  mainWindow.on('minimize', (event) => {
    event.preventDefault();
    console.log('Minimize attempt blocked');
    mainWindow.restore();
    mainWindow.focus();
  });

  // Ensure window stays maximized and kiosk
  mainWindow.on('restore', () => {
    mainWindow.setKiosk(true);
    mainWindow.focus();
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

  // Inject CSS to disable all touch gestures and scrolling
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.insertCSS(`
      * {
        -ms-touch-action: none !important;
        touch-action: none !important;
        -ms-content-zooming: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        overscroll-behavior: none !important;
        -webkit-user-drag: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      
      html, body {
        overflow: hidden !important;
        position: fixed !important;
        width: 100% !important;
        height: 100% !important;
        -webkit-overflow-scrolling: none !important;
      }
    `);

    // Inject JavaScript to handle 5-tap corner exit
    mainWindow.webContents.executeJavaScript(`
      (function() {
        let cornerTaps = [];
        const CORNER_SIZE = 100;
        const TAP_TIMEOUT = 3000;
        const REQUIRED_TAPS = 5;
        let tapIndicator = null;

        // Create visual feedback element
        function createTapIndicator() {
          if (!tapIndicator) {
            tapIndicator = document.createElement('div');
            tapIndicator.style.position = 'fixed';
            tapIndicator.style.top = '10px';
            tapIndicator.style.right = '10px';
            tapIndicator.style.width = '50px';
            tapIndicator.style.height = '50px';
            tapIndicator.style.background = 'rgba(255, 0, 0, 0.5)';
            tapIndicator.style.borderRadius = '50%';
            tapIndicator.style.zIndex = '999999';
            tapIndicator.style.display = 'none';
            tapIndicator.style.alignItems = 'center';
            tapIndicator.style.justifyContent = 'center';
            tapIndicator.style.fontSize = '24px';
            tapIndicator.style.color = 'white';
            tapIndicator.style.fontWeight = 'bold';
            tapIndicator.style.pointerEvents = 'none';
            document.body.appendChild(tapIndicator);
          }
          return tapIndicator;
        }

        function updateIndicator(count) {
          const indicator = createTapIndicator();
          if (count > 0) {
            indicator.textContent = count;
            indicator.style.display = 'flex';
            setTimeout(() => {
              if (cornerTaps.length === 0) {
                indicator.style.display = 'none';
              }
            }, 500);
          } else {
            indicator.style.display = 'none';
          }
        }

        // Prevent all default touch behaviors
        document.addEventListener('touchstart', function(e) {
          const touch = e.touches[0];
          const x = touch.clientX;
          const y = touch.clientY;
          const windowWidth = window.innerWidth;
          const windowHeight = window.innerHeight;

          // Check if touch is in top-right corner
          if (x > windowWidth - CORNER_SIZE && y < CORNER_SIZE) {
            const now = Date.now();
            
            // Clean up old taps
            cornerTaps = cornerTaps.filter(t => now - t < TAP_TIMEOUT);
            
            // Add new tap
            cornerTaps.push(now);
            console.log('Corner tap registered:', cornerTaps.length, 'of', REQUIRED_TAPS);
            
            // Update visual feedback
            updateIndicator(cornerTaps.length);
            
            // Check if we have enough taps
            if (cornerTaps.length >= REQUIRED_TAPS) {
              console.log('Exit sequence completed!');
              window.kioskExit && window.kioskExit.triggerExit();
              cornerTaps = [];
              updateIndicator(0);
            }
          } else {
            // Reset if tap outside corner
            if (cornerTaps.length > 0) {
              cornerTaps = [];
              updateIndicator(0);
            }
          }
          
          // Prevent default on all edge swipes
          if (x < 20 || x > windowWidth - 20 || y < 20 || y > windowHeight - 20) {
            e.preventDefault();
            return false;
          }
        }, { passive: false, capture: true });

        // Block all gesture events
        document.addEventListener('touchmove', function(e) {
          // Allow scrolling within the page content, but prevent edge swipes
          const touch = e.touches[0];
          const x = touch.clientX;
          const y = touch.clientY;
          const windowWidth = window.innerWidth;
          const windowHeight = window.innerHeight;
          
          if (x < 20 || x > windowWidth - 20 || y < 20 || y > windowHeight - 20) {
            e.preventDefault();
            return false;
          }
        }, { passive: false, capture: true });

        document.addEventListener('touchend', function(e) {
          // Prevent edge gesture completion
          e.stopPropagation();
        }, { capture: true });

        // Prevent mouse edge gestures
        document.addEventListener('mousedown', function(e) {
          if (e.clientX < 5 || e.clientX > window.innerWidth - 5 || 
              e.clientY < 5 || e.clientY > window.innerHeight - 5) {
            e.preventDefault();
            return false;
          }
        }, { passive: false, capture: true });

        // Prevent all scrolling at edges
        let lastY = 0;
        document.addEventListener('wheel', function(e) {
          // Allow normal scrolling but prevent overscroll
          const deltaY = e.deltaY;
          const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
          const scrollHeight = document.documentElement.scrollHeight;
          const clientHeight = document.documentElement.clientHeight;
          
          if ((scrollTop === 0 && deltaY < 0) || 
              (scrollTop + clientHeight >= scrollHeight && deltaY > 0)) {
            e.preventDefault();
            return false;
          }
        }, { passive: false });

        console.log('Gesture blocking and 5-tap exit control initialized');
      })();
    `);
  });
}

// Register global keyboard shortcut to exit kiosk
function registerExitShortcut() {
  const ret = globalShortcut.register('Control+Alt+X', () => {
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

// Handle exit trigger from 5-tap corner control
ipcMain.on('kiosk-exit-trigger', () => {
  console.log('5-tap corner exit triggered - quitting application');
  app.isQuitting = true;
  app.quit();
});

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  createWindow();
  registerExitShortcut();
  
  // Enable auto-start on system boot
  try {
    await autostart.enable();
    console.log('Auto-start configured successfully');
  } catch (error) {
    console.error('Failed to configure auto-start:', error);
  }
  
  // Block Windows key combinations that might exit kiosk
  // Note: Alt+Tab and Ctrl+Alt+Delete are system-level and cannot be blocked
  globalShortcut.register('Alt+F4', () => {
    console.log('Alt+F4 blocked');
  });
  globalShortcut.register('Control+Shift+Escape', () => {
    console.log('Task Manager shortcut blocked');
  });
  globalShortcut.register('Command+Q', () => {
    console.log('Command+Q blocked');
  });
  globalShortcut.register('Command+W', () => {
    console.log('Command+W blocked');
  });
  globalShortcut.register('F11', () => {
    console.log('F11 (exit fullscreen) blocked');
  });

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

// Prevent app from being suspended or losing focus
app.on('browser-window-blur', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus();
    mainWindow.setAlwaysOnTop(true);
  }
});

// Aggressively keep focus on tablets
setInterval(() => {
  if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isFocused()) {
    mainWindow.focus();
  }
}, 1000);

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
