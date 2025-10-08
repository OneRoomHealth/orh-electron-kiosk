const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Send messages to main process
  send: (channel, data) => {
    // Whitelist channels
    const validChannels = ['quit-app'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  
  // Receive messages from main process
  on: (channel, func) => {
    const validChannels = ['session-data'];
    if (validChannels.includes(channel)) {
      // Strip event as it includes `sender` 
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  
  // One-time listener
  once: (channel, func) => {
    const validChannels = ['session-data'];
    if (validChannels.includes(channel)) {
      ipcRenderer.once(channel, (event, ...args) => func(...args));
    }
  }
});

// Inject kiosk mode information
contextBridge.exposeInMainWorld('kioskMode', {
  enabled: true,
  exitShortcut: 'Ctrl+Alt+X'
});

// Expose exit trigger for 5-tap corner control
contextBridge.exposeInMainWorld('kioskExit', {
  triggerExit: () => {
    console.log('[Preload] triggerExit called, sending IPC message...');
    try {
      ipcRenderer.send('kiosk-exit-trigger');
      console.log('[Preload] IPC message sent successfully');
    } catch (error) {
      console.error('[Preload] Error sending IPC message:', error);
    }
  }
});

console.log('[Preload] kioskExit exposed to window object');