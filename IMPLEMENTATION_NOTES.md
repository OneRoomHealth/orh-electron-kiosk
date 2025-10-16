# Implementation Notes - State Management System v1.0.9

## Technical Summary

This document provides technical details for developers working on or maintaining the OneRoom Health Kiosk state management system.

## Architecture

### State Management Flow

```
User/System Command
    ↓
HTTP/WebSocket API
    ↓
setState(state, params)
    ↓
buildUrlWithParams(baseUrl, params)
    ↓
enterDestination(url) OR showSplash()
    ↓
BrowserView/MainWindow Update
```

### File Structure

```
electron/
├── main-states.js          # Main process with state management
├── preload.js              # Minimal preload script
├── renderer/
│   ├── splash.html         # Screensaver display
│   └── assets/
│       └── background.png  # Background image
└── installer.nsh           # NSIS installer with user type dialog

.env                        # Runtime configuration
package.json               # Entry: electron/main-states.js
```

## Key Implementation Details

### 1. Bug Fix - BrowserView Alignment

**Problem**: `getBounds()` includes window frame dimensions  
**Solution**: Use `getContentBounds()` for proper alignment  
**Locations**: `electron/main-states.js` lines 76, 121

```javascript
// Before (WRONG)
const bounds = mainWindow.getBounds();

// After (CORRECT)
const bounds = mainWindow.getContentBounds();
```

### 2. State System

**States Object**:
```javascript
const STATE_URLS = {
  screensaver: 'splash',  // Local file
  carescape: 'https://...',
  inSession: 'https://...',
  goodbye: 'https://...'
};
```

**State Tracking**:
```javascript
let currentState = 'screensaver';
let stateParams = {}; // {roomId, inviteId, inviteToken}
```

### 3. URL Building

Query parameters are appended automatically:

```javascript
function buildUrlWithParams(baseUrl, params) {
  const url = new URL(baseUrl);
  Object.keys(params).forEach(key => {
    if (params[key]) url.searchParams.set(key, params[key]);
  });
  return url.toString();
}
```

Result: `https://example.com/care?roomId=123&inviteId=456`

### 4. HTTP API Implementation

Using Node's built-in `http` module:

```javascript
http.createServer((req, res) => {
  // Parse JSON body
  // Route to appropriate state function
  // Return JSON response
}).listen(HTTP_CONTROL_PORT, '127.0.0.1');
```

**CORS Headers**: Enabled for local development  
**Binding**: localhost only (not externally accessible)  
**Authentication**: None (assumes local-only access)

### 5. WebSocket Client

Using `ws` package:

```javascript
const ws = new WebSocket(WORKSTATION_WS_URL);

ws.on('message', (data) => {
  const message = JSON.parse(data);
  // Route based on message.type
});

ws.on('close', () => {
  // Exponential backoff reconnection
});
```

**Reconnection**: 1s → 2s → 4s → 8s → 30s max

### 6. Installation Wizard

Custom NSIS page using nsDialogs:

```nsis
Function UserTypePageCreate
  ${NSD_CreateDropList} "LED CareWall Display" / "Provider Workstation"
FunctionEnd

Function UserTypePageLeave
  # Store selection in $UserType variable
FunctionEnd

!macro customInstall
  # Write .env file with $UserType
FunctionEnd
```

## Configuration Precedence

1. Environment variables (`.env` file)
2. Default values in code
3. Installer-generated config

## State Transition Logic

```javascript
function setState(state, params) {
  // Validate state exists
  if (!STATE_URLS[state]) return;
  
  // Update tracking
  currentState = state;
  stateParams = params;
  
  // Handle screensaver special case
  if (state === 'screensaver' || STATE_URLS[state] === 'splash') {
    return showSplash();
  }
  
  // Build URL and navigate
  const url = buildUrlWithParams(STATE_URLS[state], params);
  enterDestination(url);
}
```

## Error Handling

- **HTTP errors**: Return 500 with error message
- **WebSocket errors**: Log and attempt reconnection
- **Invalid state**: Log error, return 400
- **Missing window**: Check existence before operations

