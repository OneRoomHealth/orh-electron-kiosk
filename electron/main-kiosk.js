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
    resizable: false,              // Prevent resizing
    movable: false,                // Prevent moving
    minimizable: false,            // Prevent minimizing
    maximizable: false,            // Prevent maximizing
    closable: false,               // Prevent closing
    show: false,                   // Don't show until ready (prevents white flash)
    backgroundColor: '#ffffff',    // Set background color to match app
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      partition: 'persist:orh-session',  // Persistent session for OAuth
      webSecurity: true,
      allowRunningInsecureContent: false,
      // Performance optimizations
      enablePreferredSizeMode: false,
      offscreen: false,
      backgroundThrottling: false,  // Prevent throttling when not focused
    },
  });

  // Configure session for persistent login and performance
  const ses = session.fromPartition('persist:orh-session');
  
  // Enable session persistence
  ses.setUserAgent(ses.getUserAgent() + ' ORHKiosk/1.0');
  
  // Performance optimizations: Enable cache and preloading
  ses.setPreloads([path.join(__dirname, 'preload.js')]);
  
  // Set cache size (100MB for better performance)
  ses.setCache({
    maxSize: 104857600, // 100MB in bytes
  });
  
  // Prevent touch gestures from affecting the window
  mainWindow.setIgnoreMouseEvents(false);
  
  // Intercept all pointer events to prevent Windows touch gestures
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // Block Windows key combinations that could exit the app
    if (input.key === 'Meta' || input.key === 'Super') {
      event.preventDefault();
    }
    // Block Alt+Tab, Alt+F4, etc.
    if (input.alt && (input.key === 'Tab' || input.key === 'F4')) {
      event.preventDefault();
    }
    // Block Ctrl+W, Ctrl+Q (close window shortcuts)
    if (input.control && (input.key === 'w' || input.key === 'q')) {
      event.preventDefault();
    }
  });
  
  // Prevent minimize/close via touch gestures
  mainWindow.on('minimize', (event) => {
    event.preventDefault();
    mainWindow.restore();
    mainWindow.focus();
  });
  
  mainWindow.on('hide', (event) => {
    event.preventDefault();
    mainWindow.show();
    mainWindow.focus();
  });
  
  // Force window to stay fullscreen and on top
  mainWindow.on('blur', () => {
    mainWindow.focus();
    mainWindow.moveTop();
  });
  
  mainWindow.on('leave-full-screen', (event) => {
    event.preventDefault();
    mainWindow.setFullScreen(true);
    mainWindow.setKiosk(true);
  });
  
  // Load production URL
  console.log('Loading production URL:', PROD_URL);
  mainWindow.loadURL(PROD_URL);
  
  // Performance: Show window only when ready to prevent flicker
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });
  
  // Inject CSS to prevent touch gestures and improve performance
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.insertCSS(`
      * {
        -ms-touch-action: none !important;
        touch-action: none !important;
        -webkit-touch-callout: none !important;
        -webkit-user-select: none !important;
        user-select: none !important;
        overscroll-behavior: none !important;
        -ms-scroll-chaining: none !important;
      }
      
      /* Allow text selection and touch for input elements */
      input, textarea, [contenteditable="true"] {
        -webkit-user-select: text !important;
        user-select: text !important;
        -ms-touch-action: manipulation !important;
        touch-action: manipulation !important;
      }
      
      /* Optimize rendering */
      body {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: optimizeLegibility;
      }
      
      /* Hardware acceleration for animations */
      * {
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
      }
    `);
    
    // Inject JavaScript to prevent touch gestures
    mainWindow.webContents.executeJavaScript(`
      // Prevent all default touch behaviors
      document.addEventListener('touchstart', function(e) {
        if (e.touches.length > 1) {
          e.preventDefault(); // Prevent pinch zoom
        }
      }, { passive: false });
      
      document.addEventListener('touchmove', function(e) {
        if (e.touches.length > 1) {
          e.preventDefault(); // Prevent pinch zoom
        }
      }, { passive: false });
      
      document.addEventListener('touchend', function(e) {
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      }, { passive: false });
      
      // Prevent double-tap zoom
      let lastTouchEnd = 0;
      document.addEventListener('touchend', function(e) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
          e.preventDefault();
        }
        lastTouchEnd = now;
      }, false);
      
      // Prevent edge swipe gestures on Windows
      document.addEventListener('MSGestureChange', function(e) {
        e.preventDefault();
      }, false);
      
      document.addEventListener('MSGestureStart', function(e) {
        e.preventDefault();
      }, false);
      
      document.addEventListener('MSGestureEnd', function(e) {
        e.preventDefault();
      }, false);
      
      // Log performance metrics
      if (window.performance && window.performance.timing) {
        window.addEventListener('load', function() {
          const perfData = window.performance.timing;
          const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
          console.log('Page Load Time: ' + pageLoadTime + 'ms');
        });
      }
    `);
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

// Performance: Enable hardware acceleration
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder');
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-native-gpu-memory-buffers');
app.commandLine.appendSwitch('enable-zero-copy');

// Security: Disable hardware acceleration in sandboxed renderers
// (balance between security and performance)
app.commandLine.appendSwitch('disable-software-rasterizer');

// Performance: Disk cache
app.commandLine.appendSwitch('disk-cache-size', '104857600'); // 100MB

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  // Enable hardware acceleration
  if (!app.isReady()) {
    return;
  }
  
  // Performance: Pre-warm the DNS cache for the production URL
  const { net } = require('electron');
  const urlObj = new URL(PROD_URL);
  net.resolveHost(urlObj.hostname).then((result) => {
    console.log('DNS pre-warmed:', result);
  }).catch((err) => {
    console.log('DNS pre-warm failed:', err);
  });
  
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
