const { app, BrowserWindow, BrowserView } = require('electron');
const path = require('path');
const http = require('http');
require('dotenv').config();

// Set Application User Model ID for Windows
if (process.platform === 'win32') {
  app.setAppUserModelId('com.oneroomhealth.kiosk');
}

let mainWindow;
let currentView = null;
let ws = null;
let reconnectTimeout = null;
let reconnectDelay = 1000; // Start with 1 second

// Configuration from environment
const WORKSTATION_WS_URL = process.env.WORKSTATION_WS_URL;
const HTTP_CONTROL_PORT = parseInt(process.env.HTTP_CONTROL_PORT || '8787', 10);
const FULLSCREEN = process.env.FULLSCREEN === 'true';

/**
 * Show the static splash background image
 */
function showSplash() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    console.log('Cannot show splash: window does not exist');
    return;
  }

  console.info('Switching to splash screen');

  // Remove any existing BrowserView
  if (currentView) {
    try {
      mainWindow.removeBrowserView(currentView);
      currentView.webContents.destroy();
    } catch (err) {
      console.error('Error removing BrowserView:', err);
    }
    currentView = null;
  }

  // Load the splash HTML in the main window
  const splashPath = path.join(__dirname, 'renderer', 'splash.html');
  mainWindow.loadFile(splashPath);
}

/**
 * Navigate to a destination URL in a BrowserView
 * @param {string} url - The destination URL
 */
function enterDestination(url) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    console.log('Cannot enter destination: window does not exist');
    return;
  }

  console.info('Navigating to destination:', url);

  // Create a new BrowserView if needed
  if (!currentView || currentView.webContents.isDestroyed()) {
    currentView = new BrowserView({
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      }
    });

    mainWindow.addBrowserView(currentView);
  }

  // Set bounds to fill the window
  const bounds = mainWindow.getBounds();
  currentView.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
  currentView.setAutoResize({ width: true, height: true });

  // Load the URL
  currentView.webContents.loadURL(url);

  // Clear the main window content (show blank while BrowserView loads)
  mainWindow.loadURL('about:blank');
}

/**
 * Create the main window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    kiosk: false,
    alwaysOnTop: false,
    frame: true,
    fullscreen: FULLSCREEN,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Maximize if not fullscreen
  if (!FULLSCREEN) {
    mainWindow.maximize();
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load splash on startup
  showSplash();

  // Handle window resize to update BrowserView bounds
  mainWindow.on('resize', () => {
    if (currentView && !currentView.webContents.isDestroyed()) {
      const bounds = mainWindow.getBounds();
      currentView.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (currentView) {
      currentView = null;
    }
  });
}

/**
 * Connect to workstation WebSocket server
 */
function connectWebSocket() {
  if (!WORKSTATION_WS_URL) {
    return;
  }

  try {
    const WebSocket = require('ws');
    
    console.info('Connecting to WebSocket:', WORKSTATION_WS_URL);
    ws = new WebSocket(WORKSTATION_WS_URL);

    ws.on('open', () => {
      console.info('WebSocket connected');
      reconnectDelay = 1000; // Reset reconnect delay on successful connection
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.info('Received WebSocket message:', message);

        if (message.type === 'navigate' && message.url) {
          enterDestination(message.url);
        } else if (message.type === 'splash') {
          showSplash();
        } else {
          console.warn('Unknown message type:', message.type);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err.message);
    });

    ws.on('close', () => {
      console.info('WebSocket disconnected. Reconnecting in', reconnectDelay, 'ms');
      ws = null;
      
      // Exponential backoff reconnection (max 30 seconds)
      reconnectTimeout = setTimeout(() => {
        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
        connectWebSocket();
      }, reconnectDelay);
    });
  } catch (err) {
    console.error('Error creating WebSocket:', err.message);
    console.info('Install "ws" package with: npm install ws');
  }
}

/**
 * Start local HTTP control server
 */
function startHttpControlServer() {
  const server = http.createServer((req, res) => {
    // Set CORS headers for local access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Only accept POST requests
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    // Parse request body
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        if (req.url === '/navigate') {
          const data = JSON.parse(body);
          if (!data.url) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing url parameter' }));
            return;
          }

          enterDestination(data.url);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, url: data.url }));
        } else if (req.url === '/splash') {
          showSplash();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not found' }));
        }
      } catch (err) {
        console.error('Error handling request:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
  });

  server.listen(HTTP_CONTROL_PORT, '127.0.0.1', () => {
    console.info(`HTTP control server listening on http://127.0.0.1:${HTTP_CONTROL_PORT}`);
    console.info(`  POST /navigate - Navigate to URL: {"url": "https://example.com"}`);
    console.info(`  POST /splash   - Return to splash screen`);
  });

  server.on('error', (err) => {
    console.error('HTTP server error:', err.message);
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  
  // Start control interfaces
  startHttpControlServer();
  
  if (WORKSTATION_WS_URL) {
    connectWebSocket();
  } else {
    console.info('WORKSTATION_WS_URL not set, WebSocket client disabled');
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // Clean up WebSocket connection
  if (ws) {
    ws.close();
  }
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }
});

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