## Security Considerations

### What's Secured
- HTTP API bound to localhost (127.0.0.1)
- Context isolation enabled (`contextIsolation: true`)
- Sandbox enabled for renderer processes
- No nodeIntegration in renderers

### What's NOT Secured
- No authentication on HTTP API
- No domain allowlists
- No navigation restrictions
- DevTools accessible (F12)

**For production kiosk deployments**, consider:
- Adding HTTP Basic Auth
- Implementing domain allowlists
- Blocking DevTools in production

## Performance Considerations

- **BrowserView reuse**: Single BrowserView instance reused across navigations
- **Auto-resize**: BrowserView automatically resizes with window
- **Memory**: Old BrowserView destroyed before creating new one
- **Reconnection**: Exponential backoff prevents connection spam

## Testing Hooks

```bash
# Status inspection
curl -X POST http://localhost:8787/status

# Returns:
{
  "userType": "ledcarewall",
  "currentState": "inSession",
  "stateParams": {"roomId": "123"},
  "availableStates": ["screensaver", "carescape", "inSession", "goodbye"]
}
```

## Logging

All operations logged to console:
```javascript
console.info('Transitioning to state:', state, params);
console.error('Error handling request:', err);
```

**In production**: Use process managers (PM2, systemd) to capture logs

## Extension Points

### Adding New States

1. Add to `.env`:
   ```bash
   NEW_STATE_URL=https://...
   ```

2. Add to `STATE_URLS` object:
   ```javascript
   const STATE_URLS = {
     // existing states...
     newState: process.env.NEW_STATE_URL
   };
   ```

3. Add endpoint (optional):
   ```javascript
   else if (req.url === '/new-state') {
     setState('newState', data.params);
   }
   ```

### Adding New Parameters

Parameters are automatically appended to URLs:

```javascript
setState('carescape', {
  roomId: '123',
  inviteId: '456',
  newParam: 'value'  // Automatically included
});
```

Result: `?roomId=123&inviteId=456&newParam=value`

## Debugging

### Enable Electron DevTools
```javascript
// In main-states.js, add:
mainWindow.webContents.openDevTools();
```

### Verbose Logging
All state changes already logged. Add more:
```javascript
console.log('Current state:', currentState);
console.log('State params:', stateParams);
```

### Network Inspection
Use browser DevTools Network tab to inspect:
- Loaded URLs
- Query parameters
- Request/response data

## Known Limitations

1. **Single BrowserView**: Only one destination at a time
2. **No state persistence**: State lost on restart
3. **No state history**: Can't go "back" to previous state
4. **Parameter types**: All converted to strings in URL

## Future Enhancements

Potential improvements for future versions:

1. **State persistence**: Remember state across restarts
2. **State history**: Track state transitions
3. **Auto-transitions**: Timeout-based state changes
4. **Multi-display**: Support multiple windows/displays
5. **Authentication**: Add auth to HTTP/WebSocket APIs
6. **Analytics**: State duration tracking

## Troubleshooting Commands

```bash
# Check if app is running
curl -X POST http://localhost:8787/status

# Check environment
cat .env

# Check process
ps aux | grep electron  # Linux/macOS
tasklist | findstr electron  # Windows

# Check port usage
lsof -i :8787  # Linux/macOS
netstat -ano | findstr :8787  # Windows
```

## Version Information

- **Implementation Date**: October 16, 2025
- **Version**: 1.0.9
- **Node.js**: 20.x or higher
- **Electron**: 27.0.0
- **Dependencies**: dotenv, ws

## Documentation Cross-Reference

- **User Guide**: [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md)
- **Quick Start**: [QUICKSTART.md](./QUICKSTART.md)
- **Migration**: [MIGRATION.md](./MIGRATION.md)
- **Version History**: [CHANGELOG.md](./CHANGELOG.md)
- **Main README**: [README.md](./README.md)

---

For questions or contributions, contact the OneRoom Health development team.
