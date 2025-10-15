const { contextBridge } = require('electron');

// Minimal preload - no kiosk-specific APIs needed
// Can be extended in the future for additional functionality

contextBridge.exposeInMainWorld('electron', {
  // Placeholder for future APIs
  version: process.versions.electron,
  platform: process.platform
});

console.log('[Preload] Context bridge initialized');
