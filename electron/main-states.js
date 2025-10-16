const { app, BrowserWindow, BrowserView } = require('electron');
const path = require('path');
const http = require('http');
const autostart = require('./autostart');
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
const USER_TYPE = (process.env.USER_TYPE || 'ledcarewall').toLowerCase();
const AUTO_START = process.env.AUTO_START !== 'false'; // Default: true

// State URLs from environment - configured based on user type
const STATE_URLS = USER_TYPE === 'provider' ? {
  // Provider workstation - 2 states only
  screensaver: process.env.PROVIDER_SCREENSAVER_URL || 'https://fe-app.oneroomhealth.app/wall/provider-display/screensaver',
  inSession: process.env.PROVIDER_IN_SESSION_URL || 'https://fe-app.oneroomhealth.app/extensionproviderview',
} : {
  // LED CareWall Display - 4 states
  screensaver: process.env.SCREENSAVER_URL || 'splash',
  carescape: process.env.CARESCAPE_URL || 'https://fe-app.oneroomhealth.app/ledwallview/care',
  inSession: process.env.IN_SESSION_URL || 'https://fe-app.oneroomhealth.app/ledwallview/ma',
  goodbye: process.env.GOODBYE_URL || 'https://fe-app.oneroomhealth.app/ledwallview/endAppt',
};

// States that use exact URLs (no params appended)
const EXACT_URL_STATES = {
  'provider': ['screensaver'],  // Provider screensaver is exact
  'ledcarewall': ['screensaver'] // LED screensaver is exact (splash or URL)
};

// Current state tracking
let currentState = 'screensaver';
let stateParams = {}; // For storing roomId, inviteId, inviteToken, etc.

console.log('OneRoom Health Kiosk - State Management');
console.log('User Type:', USER_TYPE);
console.log('Available States:', Object.keys(STATE_URLS));

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
 * Build URL with query parameters
 * @param {string} baseUrl - Base URL
 * @param {object} params - Query parameters
 * @returns {string} URL with query parameters
 */
function buildUrlWithParams(baseUrl, params = {}) {
  if (!params || Object.keys(params).length === 0) {
    return baseUrl;
  }

  const url = new URL(baseUrl);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      url.searchParams.set(key, params[key]);
    }
  });
  return url.toString();
}

/**
 * Transition to a specific state
 * @param {string} state - State name ('screensaver', 'carescape', 'inSession', 'goodbye')
 * @param {object} params - Optional parameters (roomId, inviteId, inviteToken, etc.)
 */
function setState(state, params = {}) {
  if (!STATE_URLS[state]) {
    console.error('Unknown state:', state);
    console.log('Available states:', Object.keys(STATE_URLS));
    return;
  }

  currentState = state;
  stateParams = { ...params };

  console.info(`Transitioning to state: ${state}`, params);

  const stateUrl = STATE_URLS[state];

  // Handle local splash screen (only if explicitly set to 'splash')
  if (stateUrl === 'splash') {
    console.info('Loading local splash screen');
    showSplash();
    return;
  }

  // Check if this state uses exact URL (no params)
  const exactUrlStates = EXACT_URL_STATES[USER_TYPE] || [];
  const useExactUrl = exactUrlStates.includes(state);

  // Build URL (with or without parameters)
  const url = useExactUrl ? stateUrl : buildUrlWithParams(stateUrl, params);
  
  console.info(`Loading URL: ${url}${useExactUrl ? ' (exact URL, no params)' : ' (with params)'}`);
  
  enterDestination(url);
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

  // Set bounds to fill the window content area (excluding frame)
  const bounds = mainWindow.getContentBounds();
  currentView.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
  currentView.setAutoResize({ width: true, height: true });

  // Load the URL
  currentView.webContents.loadURL(url);

  // Clear the main window content (show blank while BrowserView loads)
  mainWindow.loadURL('about:blank');
}

/**
 * Convenience functions for each state
 */
function showScreensaver() {
  setState('screensaver');
}

function showCarescape(params = {}) {
  setState('carescape', params);
}

function showInSession(params = {}) {
  setState('inSession', params);
}

function showGoodbye(params = {}) {
  setState('goodbye', params);
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
      const bounds = mainWindow.getContentBounds();
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

        // Legacy support for navigate and splash
        if (message.type === 'navigate' && message.url) {
          enterDestination(message.url);
        } else if (message.type === 'splash') {
          showSplash();
        }
        // New state-based commands
        else if (message.type === 'state' && message.state) {
          setState(message.state, message.params || {});
        }
        // Convenience state shortcuts
        else if (message.type === 'screensaver') {
          showScreensaver();
        } else if (message.type === 'carescape') {
          showCarescape(message.params || {});
        } else if (message.type === 'inSession' || message.type === 'in-session') {
          showInSession(message.params || {});
        } else if (message.type === 'goodbye') {
          showGoodbye(message.params || {});
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
        // Legacy endpoints
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
        } 
        else if (req.url === '/splash') {
          showSplash();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, state: 'screensaver' }));
        }
        // New state-based endpoints
        else if (req.url === '/state') {
          const data = JSON.parse(body);
          if (!data.state) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing state parameter' }));
            return;
          }

          setState(data.state, data.params || {});
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, state: data.state, params: data.params }));
        }
        else if (req.url === '/screensaver') {
          showScreensaver();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, state: 'screensaver' }));
        }
        else if (req.url === '/carescape') {
          const data = body ? JSON.parse(body) : {};
          showCarescape(data.params || data);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, state: 'carescape', params: data.params || data }));
        }
        else if (req.url === '/in-session' || req.url === '/inSession') {
          const data = body ? JSON.parse(body) : {};
          showInSession(data.params || data);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, state: 'inSession', params: data.params || data }));
        }
        else if (req.url === '/goodbye') {
          const data = body ? JSON.parse(body) : {};
          showGoodbye(data.params || data);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, state: 'goodbye', params: data.params || data }));
        }
        else if (req.url === '/status') {
          // Get current status
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: true, 
            userType: USER_TYPE,
            currentState: currentState,
            stateParams: stateParams,
            availableStates: Object.keys(STATE_URLS)
          }));
        }
        else {
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
    console.info('Available endpoints:');
    console.info('  POST /state        - Set state: {"state": "carescape", "params": {"roomId": "123"}}');
    console.info('  POST /screensaver  - Show screensaver');
    console.info('  POST /carescape    - Show carescape: {"roomId": "123", "inviteId": "456"}');
    console.info('  POST /in-session   - Show in-session view: {"roomId": "123"}');
    console.info('  POST /goodbye      - Show goodbye screen');
    console.info('  POST /status       - Get current state');
    console.info('  POST /navigate     - (Legacy) Navigate to URL: {"url": "https://example.com"}');
    console.info('  POST /splash       - (Legacy) Return to splash screen');
  });

  server.on('error', (err) => {
    console.error('HTTP server error:', err.message);
  });
}

// App lifecycle
app.whenReady().then(async () => {
  createWindow();
  
  // Configure auto-start on system boot
  if (AUTO_START) {
    try {
      await autostart.enable();
      console.info('Auto-start enabled');
    } catch (error) {
      console.error('Failed to enable auto-start:', error.message);
    }
  } else {
    console.info('Auto-start disabled by configuration');
  }
  
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
